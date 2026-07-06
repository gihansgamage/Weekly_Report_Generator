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

        // 2. Seed Users
        if (userRepository.count() == 0) {
            // Seed a Manager (Admin)
            User manager = new User(
                    "manager@example.com",
                    passwordEncoder.encode("manager123"),
                    "Jane Doe (Manager)",
                    Role.MANAGER
            );
            manager.setUsername("manager");
            manager.setApproved(true);
            userRepository.save(manager);

            // Seed a Team Member
            User member1 = new User(
                    "member@example.com",
                    passwordEncoder.encode("member123"),
                    "John Smith (Member)",
                    Role.MEMBER
            );
            member1.setUsername("member");
            member1.setApproved(true);
            userRepository.save(member1);

            // Seed another Team Member for compliance demo
            User member2 = new User(
                    "dev@example.com",
                    passwordEncoder.encode("member123"),
                    "Alex Carter (Developer)",
                    Role.MEMBER
            );
            member2.setUsername("dev");
            member2.setApproved(true);
            userRepository.save(member2);

            // Seed the requested Admin Gmail manager
            User adminGmail = new User(
                    "gsgamage4@gmail.com",
                    passwordEncoder.encode("admin123"),
                    "System Admin",
                    Role.MANAGER
            );
            adminGmail.setUsername("admin");
            adminGmail.setApproved(true);
            userRepository.save(adminGmail);

            System.out.println("✅ Seeded default accounts successfully (including gsgamage4@gmail.com admin)!");
        } else {
            // Ensure pre-existing demo accounts are set to approved = true
            userRepository.findByEmail("manager@example.com").ifPresent(u -> {
                u.setApproved(true);
                u.setUsername("manager");
                userRepository.save(u);
            });
            userRepository.findByEmail("member@example.com").ifPresent(u -> {
                u.setApproved(true);
                u.setUsername("member");
                userRepository.save(u);
            });
            userRepository.findByEmail("dev@example.com").ifPresent(u -> {
                u.setApproved(true);
                u.setUsername("dev");
                userRepository.save(u);
            });
            
            java.util.Optional<User> adminOpt = userRepository.findByEmail("gsgamage4@gmail.com");
            if (adminOpt.isPresent()) {
                User admin = adminOpt.get();
                admin.setApproved(true);
                admin.setUsername("admin");
                userRepository.save(admin);
            } else {
                User adminGmail = new User(
                        "gsgamage4@gmail.com",
                        passwordEncoder.encode("admin123"),
                        "System Admin",
                        Role.MANAGER
                );
                adminGmail.setUsername("admin");
                adminGmail.setApproved(true);
                userRepository.save(adminGmail);
            }
            System.out.println("✅ Synchronized and approved existing seed accounts successfully!");
        }
    }
}
