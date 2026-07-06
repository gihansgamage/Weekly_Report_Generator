package com.reportgenerator.controller;

import com.reportgenerator.model.Project;
import com.reportgenerator.repository.ProjectRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    @Autowired
    private ProjectRepository projectRepository;

    @GetMapping
    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<?> createProject(@Valid @RequestBody Project project) {
        if (projectRepository.existsByName(project.getName())) {
            return ResponseEntity.badRequest().body("Error: Project category name already exists!");
        }
        Project savedProject = projectRepository.save(project);
        return ResponseEntity.ok(savedProject);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<?> updateProject(@PathVariable Long id, @Valid @RequestBody Project projectDetails) {
        Optional<Project> projectOpt = projectRepository.findById(id);
        if (projectOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Project project = projectOpt.get();
        Optional<Project> duplicateOpt = projectRepository.findByName(projectDetails.getName());
        if (duplicateOpt.isPresent() && !duplicateOpt.get().getId().equals(id)) {
            return ResponseEntity.badRequest().body("Error: Project category name already exists!");
        }

        project.setName(projectDetails.getName());
        project.setDescription(projectDetails.getDescription());
        Project updatedProject = projectRepository.save(project);
        return ResponseEntity.ok(updatedProject);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<?> deleteProject(@PathVariable Long id) {
        Optional<Project> projectOpt = projectRepository.findById(id);
        if (projectOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        projectRepository.delete(projectOpt.get());
        return ResponseEntity.ok().body("Project category deleted successfully!");
    }
}
