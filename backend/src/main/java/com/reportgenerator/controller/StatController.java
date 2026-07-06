package com.reportgenerator.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.reportgenerator.model.Project;
import com.reportgenerator.model.Report;
import com.reportgenerator.model.Role;
import com.reportgenerator.model.User;
import com.reportgenerator.repository.ProjectRepository;
import com.reportgenerator.repository.ReportRepository;
import com.reportgenerator.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/stats")
@PreAuthorize("hasRole('MANAGER')")
public class StatController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private ProjectRepository projectRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private LocalDate getMondayOfWeek(LocalDate date) {
        return date.with(DayOfWeek.MONDAY);
    }

    @GetMapping
    public ResponseEntity<?> getDashboardStats(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate week) {
        
        LocalDate targetWeek = getMondayOfWeek(week != null ? week : LocalDate.now());

        // 1. Total Members
        List<User> members = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.MEMBER)
                .toList();
        long totalMembers = members.size();

        // 2. Reports in the target week
        List<Report> reportsThisWeek = reportRepository.findByWeekStart(targetWeek);

        long submittedCount = reportsThisWeek.stream()
                .filter(r -> "SUBMITTED".equals(r.getStatus()))
                .count();

        long pendingCount = Math.max(0, totalMembers - submittedCount);

        double complianceRate = totalMembers > 0 
                ? ((double) submittedCount / totalMembers) * 100 
                : 0.0;

        // 3. Count blockers
        long openBlockersCount = 0;
        for (Report report : reportsThisWeek) {
            if ("SUBMITTED".equals(report.getStatus())) {
                openBlockersCount += parseJsonListSize(report.getBlockers());
            }
        }

        // 4. Project Distribution (Workload / task distribution by project)
        List<Project> allProjects = projectRepository.findAll();
        List<Map<String, Object>> projectDistribution = new ArrayList<>();
        for (Project project : allProjects) {
            long reportCount = reportsThisWeek.stream()
                    .filter(r -> r.getProject().getId().equals(project.getId()) && "SUBMITTED".equals(r.getStatus()))
                    .count();
            
            long totalHours = reportsThisWeek.stream()
                    .filter(r -> r.getProject().getId().equals(project.getId()) && "SUBMITTED".equals(r.getStatus()))
                    .mapToLong(r -> r.getHoursWorked() != null ? r.getHoursWorked() : 0)
                    .sum();
            
            if (reportCount > 0 || totalHours > 0) {
                Map<String, Object> dist = new HashMap<>();
                dist.put("id", project.getId());
                dist.put("name", project.getName());
                dist.put("reportCount", reportCount);
                dist.put("totalHours", totalHours);
                projectDistribution.add(dist);
            }
        }

        // 5. Report submission status by team member
        List<Map<String, Object>> memberSubmissionStatus = new ArrayList<>();
        for (User member : members) {
            Optional<Report> repOpt = reportsThisWeek.stream()
                    .filter(r -> r.getUser().getId().equals(member.getId()))
                    .findFirst();

            Map<String, Object> mStat = new HashMap<>();
            mStat.put("userId", member.getId());
            mStat.put("name", member.getName());
            mStat.put("email", member.getEmail());
            
            if (repOpt.isPresent()) {
                mStat.put("status", repOpt.get().getStatus()); // "DRAFT" or "SUBMITTED"
                mStat.put("reportId", repOpt.get().getId());
                mStat.put("submittedAt", repOpt.get().getSubmittedAt());
            } else {
                mStat.put("status", "PENDING");
                mStat.put("reportId", null);
                mStat.put("submittedAt", null);
            }
            memberSubmissionStatus.add(mStat);
        }

        // 6. Tasks completed trend over time (past 4 weeks)
        List<Map<String, Object>> tasksCompletedTrend = new ArrayList<>();
        for (int i = 3; i >= 0; i--) {
            LocalDate w = targetWeek.minusWeeks(i);
            List<Report> reps = reportRepository.findByWeekStart(w);
            long tasksCount = 0;
            for (Report r : reps) {
                if ("SUBMITTED".equals(r.getStatus())) {
                    tasksCount += parseJsonListSize(r.getTasksCompleted());
                }
            }
            Map<String, Object> trend = new HashMap<>();
            trend.put("weekStart", w.toString());
            trend.put("tasksCompleted", tasksCount);
            tasksCompletedTrend.add(trend);
        }

        // 7. Recent reports / activity feed
        List<Report> allReports = reportRepository.findAll();
        List<Map<String, Object>> recentActivity = allReports.stream()
                .filter(r -> "SUBMITTED".equals(r.getStatus()))
                .sorted((a, b) -> {
                    if (a.getSubmittedAt() == null) return 1;
                    if (b.getSubmittedAt() == null) return -1;
                    return b.getSubmittedAt().compareTo(a.getSubmittedAt());
                })
                .limit(10)
                .map(r -> {
                    Map<String, Object> act = new HashMap<>();
                    act.put("id", r.getId());
                    act.put("userName", r.getUser().getName());
                    act.put("projectName", r.getProject().getName());
                    act.put("weekStart", r.getWeekStart().toString());
                    act.put("submittedAt", r.getSubmittedAt());
                    return act;
                })
                .toList();

        // Package results
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalMembers", totalMembers);
        stats.put("submittedCount", submittedCount);
        stats.put("pendingCount", pendingCount);
        stats.put("complianceRate", Math.round(complianceRate * 10.0) / 10.0);
        stats.put("openBlockersCount", openBlockersCount);
        stats.put("projectDistribution", projectDistribution);
        stats.put("memberSubmissionStatus", memberSubmissionStatus);
        stats.put("tasksCompletedTrend", tasksCompletedTrend);
        stats.put("recentActivity", recentActivity);

        return ResponseEntity.ok(stats);
    }

    private int parseJsonListSize(String jsonStr) {
        if (jsonStr == null || jsonStr.trim().isEmpty()) {
            return 0;
        }
        try {
            List<String> list = objectMapper.readValue(jsonStr, new TypeReference<List<String>>() {});
            // Filter out empty or whitespace-only items
            return (int) list.stream().filter(s -> s != null && !s.trim().isEmpty()).count();
        } catch (Exception e) {
            // Fallback for standard comma separated text
            if (jsonStr.startsWith("[")) {
                return 0;
            }
            return (int) Arrays.stream(jsonStr.split(";"))
                    .filter(s -> !s.trim().isEmpty())
                    .count();
        }
    }
}
