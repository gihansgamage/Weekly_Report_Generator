package com.reportgenerator.controller;

import com.reportgenerator.dto.AuthResponse;
import com.reportgenerator.dto.LoginRequest;
import com.reportgenerator.dto.RegisterRequest;
import com.reportgenerator.model.Role;
import com.reportgenerator.model.User;
import com.reportgenerator.repository.UserRepository;
import com.reportgenerator.security.JwtUtils;
import com.reportgenerator.security.UserDetailsImpl;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @org.springframework.beans.factory.annotation.Value("${google.client.id}")
    private String googleClientId;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder encoder;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private com.reportgenerator.service.EmailService emailService;

    @Autowired
    private com.reportgenerator.repository.ActivityLogRepository activityLogRepository;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
        
        String roleStr = userDetails.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
        String jwt = jwtUtils.generateJwtToken(userDetails.getUsername(), roleStr, userDetails.getId(), userDetails.getName());

        return ResponseEntity.ok(new AuthResponse(
                jwt,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getActualUsername(),
                userDetails.getName(),
                roleStr
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest signUpRequest) {
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity.badRequest().body("Error: Email is already in use!");
        }

        if (userRepository.existsByUsername(signUpRequest.getUsername().trim().toLowerCase())) {
            return ResponseEntity.badRequest().body("Error: Username is already in use!");
        }

        Role userRole = Role.MEMBER;
        try {
            userRole = Role.valueOf(signUpRequest.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Error: Invalid role " + signUpRequest.getRole());
        }

        User user = new User(
                signUpRequest.getEmail(),
                signUpRequest.getUsername().trim().toLowerCase(),
                encoder.encode(signUpRequest.getPassword()),
                signUpRequest.getName(),
                userRole
        );
        userRepository.save(user);

        // Save activity log
        try {
            activityLogRepository.save(new com.reportgenerator.model.ActivityLog(
                "New user registration request submitted by: " + user.getName() + " (" + user.getEmail() + ")", 
                "USER_REGISTRATION"
            ));
        } catch (Exception e) {
            System.err.println("⚠️ Failed to write activity log: " + e.getMessage());
        }

        // 1. Send registration acknowledgement email to the user
        try {
            String userSubject = "Sisenco Digital - Registration Request Received";
            String userBody = "Dear " + user.getName() + ",\n\n" +
                    "Your registration request has been successfully submitted to the Sisenco Digital Portal.\n" +
                    "Your account status is currently: PENDING MANAGER APPROVAL.\n\n" +
                    "You will receive another email notification as soon as the administrator/manager reviews and approves your request.\n\n" +
                    "Best regards,\n" +
                    "Sisenco Digital HR Team";
            emailService.sendEmail(user.getEmail(), userSubject, userBody);
        } catch (Exception e) {
            System.err.println("⚠️ Failed to send user registration acknowledgement email: " + e.getMessage());
        }

        // 2. Notify the administrator/manager (gsgamage4@gmail.com) of the pending request
        try {
            String adminEmail = "gsgamage4@gmail.com";
            String adminSubject = "Action Required: New User Registration Approval Pending";
            String adminBody = "Dear Administrator/Manager,\n\n" +
                    "A new user has registered on the Sisenco Digital Portal and is awaiting your approval:\n\n" +
                    "Details:\n" +
                    "- Name: " + user.getName() + "\n" +
                    "- Email: " + user.getEmail() + "\n" +
                    "- Username: @" + user.getUsername() + "\n" +
                    "- Requested Role: " + user.getRole().name() + "\n\n" +
                    "Please log into the portal and visit the approvals section to Accept or Decline this registration:\n" +
                    "Manage Approvals: http://localhost:5173/login\n\n" +
                    "Best regards,\n" +
                    "Sisenco Digital Security System";
            emailService.sendEmail(adminEmail, adminSubject, adminBody);
        } catch (Exception e) {
            System.err.println("⚠️ Failed to send manager registration notification email: " + e.getMessage());
        }

        return ResponseEntity.ok("Registration request submitted! Your account is pending manager approval.");
    }

    @GetMapping("/check-username")
    public ResponseEntity<?> checkUsername(@RequestParam String username) {
        if (username == null || username.trim().length() < 3) {
            return ResponseEntity.badRequest().body("Error: Username must be at least 3 characters.");
        }
        boolean exists = userRepository.existsByUsername(username.trim().toLowerCase());
        java.util.Map<String, Object> response = new java.util.HashMap<>();
        response.put("available", !exists);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/google-client-id")
    public ResponseEntity<?> getGoogleClientId() {
        java.util.Map<String, String> response = new java.util.HashMap<>();
        response.put("clientId", googleClientId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/google-login")
    public ResponseEntity<?> googleLogin(@RequestBody java.util.Map<String, String> request) {
        String token = request.get("token");
        if (token == null || token.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Error: Google token is required!");
        }
        
        String targetEmail = null;
        
        // Validate Google ID token via oauth2 tokeninfo api
        try {
            org.springframework.web.client.RestTemplate restTemplate = new org.springframework.web.client.RestTemplate();
            String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + token;
            java.util.Map<?, ?> tokenInfo = restTemplate.getForObject(url, java.util.Map.class);
            
            if (tokenInfo == null || tokenInfo.containsKey("error_description")) {
                return ResponseEntity.badRequest().body("Error: Invalid Google Token!");
            }
            
            targetEmail = (String) tokenInfo.get("email");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error validating Google token: " + e.getMessage());
        }
        
        if (targetEmail == null) {
            return ResponseEntity.badRequest().body("Error: Email could not be resolved.");
        }
        
        java.util.Optional<User> userOpt = userRepository.findByEmail(targetEmail);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Error: No account found matching email " + targetEmail + ". Please sign up first.");
        }
        
        User user = userOpt.get();
        if (!user.isApproved()) {
            return ResponseEntity.badRequest().body("Error: Your account is pending administrator approval.");
        }
        
        String jwt = jwtUtils.generateJwtToken(user.getEmail(), user.getRole().name(), user.getId(), user.getName());
        
        return ResponseEntity.ok(new AuthResponse(
                jwt,
                user.getId(),
                user.getEmail(),
                user.getUsername(),
                user.getName(),
                user.getRole().name()
        ));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        
        // Handle cases where principal is generic or UserDetailsImpl
        Object principal = authentication.getPrincipal();
        if (!(principal instanceof UserDetailsImpl)) {
            return ResponseEntity.status(401).body("Unauthorized principal class");
        }
        
        UserDetailsImpl userDetails = (UserDetailsImpl) principal;
        String roleStr = userDetails.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
        
        return ResponseEntity.ok(new AuthResponse(
                null,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getActualUsername(),
                userDetails.getName(),
                roleStr
        ));
    }
}
