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

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder encoder;

    @Autowired
    private JwtUtils jwtUtils;

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
                userDetails.getName(),
                roleStr
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest signUpRequest) {
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity.badRequest().body("Error: Email is already in use!");
        }

        Role userRole = Role.MEMBER;
        try {
            userRole = Role.valueOf(signUpRequest.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Error: Invalid role " + signUpRequest.getRole());
        }

        User user = new User(
                signUpRequest.getEmail(),
                encoder.encode(signUpRequest.getPassword()),
                signUpRequest.getName(),
                userRole
        );

        userRepository.save(user);

        return ResponseEntity.ok("User registered successfully!");
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
                userDetails.getName(),
                roleStr
        ));
    }
}
