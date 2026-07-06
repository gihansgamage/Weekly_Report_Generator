package com.reportgenerator.dto;

public class AuthResponse {
    private String token;
    private Long id;
    private String email;
    private String username;
    private String name;
    private String role;

    public AuthResponse() {
    }

    public AuthResponse(String token, Long id, String email, String username, String name, String role) {
        this.token = token;
        this.id = id;
        this.email = email;
        this.username = username;
        this.name = name;
        this.role = role;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
