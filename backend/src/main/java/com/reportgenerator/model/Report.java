package com.reportgenerator.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
public class Report {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(name = "week_start", nullable = false)
    private LocalDate weekStart; // Stores the Monday date of the reporting week

    @Column(name = "tasks_completed", nullable = false, columnDefinition = "TEXT")
    private String tasksCompleted; // JSON string array of tasks completed

    @Column(name = "tasks_planned", nullable = false, columnDefinition = "TEXT")
    private String tasksPlanned; // JSON string array of planned tasks

    @Column(nullable = false, columnDefinition = "TEXT")
    private String blockers; // JSON string array of blockers

    @Column(name = "hours_worked")
    private Integer hoursWorked;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false)
    private String status; // 'DRAFT' or 'SUBMITTED'

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(name = "read_by_manager", nullable = false)
    private boolean readByManager = false;

    public Report() {
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public boolean isReadByManager() {
        return readByManager;
    }

    public void setReadByManager(boolean readByManager) {
        this.readByManager = readByManager;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
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

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
