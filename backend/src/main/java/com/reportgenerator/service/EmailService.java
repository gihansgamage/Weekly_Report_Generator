package com.reportgenerator.service;

import com.reportgenerator.model.User;
import com.reportgenerator.model.Report;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:gsgamage4@gmail.com}")
    private String fromEmail;

    /**
     * Sends a plain text email (fallback method).
     */
    public void sendEmail(String to, String subject, String body) {
        if (mailSender == null) {
            System.out.println("⚠️ SMTP JavaMailSender is not configured. Email print output:\nTo: " + to + "\nSubject: " + subject + "\nBody: " + body);
            return;
        }
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
            System.out.println("📧 Plain email successfully sent to: " + to);
        } catch (Exception e) {
            System.err.println("❌ Failed to send plain email to " + to + ": " + e.getMessage());
        }
    }

    /**
     * Sends an HTML-styled email.
     */
    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        if (mailSender == null) {
            System.out.println("⚠️ SMTP JavaMailSender is not configured. HTML email print output:\nTo: " + to + "\nSubject: " + subject + "\nHTML:\n" + htmlContent);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
            System.out.println("📧 HTML email successfully sent to: " + to);
        } catch (Exception e) {
            System.err.println("❌ Failed to send HTML email to " + to + ": " + e.getMessage());
        }
    }

    /**
     * Sends approval confirmation email to the newly registered user.
     */
    public void sendRegistrationApprovalEmail(String toEmail, String name) {
        String subject = "Sisenco Digital - Account Approved Successfully!";
        String content = "<p>Dear <strong>" + escapeHtml(name) + "</strong>,</p>\n" +
                "<p>Great news! Your registration request has been approved by the Administrator.</p>\n" +
                "<p>You can now log in using your registered username/email and password, or directly with Google Sign-in.</p>";
        String html = buildTemplate(
                "Account Approved",
                "Account Approved Successfully!",
                content,
                "Go to Dashboard",
                "http://localhost:5173/login"
        );
        sendHtmlEmail(toEmail, subject, html);
    }

    /**
     * Sends OTP code email for profile updates.
     */
    public void sendOtpEmail(String toEmail, String otpCode) {
        String subject = "Sisenco Digital - Profile Update OTP Verification";
        String content = "<p>Dear Team Member,</p>\n" +
                "<p>We received a request to update your profile credentials (username/password).</p>\n" +
                "<p>Please use the following One-Time Password (OTP) to verify your identity:</p>\n" +
                "<div style=\"background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;\">\n" +
                "    <span style=\"font-size: 32px; font-weight: 800; color: #0f172a; letter-spacing: 6px;\">" + escapeHtml(otpCode) + "</span>\n" +
                "    <div style=\"font-size: 12px; color: #64748b; margin-top: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;\">Valid for 5 minutes</div>\n" +
                "</div>\n" +
                "<p style=\"color: #64748b; font-size: 13px;\">If you did not request this update, please ignore this email or contact support immediately.</p>";
        String html = buildTemplate(
                "Profile Update Verification",
                "Verify Your Identity",
                content,
                null,
                null
        );
        sendHtmlEmail(toEmail, subject, html);
    }

    /**
     * Sends registration request acknowledgment to the user.
     */
    public void sendRegistrationAcknowledgementEmail(String toEmail, String name) {
        String subject = "Sisenco Digital - Registration Request Received";
        String content = "<p>Dear <strong>" + escapeHtml(name) + "</strong>,</p>\n" +
                "<p>Your registration request has been successfully submitted to the Sisenco Digital Portal.</p>\n" +
                "<div style=\"background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 20px 0; border-radius: 4px;\">\n" +
                "    <span style=\"color: #b45309; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;\">Status: Pending Manager Approval</span>\n" +
                "</div>\n" +
                "<p>Our administrators/managers have been notified and will review your request shortly. You will receive another email as soon as your account is activated.</p>";
        String html = buildTemplate(
                "Registration Received",
                "Registration Request Received",
                content,
                null,
                null
        );
        sendHtmlEmail(toEmail, subject, html);
    }

    /**
     * Sends registration request notification to all managers.
     */
    public void sendRegistrationNotificationToManagers(User user, java.util.List<User> managers) {
        String subject = "Action Required: New User Registration Approval Pending";
        String content = "<p>Dear Administrator/Manager,</p>\n" +
                "<p>A new user has registered on the Sisenco Digital Portal and is awaiting your approval:</p>\n" +
                "<table cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin: 20px 0; font-size: 14px;\">\n" +
                "    <tr>\n" +
                "        <td style=\"padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569;\" width=\"150\">Full Name</td>\n" +
                "        <td style=\"padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a;\"><strong>" + escapeHtml(user.getName()) + "</strong></td>\n" +
                "    </tr>\n" +
                "    <tr>\n" +
                "        <td style=\"padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569;\">Email Address</td>\n" +
                "        <td style=\"padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a;\">" + escapeHtml(user.getEmail()) + "</td>\n" +
                "    </tr>\n" +
                "    <tr>\n" +
                "        <td style=\"padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569;\">Username</td>\n" +
                "        <td style=\"padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a;\">@" + escapeHtml(user.getUsername()) + "</td>\n" +
                "    </tr>\n" +
                "    <tr>\n" +
                "        <td style=\"padding: 12px 16px; font-weight: 600; color: #475569;\">Requested Role</td>\n" +
                "        <td style=\"padding: 12px 16px; color: #0f172a;\">\n" +
                "            <span style=\"background-color: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 12px;\">" + escapeHtml(user.getRole().name()) + "</span>\n" +
                "        </td>\n" +
                "    </tr>\n" +
                "</table>\n" +
                "<p>Please click the button below to review, accept, or decline this registration request.</p>";

        String html = buildTemplate(
                "Pending Approval",
                "Action Required: Pending Registration Approval",
                content,
                "Manage Approvals",
                "http://localhost:5173/login"
        );

        for (User manager : managers) {
            sendHtmlEmail(manager.getEmail(), subject, html);
        }
    }

    /**
     * Sends report submission receipt confirmation email to the user.
     */
    public void sendReportSubmissionConfirmationToUser(User user, Report report) {
        String subject = "Sisenco Digital - Weekly Report Submitted Successfully";
        String content = "<p>Dear <strong>" + escapeHtml(user.getName()) + "</strong>,</p>\n" +
                "<p>Your weekly report has been successfully submitted to the portal.</p>\n" +
                "<table cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin: 20px 0; font-size: 14px;\">\n" +
                "    <tr>\n" +
                "        <td style=\"padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569;\" width=\"150\">Project Category</td>\n" +
                "        <td style=\"padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a;\"><strong>" + escapeHtml(report.getProject().getName()) + "</strong></td>\n" +
                "    </tr>\n" +
                "    <tr>\n" +
                "        <td style=\"padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569;\">Week Start</td>\n" +
                "        <td style=\"padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a;\">" + report.getWeekStart().toString() + "</td>\n" +
                "    </tr>\n" +
                "    <tr>\n" +
                "        <td style=\"padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569;\">Hours Worked</td>\n" +
                "        <td style=\"padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a;\">" + (report.getHoursWorked() != null ? report.getHoursWorked() : 0) + " hrs</td>\n" +
                "    </tr>\n" +
                "    <tr>\n" +
                "        <td style=\"padding: 12px 16px; font-weight: 600; color: #475569;\">Submission Status</td>\n" +
                "        <td style=\"padding: 12px 16px; color: #0f172a;\">\n" +
                "            <span style=\"background-color: #dcfce7; color: #15803d; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 12px; text-transform: uppercase;\">Submitted</span>\n" +
                "        </td>\n" +
                "    </tr>\n" +
                "</table>\n" +
                "<p>Thank you for keeping your reports up to date!</p>";
        String html = buildTemplate(
                "Report Submitted",
                "Weekly Report Submitted",
                content,
                "View My History",
                "http://localhost:5173/login"
        );
        sendHtmlEmail(user.getEmail(), subject, html);
    }

    /**
     * Sends report submission notification containing details to managers.
     */
    public void sendReportSubmissionNotificationToManagers(User user, Report report, java.util.List<User> managers) {
        String subject = "New Weekly Report Submitted by " + user.getName();
        String content = "<p>Dear Manager,</p>\n" +
                "<p>A new weekly report has been submitted on the portal:</p>\n" +
                "<table cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin: 20px 0; font-size: 14px;\">\n" +
                "    <tr>\n" +
                "        <td style=\"padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569;\" width=\"150\">Team Member</td>\n" +
                "        <td style=\"padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a;\"><strong>" + escapeHtml(user.getName()) + "</strong> (" + escapeHtml(user.getEmail()) + ")</td>\n" +
                "    </tr>\n" +
                "    <tr>\n" +
                "        <td style=\"padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569;\">Project Category</td>\n" +
                "        <td style=\"padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a;\">" + escapeHtml(report.getProject().getName()) + "</td>\n" +
                "    </tr>\n" +
                "    <tr>\n" +
                "        <td style=\"padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569;\">Week Start</td>\n" +
                "        <td style=\"padding: 12px 16px; border-bottom: 1px solid #e2e8f0; color: #0f172a;\">" + report.getWeekStart().toString() + "</td>\n" +
                "    </tr>\n" +
                "    <tr>\n" +
                "        <td style=\"padding: 12px 16px; font-weight: 600; color: #475569;\">Hours Worked</td>\n" +
                "        <td style=\"padding: 12px 16px; color: #0f172a;\">" + (report.getHoursWorked() != null ? report.getHoursWorked() : 0) + " hrs</td>\n" +
                "    </tr>\n" +
                "</table>\n" +
                "\n" +
                "<h3 style=\"color: #0f172a; font-size: 16px; font-weight: 700; margin-bottom: 10px;\">Tasks Completed</h3>\n" +
                "<div style=\"background-color: #fafafa; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; font-size: 14px; margin-bottom: 20px; line-height: 1.5;\">\n" +
                "    " + formatJsonArrayToHtml(report.getTasksCompleted()) + "\n" +
                "</div>\n" +
                "\n" +
                "<h3 style=\"color: #0f172a; font-size: 16px; font-weight: 700; margin-bottom: 10px;\">Tasks Planned</h3>\n" +
                "<div style=\"background-color: #fafafa; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; font-size: 14px; margin-bottom: 20px; line-height: 1.5;\">\n" +
                "    " + formatJsonArrayToHtml(report.getTasksPlanned()) + "\n" +
                "</div>\n" +
                "\n" +
                "<h3 style=\"color: #0f172a; font-size: 16px; font-weight: 700; margin-bottom: 10px;\">Blockers</h3>\n" +
                "<div style=\"background-color: #fafafa; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; font-size: 14px; margin-bottom: 20px; line-height: 1.5;\">\n" +
                "    " + formatJsonArrayToHtml(report.getBlockers()) + "\n" +
                "</div>";

        String html = buildTemplate(
                "New Report Submitted",
                "Weekly Report Submission",
                content,
                "View Dashboard",
                "http://localhost:5173/login"
        );

        for (User manager : managers) {
            sendHtmlEmail(manager.getEmail(), subject, html);
        }
    }

    /**
     * Sends blocker suggestions/solutions notification email to the user.
     */
    public void sendBlockerSuggestionsEmail(User user, Report report) {
        String subject = "Sisenco Digital - Manager Feedback on Blockers";
        String content = "<p>Dear <strong>" + escapeHtml(user.getName()) + "</strong>,</p>\n" +
                "<p>A manager has reviewed your weekly report for the week starting <strong>" + report.getWeekStart().toString() + "</strong> and suggested solutions for your blockers / challenges:</p>\n" +
                "\n" +
                "<h3 style=\"color: #0f172a; font-size: 16px; font-weight: 700; margin-bottom: 10px;\">Reported Blockers</h3>\n" +
                "<div style=\"background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 12px; font-size: 14px; margin-bottom: 20px; line-height: 1.5; color: #991b1b;\">\n" +
                "    " + formatJsonArrayToHtml(report.getBlockers()) + "\n" +
                "</div>\n" +
                "\n" +
                "<h3 style=\"color: #0f172a; font-size: 16px; font-weight: 700; margin-bottom: 10px;\">Manager's Solutions / Suggestions</h3>\n" +
                "<div style=\"background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 15px; font-size: 14px; margin-bottom: 20px; line-height: 1.5; color: #166534; font-weight: 500; white-space: pre-wrap;\">\n" +
                "    " + escapeHtml(report.getBlockerSuggestions()) + "\n" +
                "</div>";

        String html = buildTemplate(
                "Feedback on Blockers",
                "Manager Blocker Suggestions",
                content,
                "View My Reports",
                "http://localhost:5173/login"
        );
        sendHtmlEmail(user.getEmail(), subject, html);
    }

    /**
     * Builds the premium styled HTML template.
     */
    private String buildTemplate(String title, String heading, String contentHtml, String ctaText, String ctaUrl) {
        String ctaButton = "";
        if (ctaText != null && !ctaText.isEmpty() && ctaUrl != null && !ctaUrl.isEmpty()) {
            ctaButton = "<div style=\"margin: 30px 0; text-align: center;\">\n" +
                        "  <a href=\"" + ctaUrl + "\" style=\"background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 10px rgba(30,60,114,0.25);\">" + ctaText + "</a>\n" +
                        "</div>";
        }

        return "<!DOCTYPE html>\n" +
               "<html>\n" +
               "<head>\n" +
               "    <meta charset=\"utf-8\">\n" +
               "    <title>" + title + "</title>\n" +
               "</head>\n" +
               "<body style=\"margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #334155; -webkit-font-smoothing: antialiased;\">\n" +
               "    <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"100%\" style=\"table-layout: fixed;\">\n" +
               "        <tr>\n" +
               "            <td align=\"center\" style=\"padding: 40px 10px;\">\n" +
               "                <table border=\"0\" cellpadding=\"0\" cellspacing=\"0\" width=\"600\" style=\"background-color: #ffffff; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #f1f5f9;\">\n" +
               "                    <!-- Header -->\n" +
               "                    <tr>\n" +
               "                        <td align=\"center\" style=\"background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 40px 20px;\">\n" +
               "                            <h1 style=\"color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;\">Sisenco Digital</h1>\n" +
               "                            <p style=\"color: #94a3b8; margin: 6px 0 0 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px;\">Weekly Report Portal</p>\n" +
               "                        </td>\n" +
               "                    </tr>\n" +
               "                    <!-- Content -->\n" +
               "                    <tr>\n" +
               "                        <td style=\"padding: 40px; line-height: 1.6; font-size: 15px;\">\n" +
               "                            <h2 style=\"color: #0f172a; font-size: 20px; font-weight: 700; margin-top: 0; margin-bottom: 20px;\">" + heading + "</h2>\n" +
               "                            " + contentHtml + "\n" +
               "                            " + ctaButton + "\n" +
               "                        </td>\n" +
               "                    </tr>\n" +
               "                    <!-- Footer -->\n" +
               "                    <tr>\n" +
               "                        <td style=\"background-color: #f8fafc; border-top: 1px solid #f1f5f9; padding: 25px 40px; text-align: center;\">\n" +
               "                            <p style=\"margin: 0; font-size: 12px; color: #64748b;\">This is an automated message from the Sisenco Digital portal. Please do not reply directly to this email.</p>\n" +
               "                            <p style=\"margin: 8px 0 0 0; font-size: 12px; color: #94a3b8;\">© 2026 Sisenco Digital. All rights reserved.</p>\n" +
               "                        </td>\n" +
               "                    </tr>\n" +
               "                </table>\n" +
               "            </td>\n" +
               "        </tr>\n" +
               "    </table>\n" +
               "</body>\n" +
               "</html>";
    }

    /**
     * Formats JSON string arrays to bulleted HTML lists.
     */
    private String formatJsonArrayToHtml(String json) {
        if (json == null || json.trim().isEmpty()) {
            return "<p style=\"color: #64748b; margin: 0;\">None</p>";
        }
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            String[] items = mapper.readValue(json, String[].class);
            if (items == null || items.length == 0) {
                return "<p style=\"color: #64748b; margin: 0;\">None</p>";
            }
            StringBuilder sb = new StringBuilder("<ul style=\"margin: 0; padding-left: 20px; color: #334155;\">");
            for (String item : items) {
                if (item != null && !item.trim().isEmpty()) {
                    sb.append("<li style=\"margin-bottom: 6px;\">").append(escapeHtml(item.trim())).append("</li>");
                }
            }
            sb.append("</ul>");
            return sb.toString();
        } catch (Exception e) {
            return "<p style=\"margin: 0;\">" + escapeHtml(json) + "</p>";
        }
    }

    /**
     * Escapes critical characters to produce valid HTML entity text.
     */
    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;")
                   .replace("\"", "&quot;")
                   .replace("'", "&#x27;");
    }
}
