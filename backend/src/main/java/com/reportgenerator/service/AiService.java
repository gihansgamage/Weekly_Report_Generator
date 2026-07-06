package com.reportgenerator.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.reportgenerator.model.Report;
import com.reportgenerator.repository.ReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.*;

@Service
public class AiService {

    @Autowired
    private ReportRepository reportRepository;

    @Value("${app.gemini.api-key}")
    private String geminiApiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public String askAssistant(String userMessage) {
        // 1. Fetch recent reports (last 4 weeks) for context
        LocalDate startDate = LocalDate.now().minusWeeks(4);
        List<Report> reports = reportRepository.findByFilters(null, null, startDate, LocalDate.now());
        
        // Filter only submitted reports
        List<Report> submittedReports = reports.stream()
                .filter(r -> "SUBMITTED".equals(r.getStatus()))
                .toList();

        // 2. Format reports into a text block
        StringBuilder contextBuilder = new StringBuilder();
        if (submittedReports.isEmpty()) {
            contextBuilder.append("No submitted weekly reports found in the last 4 weeks.\n");
        } else {
            for (Report report : submittedReports) {
                contextBuilder.append("Report ID: ").append(report.getId()).append("\n");
                contextBuilder.append("- Team Member: ").append(report.getUser().getName()).append(" (").append(report.getUser().getEmail()).append(")\n");
                contextBuilder.append("- Project Category: ").append(report.getProject().getName()).append("\n");
                contextBuilder.append("- Week Starting: ").append(report.getWeekStart()).append("\n");
                contextBuilder.append("- Hours Worked: ").append(report.getHoursWorked() != null ? report.getHoursWorked() : "N/A").append("\n");
                contextBuilder.append("- Tasks Completed: ").append(formatJsonList(report.getTasksCompleted())).append("\n");
                contextBuilder.append("- Tasks Planned: ").append(formatJsonList(report.getTasksPlanned())).append("\n");
                contextBuilder.append("- Blockers/Challenges: ").append(formatJsonList(report.getBlockers())).append("\n");
                contextBuilder.append("- Additional Notes: ").append(report.getNotes() != null ? report.getNotes() : "None").append("\n");
                contextBuilder.append("--------------------------------------------------\n");
            }
        }

        // 3. Construct System instructions & Prompt
        String systemPrompt = "You are an expert Team Analyst and Project Manager Assistant. Your goal is to review the weekly work reports of the team and answer the manager's query objectively, concisely, and with actionable insights.\n\n"
                + "Context Data (Weekly Reports):\n"
                + contextBuilder.toString()
                + "\nInstructions:\n"
                + "1. Ground your answers ONLY on the provided context data. If the answer is not in the context, politely mention you do not have that information.\n"
                + "2. If the user asks about specific trends or blockers, synthesize the data. Highlight critical blockers (such as database failures, client bottlenecks).\n"
                + "3. Suggest resource adjustments if workload is imbalanced (e.g. one person is working high hours while others are free).\n"
                + "4. Use clean Markdown styling (bolding, headers, lists, tables).\n\n"
                + "Manager Query: " + userMessage + "\n"
                + "AI Response:";

        // 4. API Call or Simulator
        if (geminiApiKey == null || geminiApiKey.trim().isEmpty()) {
            return getSimulatedResponse(userMessage, submittedReports);
        }

        try {
            RestTemplate restTemplate = new RestTemplate();
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + geminiApiKey;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Construct Gemini request body
            Map<String, Object> requestBody = new HashMap<>();
            Map<String, Object> textPart = new HashMap<>();
            textPart.put("text", systemPrompt);
            
            Map<String, Object> partContainer = new HashMap<>();
            partContainer.put("parts", Collections.singletonList(textPart));
            
            requestBody.put("contents", Collections.singletonList(partContainer));

            String jsonPayload = objectMapper.writeValueAsString(requestBody);
            HttpEntity<String> entity = new HttpEntity<>(jsonPayload, headers);

            String responseBody = restTemplate.postForObject(url, entity, String.class);
            JsonNode rootNode = objectMapper.readTree(responseBody);
            
            JsonNode candidates = rootNode.path("candidates");
            if (candidates.isArray() && !candidates.isEmpty()) {
                JsonNode parts = candidates.get(0).path("content").path("parts");
                if (parts.isArray() && !parts.isEmpty()) {
                    return parts.get(0).path("text").asText();
                }
            }
            
            return "Error: AI Assistant was unable to process the response format.";
        } catch (Exception e) {
            return "Error calling Gemini API: " + e.getMessage() + "\n\n*Falling back to local simulation mode.*\n\n" + getSimulatedResponse(userMessage, submittedReports);
        }
    }

    private String formatJsonList(String jsonStr) {
        if (jsonStr == null || jsonStr.trim().isEmpty()) {
            return "[]";
        }
        try {
            List<String> list = objectMapper.readValue(jsonStr, new TypeReference<List<String>>() {});
            return list.toString();
        } catch (Exception e) {
            return jsonStr;
        }
    }

    private String getSimulatedResponse(String query, List<Report> reports) {
        StringBuilder response = new StringBuilder();
        response.append("💡 **Demo Assistant Simulator (Gemini API Key is offline)**\n\n");
        response.append("This is a synthesized summary based on **").append(reports.size()).append("** recent submitted report(s) in the database:\n\n");

        String lowerQuery = query.toLowerCase();

        if (lowerQuery.contains("blocker") || lowerQuery.contains("challenge") || lowerQuery.contains("stuck")) {
            response.append("### Active Blockers Analysis\n");
            long blockersCount = 0;
            List<String> blockersList = new ArrayList<>();
            for (Report r : reports) {
                try {
                    List<String> list = objectMapper.readValue(r.getBlockers(), new TypeReference<List<String>>() {});
                    for (String b : list) {
                        if (b != null && !b.trim().isEmpty() && !b.equalsIgnoreCase("none") && !b.equalsIgnoreCase("no blockers")) {
                            blockersList.add("**" + r.getUser().getName() + "** (" + r.getProject().getName() + "): " + b);
                            blockersCount++;
                        }
                    }
                } catch (Exception ignored) {}
            }
            
            if (blockersCount == 0) {
                response.append("Good news! There are currently no active blockers reported by the team.\n");
            } else {
                response.append("There are currently **").append(blockersCount).append("** active blockers:\n");
                for (String b : blockersList) {
                    response.append("- ").append(b).append("\n");
                }
                response.append("\n*Recommendation: Follow up with these developers to resolve infrastructure bottlenecks.*");
            }
        } else if (lowerQuery.contains("project") || lowerQuery.contains("client") || lowerQuery.contains("work")) {
            response.append("### Project Allocations & Activity Summary\n");
            Map<String, List<String>> projectTasks = new HashMap<>();
            Map<String, Integer> projectHours = new HashMap<>();
            
            for (Report r : reports) {
                String pName = r.getProject().getName();
                projectHours.put(pName, projectHours.getOrDefault(pName, 0) + (r.getHoursWorked() != null ? r.getHoursWorked() : 0));
                
                try {
                    List<String> list = objectMapper.readValue(r.getTasksCompleted(), new TypeReference<List<String>>() {});
                    projectTasks.computeIfAbsent(pName, k -> new ArrayList<>()).addAll(list);
                } catch (Exception ignored) {}
            }

            if (projectHours.isEmpty()) {
                response.append("No active project allocations logged in recent reports.\n");
            } else {
                response.append("| Project Category | Tasks Completed | Total Hours Logged |\n");
                response.append("| :--- | :--- | :--- |\n");
                for (String p : projectHours.keySet()) {
                    List<String> tasks = projectTasks.getOrDefault(p, Collections.emptyList());
                    int tasksCount = (int) tasks.stream().filter(t -> t != null && !t.trim().isEmpty()).count();
                    response.append("| ").append(p)
                            .append(" | ").append(tasksCount).append(" completed task(s)")
                            .append(" | ").append(projectHours.get(p)).append(" hrs |\n");
                }
            }
        } else {
            response.append("### Weekly Team Summary\n");
            response.append("Here is an overview of recent activities:\n");
            
            long totalHours = 0;
            Set<String> contributors = new HashSet<>();
            
            for (Report r : reports) {
                contributors.add(r.getUser().getName());
                totalHours += (r.getHoursWorked() != null ? r.getHoursWorked() : 0);
            }

            response.append("- **Total Contribution**: ").append(totalHours).append(" total hours logged by the team.\n");
            response.append("- **Contributors**: ").append(contributors.size()).append(" active contributor(s) (").append(String.join(", ", contributors)).append(").\n");
            response.append("- **Reports Submitted**: ").append(reports.size()).append(" reports reviewed.\n\n");
            response.append("Try asking the assistant specifically about: **blockers** or **project tasks** to see filtered views.");
        }

        response.append("\n\n---\n*To enable the Gemini AI assistant, please append your `GEMINI_API_KEY` to the environment variables.*");
        return response.toString();
    }
}
