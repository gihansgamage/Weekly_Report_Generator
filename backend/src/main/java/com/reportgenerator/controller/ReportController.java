package com.reportgenerator.controller;

import com.reportgenerator.dto.ReportRequest;
import com.reportgenerator.model.Project;
import com.reportgenerator.model.Report;
import com.reportgenerator.model.User;
import com.reportgenerator.repository.ProjectRepository;
import com.reportgenerator.model.Role;
import com.reportgenerator.repository.ReportRepository;
import com.reportgenerator.repository.UserRepository;
import com.reportgenerator.security.UserDetailsImpl;
import com.reportgenerator.service.EmailService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private com.reportgenerator.repository.ActivityLogRepository activityLogRepository;

    private LocalDate getMondayOfWeek(LocalDate date) {
        return date.with(DayOfWeek.MONDAY);
    }

    @GetMapping("/history")
    public ResponseEntity<?> getOwnHistory(Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Optional<User> userOpt = userRepository.findById(userDetails.getId());
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("User not found");
        }
        List<Report> reports = reportRepository.findByUserOrderByWeekStartDesc(userOpt.get());
        return ResponseEntity.ok(reports);
    }

    @GetMapping("/activity")
    public ResponseEntity<?> getRecentActivity() {
        List<com.reportgenerator.model.ActivityLog> logs = activityLogRepository.findAllByOrderByTimestampDesc();
        if (logs.isEmpty()) {
            List<Report> allReports = reportRepository.findAll();
            return ResponseEntity.ok(allReports.stream()
                .filter(r -> "SUBMITTED".equals(r.getStatus()))
                .sorted((a, b) -> {
                    if (a.getSubmittedAt() == null) return 1;
                    if (b.getSubmittedAt() == null) return -1;
                    return b.getSubmittedAt().compareTo(a.getSubmittedAt());
                })
                .limit(10)
                .map(r -> new com.reportgenerator.model.ActivityLog(r.getUser().getName() + " submitted weekly report for " + r.getProject().getName(), "REPORT_SUBMISSION"))
                .toList());
        }
        return ResponseEntity.ok(logs);
    }

    @GetMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<?> getFilteredReports(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long projectId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        List<Report> reports = reportRepository.findByFilters(userId, projectId, startDate, endDate);
        return ResponseEntity.ok(reports);
    }

    @PostMapping
    public ResponseEntity<?> createReport(@Valid @RequestBody ReportRequest request, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Optional<User> userOpt = userRepository.findById(userDetails.getId());
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("User not found");
        }
        User user = userOpt.get();

        Optional<Project> projectOpt = projectRepository.findById(request.getProjectId());
        if (projectOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Project category not found");
        }

        LocalDate monday = getMondayOfWeek(request.getWeekStart());

        Optional<Report> existingReportOpt = reportRepository.findByUserIdAndWeekStart(user.getId(), monday);
        if (existingReportOpt.isPresent()) {
            return ResponseEntity.badRequest().body("Error: A report already exists for the week of " + monday + ". Please update the existing entry instead.");
        }

        Report report = new Report();
        report.setUser(user);
        report.setProject(projectOpt.get());
        report.setWeekStart(monday);
        report.setTasksCompleted(request.getTasksCompleted());
        report.setTasksPlanned(request.getTasksPlanned());
        report.setBlockers(request.getBlockers());
        report.setHoursWorked(request.getHoursWorked());
        report.setNotes(request.getNotes());
        
        String reqStatus = request.getStatus().toUpperCase();
        if (!reqStatus.equals("DRAFT") && !reqStatus.equals("SUBMITTED")) {
            return ResponseEntity.badRequest().body("Error: Invalid report status");
        }
        report.setStatus(reqStatus);
        
        if (reqStatus.equals("SUBMITTED")) {
            report.setSubmittedAt(LocalDateTime.now());
        }

        Report savedReport = reportRepository.save(report);

        if (reqStatus.equals("SUBMITTED")) {
            try {
                activityLogRepository.save(new com.reportgenerator.model.ActivityLog(
                    savedReport.getUser().getName() + " submitted weekly report for " + savedReport.getProject().getName(), 
                    "REPORT_SUBMISSION"
                ));
            } catch (Exception e) {
                System.err.println("⚠️ Failed to write activity log: " + e.getMessage());
            }

            try {
                emailService.sendReportSubmissionConfirmationToUser(user, savedReport);
                List<User> managers = userRepository.findByRoleAndApprovedTrue(Role.MANAGER);
                if (!managers.isEmpty()) {
                    emailService.sendReportSubmissionNotificationToManagers(user, savedReport, managers);
                }
            } catch (Exception e) {
                System.err.println("⚠️ Failed to send report submission emails: " + e.getMessage());
            }
        }
        return ResponseEntity.ok(savedReport);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateReport(@PathVariable Long id, @Valid @RequestBody ReportRequest request, Authentication authentication) {
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        Optional<Report> reportOpt = reportRepository.findById(id);
        if (reportOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Report report = reportOpt.get();
        boolean isManager = userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_MANAGER"));

        if (!report.getUser().getId().equals(userDetails.getId()) && !isManager) {
            return ResponseEntity.status(403).body("Error: You do not have permission to modify this report.");
        }

        Optional<Project> projectOpt = projectRepository.findById(request.getProjectId());
        if (projectOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Project category not found");
        }

        LocalDate monday = getMondayOfWeek(request.getWeekStart());

        if (!report.getWeekStart().equals(monday)) {
            Optional<Report> existingReportOpt = reportRepository.findByUserIdAndWeekStart(report.getUser().getId(), monday);
            if (existingReportOpt.isPresent() && !existingReportOpt.get().getId().equals(id)) {
                return ResponseEntity.badRequest().body("Error: A different report already exists for the week of " + monday);
            }
        }

        report.setProject(projectOpt.get());
        report.setWeekStart(monday);
        report.setTasksCompleted(request.getTasksCompleted());
        report.setTasksPlanned(request.getTasksPlanned());
        report.setBlockers(request.getBlockers());
        report.setHoursWorked(request.getHoursWorked());
        report.setNotes(request.getNotes());

        String reqStatus = request.getStatus().toUpperCase();
        if (!reqStatus.equals("DRAFT") && !reqStatus.equals("SUBMITTED")) {
            return ResponseEntity.badRequest().body("Error: Invalid report status");
        }

        if (reqStatus.equals("SUBMITTED")) {
            report.setSubmittedAt(LocalDateTime.now());
            report.setReadByManager(false);
        }
        report.setStatus(reqStatus);

        Report updatedReport = reportRepository.save(report);

        if (reqStatus.equals("SUBMITTED")) {
            try {
                activityLogRepository.save(new com.reportgenerator.model.ActivityLog(
                    updatedReport.getUser().getName() + " submitted weekly report for " + updatedReport.getProject().getName(), 
                    "REPORT_SUBMISSION"
                ));
            } catch (Exception e) {
                System.err.println("⚠️ Failed to write activity log: " + e.getMessage());
            }

            try {
                emailService.sendReportSubmissionConfirmationToUser(updatedReport.getUser(), updatedReport);
                List<User> managers = userRepository.findByRoleAndApprovedTrue(Role.MANAGER);
                if (!managers.isEmpty()) {
                    emailService.sendReportSubmissionNotificationToManagers(updatedReport.getUser(), updatedReport, managers);
                }
            } catch (Exception e) {
                System.err.println("⚠️ Failed to send report submission emails: " + e.getMessage());
            }
        }
        return ResponseEntity.ok(updatedReport);
    }

    @PutMapping("/{id}/read")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        Optional<Report> reportOpt = reportRepository.findById(id);
        if (reportOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Report report = reportOpt.get();
        report.setReadByManager(true);
        reportRepository.save(report);
        return ResponseEntity.ok("Report marked as read");
    }

    @PutMapping("/{id}/suggestions")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<?> updateSuggestions(@PathVariable Long id, @RequestBody java.util.Map<String, String> requestBody) {
        Optional<Report> reportOpt = reportRepository.findById(id);
        if (reportOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Report report = reportOpt.get();
        String suggestions = requestBody.get("suggestions");
        report.setBlockerSuggestions(suggestions);
        Report savedReport = reportRepository.save(report);

        // Save activity log
        try {
            activityLogRepository.save(new com.reportgenerator.model.ActivityLog(
                "Manager suggested solutions for blockers in " + report.getUser().getName() + "'s report.", 
                "MANAGER_FEEDBACK"
            ));
        } catch (Exception e) {
            System.err.println("⚠️ Failed to write activity log: " + e.getMessage());
        }

        // Send email notification to report owner
        try {
            emailService.sendBlockerSuggestionsEmail(report.getUser(), savedReport);
        } catch (Exception e) {
            System.err.println("⚠️ Failed to send blocker suggestions notification email: " + e.getMessage());
        }

        return ResponseEntity.ok(savedReport);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReport(@PathVariable Long id, Authentication authentication) {
        Optional<Report> reportOpt = reportRepository.findById(id);
        if (reportOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Report report = reportOpt.get();
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        boolean isManager = userDetails.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_MANAGER"));

        if (!report.getUser().getId().equals(userDetails.getId()) && !isManager) {
            return ResponseEntity.status(403).body("Error: You do not have permission to delete this report.");
        }

        if (report.getStatus().equals("SUBMITTED") && !isManager) {
            return ResponseEntity.badRequest().body("Error: Submitted reports are locked and cannot be deleted.");
        }

        reportRepository.delete(report);
        return ResponseEntity.ok("Report deleted successfully.");
    }
}
