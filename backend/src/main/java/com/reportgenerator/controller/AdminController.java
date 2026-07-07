package com.reportgenerator.controller;

import com.reportgenerator.model.User;
import com.reportgenerator.repository.UserRepository;
import com.reportgenerator.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('MANAGER')")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private com.reportgenerator.repository.ActivityLogRepository activityLogRepository;

    @GetMapping("/registrations")
    public ResponseEntity<?> getPendingRegistrations() {
        List<User> pendingUsers = userRepository.findByApprovedFalse();
        return ResponseEntity.ok(pendingUsers);
    }

    @PutMapping("/registrations/{id}/approve")
    public ResponseEntity<?> approveRegistration(@PathVariable Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        if (user.isApproved()) {
            return ResponseEntity.badRequest().body("Error: User is already approved.");
        }

        user.setApproved(true);
        userRepository.save(user);

        // Save activity log
        try {
            activityLogRepository.save(new com.reportgenerator.model.ActivityLog(
                "Registration request for " + user.getName() + " approved by Administrator.", 
                "USER_APPROVAL"
            ));
        } catch (Exception e) {
            System.err.println("⚠️ Failed to write activity log: " + e.getMessage());
        }

        // Send confirmation email
        emailService.sendRegistrationApprovalEmail(user.getEmail(), user.getName());

        return ResponseEntity.ok("User approved successfully, email notification sent.");
    }

    @DeleteMapping("/registrations/{id}/decline")
    public ResponseEntity<?> declineRegistration(@PathVariable Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        if (user.isApproved()) {
            return ResponseEntity.badRequest().body("Error: Approved users cannot be declined. Delete them instead.");
        }

        userRepository.delete(user);

        // Save activity log
        try {
            activityLogRepository.save(new com.reportgenerator.model.ActivityLog(
                "Registration request for " + user.getName() + " declined by Administrator.", 
                "USER_DECLINE"
            ));
        } catch (Exception e) {
            System.err.println("⚠️ Failed to write activity log: " + e.getMessage());
        }

        // Send decline notification email to user
        try {
            emailService.sendRegistrationDeclineEmail(user.getEmail(), user.getName());
        } catch (Exception e) {
            System.err.println("⚠️ Failed to send registration decline email: " + e.getMessage());
        }

        return ResponseEntity.ok("Registration request declined and deleted successfully.");
    }
}
