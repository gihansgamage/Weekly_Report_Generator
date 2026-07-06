package com.reportgenerator.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class ReportRequest {
    @NotNull
    private Long projectId;

    @NotNull
    private LocalDate weekStart; // Date representing the Monday of the week

    @NotBlank
    private String tasksCompleted; // JSON array string

    @NotBlank
    private String tasksPlanned; // JSON array string

    @NotBlank
    private String blockers; // JSON array string

    private Integer hoursWorked;
    private String notes;

    @NotBlank
    private String status; // "DRAFT" or "SUBMITTED"

    public ReportRequest() {
    }

    public Long getProjectId() {
        return projectId;
    }

    public void setProjectId(Long projectId) {
        this.projectId = projectId;
    }

    public LocalDate getWeekStart() {
        return weekStart;
    }

    public void setWeekStart(LocalDate weekStart) {
        this.weekStart = weekStart;
    }

    public String getTasksCompleted() {
        return tasksCompleted;
    }

    public void setTasksCompleted(String tasksCompleted) {
        this.tasksCompleted = tasksCompleted;
    }

    public String getTasksPlanned() {
        return tasksPlanned;
    }

    public void setTasksPlanned(String tasksPlanned) {
        this.tasksPlanned = tasksPlanned;
    }

    public String getBlockers() {
        return blockers;
    }

    public void setBlockers(String blockers) {
        this.blockers = blockers;
    }

    public Integer getHoursWorked() {
        return hoursWorked;
    }

    public void setHoursWorked(Integer hoursWorked) {
        this.hoursWorked = hoursWorked;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
