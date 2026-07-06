package com.reportgenerator.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    public void sendEmail(String to, String subject, String body) {
        if (mailSender == null) {
            System.out.println("⚠️ SMTP JavaMailSender is not configured. Email print output:\nTo: " + to + "\nSubject: " + subject + "\nBody: " + body);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("gsgamage4@gmail.com");
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            System.out.println("📧 Email successfully sent to: " + to);
        } catch (Exception e) {
            System.err.println("❌ Failed to send email to " + to + ": " + e.getMessage());
        }
    }

    public void sendRegistrationApprovalEmail(String toEmail, String name) {
        String subject = "Sisenco Digital - Account Approved Successfully!";
        String body = "Dear " + name + ",\n\n" +
                "Great news! Your registration request has been approved by the Administrator.\n" +
                "You can now log in using your registered username/email and password, or directly with Google Sign-in.\n\n" +
                "Access Portal: http://localhost:5173/login\n\n" +
                "Best regards,\n" +
                "Sisenco Digital HR Team";
        sendEmail(toEmail, subject, body);
    }

    public void sendOtpEmail(String toEmail, String otpCode) {
        String subject = "Sisenco Digital - Profile Update OTP Verification";
        String body = "Dear Team Member,\n\n" +
                "We received a request to update your profile credentials (username/password).\n" +
                "Please use the following One-Time Password (OTP) to verify your identity:\n\n" +
                "Verification Code: " + otpCode + "\n\n" +
                "This verification code is valid for the next 5 minutes. If you did not request this update, please ignore this email or contact support.\n\n" +
                "Best regards,\n" +
                "Sisenco Digital Security Team";
        sendEmail(toEmail, subject, body);
    }
}
