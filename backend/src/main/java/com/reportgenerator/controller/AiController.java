package com.reportgenerator.controller;

import com.reportgenerator.dto.ChatRequest;
import com.reportgenerator.dto.ChatResponse;
import com.reportgenerator.service.AiService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/ai")
@PreAuthorize("hasRole('MANAGER')")
public class AiController {

    @Autowired
    private AiService aiService;

    @PostMapping("/chat")
    public ResponseEntity<?> askAssistant(@Valid @RequestBody ChatRequest chatRequest) {
        String response = aiService.askAssistant(chatRequest.getMessage());
        return ResponseEntity.ok(new ChatResponse(response));
    }
}
