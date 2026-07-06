package com.reportgenerator.controller;

import com.reportgenerator.dto.ReportRequest;
import com.reportgenerator.model.Project;
import com.reportgenerator.model.Report;
import com.reportgenerator.model.User;
import com.reportgenerator.repository.ProjectRepository;
import com.reportgenerator.repository.ReportRepository;
import com.reportgenerator.repository.UserRepository;
import com.reportgenerator.security.UserDetailsImpl;
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
    private ProjectRepository projectRepository;

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
        List<Report> allReports = reportRepository.findAll();
        List<java.util.Map<String, Object>> recentActivity = allReports.stream()
                .filter(r -> "SUBMITTED".equals(r.getStatus()))
                .sorted((a, b) -> {
                    if (a.getSubmittedAt() == null) return 1;
                    if (b.getSubmittedAt() == null) return -1;
                    return b.getSubmittedAt().compareTo(a.getSubmittedAt());
                })
                .limit(10)
                .map(r -> {
                    java.util.Map<String, Object> act = new java.util.HashMap<>();
                    act.put("id", r.getId());
                    act.put("userName", r.getUser().getName());
                    act.put("projectName", r.getProject().getName());
                    act.put("weekStart", r.getWeekStart().toString());
                    act.put("submittedAt", r.getSubmittedAt());
                    return act;
                })
                .toList();
        return ResponseEntity.ok(recentActivity);
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
        }
        report.setStatus(reqStatus);

        Report updatedReport = reportRepository.save(report);
        return ResponseEntity.ok(updatedReport);
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
