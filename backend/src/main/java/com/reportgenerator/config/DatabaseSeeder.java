package com.reportgenerator.config;

import com.reportgenerator.model.Project;
import com.reportgenerator.model.Role;
import com.reportgenerator.model.User;
import com.reportgenerator.repository.ProjectRepository;
import com.reportgenerator.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // 1. Seed Projects
        if (projectRepository.count() == 0) {
            projectRepository.save(new Project("Client A", "Development and support for Client A portal."));
            projectRepository.save(new Project("Internal Tooling", "Building libraries and workflows for the internal engineering team."));
            projectRepository.save(new Project("R&D", "Research and prototyping of next-generation features."));
            projectRepository.save(new Project("Marketing Campaign", "Technical support and data integrations for marketing activities."));
            System.out.println("✅ Default project categories seeded successfully!");
        }

        // 2. Seed Users & Clean up Demo Accounts
        // Purge old demo login accounts if they exist in DB
        userRepository.findByEmail("manager@example.com").ifPresent(userRepository::delete);
        userRepository.findByEmail("member@example.com").ifPresent(userRepository::delete);
        userRepository.findByEmail("dev@example.com").ifPresent(userRepository::delete);

        java.util.Optional<User> adminOpt = userRepository.findByEmail("gsgamage4@gmail.com");
        if (adminOpt.isEmpty()) {
            User adminGmail = new User(
                    "gsgamage4@gmail.com",
                    passwordEncoder.encode("admin123"),
                    "System Admin",
                    Role.MANAGER
            );
            adminGmail.setUsername("admin");
            adminGmail.setApproved(true);
            userRepository.save(adminGmail);
            System.out.println("✅ Seeded original manager account (gsgamage4@gmail.com) successfully!");
        } else {
            User admin = adminOpt.get();
            admin.setApproved(true);
            admin.setUsername("admin");
            userRepository.save(admin);
            System.out.println("✅ Synchronized original manager account successfully!");
        }
    }
}
