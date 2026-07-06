package com.reportgenerator;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		// Load .env file programmatically
		try {
			java.io.File envFile = new java.io.File("../.env");
			if (!envFile.exists()) {
				envFile = new java.io.File(".env");
			}
			if (envFile.exists()) {
				java.nio.file.Files.lines(envFile.toPath())
					.map(String::trim)
					.filter(line -> !line.isEmpty() && !line.startsWith("#") && line.contains("="))
					.forEach(line -> {
						int index = line.indexOf("=");
						String key = line.substring(0, index).trim();
						String value = line.substring(index + 1).trim();
						if (value.startsWith("\"") && value.endsWith("\"") && value.length() >= 2) {
							value = value.substring(1, value.length() - 1);
						} else if (value.startsWith("'") && value.endsWith("'") && value.length() >= 2) {
							value = value.substring(1, value.length() - 1);
						}
						System.setProperty(key, value);
					});
				System.out.println("🌱 Programmatically loaded environment variables from: " + envFile.getAbsolutePath());
			} else {
				System.out.println("⚠️ No .env file found in root or current directory.");
			}
		} catch (Exception e) {
			System.err.println("❌ Error loading .env file: " + e.getMessage());
		}

		SpringApplication.run(BackendApplication.class, args);
	}

}
