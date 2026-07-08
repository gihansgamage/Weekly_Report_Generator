# Sisenco Digital - Weekly Report Generator & Team Dashboard

Sisenco Digital is a full-stack, decoupled web application built for teams to manage weekly reports and analyze progress.
- **Frontend**: Vite React with Vanilla CSS (Dark mode first, glassmorphism aesthetics).
- **Backend**: Spring Boot 3.4.1 (Java 17, Maven) with Spring Security & JPA.
- **Database**: PostgreSQL.
- **AI Integration**: Google Gemini API integration with context injection.

---

## 📂 Folder Layout

```
Weekly_Report_Generator/
├── frontend/                         # Vite React Client
│   ├── src/
│   │   ├── components/               # Navbar, Toast alerts, ChatWidget
│   │   ├── context/                  # AuthContext for session management
│   │   ├── pages/                    # Login, Reports, ReportHistory, Projects, Dashboard
│   │   ├── styles/                   # globals.css, Login.css, Reports.css, Dashboard.css, Components.css
│   │   └── utils/api.js              # Axios helper
├── backend/                          # Spring Boot Service
│   ├── src/main/java/com/reportgenerator/
│   │   ├── config/                   # WebSecurityConfig, DatabaseSeeder
│   │   ├── controller/               # Auth, Project, Report, Stat, Ai controllers
│   │   ├── dto/                      # AuthRequest, ReportRequest, ChatRequest
│   │   ├── model/                    # JPA Entities (User, Project, Report)
│   │   └── service/                  # AiService, StatService
│   └── src/main/resources/application.properties
├── schema.sql                        # PostgreSQL Table DDL & Seed queries
└── .env                              # Global secret keys & database configuration
```

---

## 🛠️ Getting Started / Quick Run

### 1. Database & Environment Setup
1. Launch PostgreSQL and run:
   ```sql
   CREATE DATABASE weekly_report_db;
   ```
2. Configure environment variables in the `.env` file in the root folder:
   * **Database Connection**:
     ```env
     SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/weekly_report_db
     SPRING_DATASOURCE_USERNAME=postgres
     SPRING_DATASOURCE_PASSWORD=postgres
     ```
   * **SMTP Email Settings (Optional - for real email verification OTPs and approvals)**:
     ```env
     SMTP_GMAIL=your-email@gmail.com
     SMTP_APP_PASSWORD=your-16-character-google-app-password
     ```
     *(See **SMTP Email Configuration** section below for Gmail details)*
   * **Gemini AI Chat Assistant (Optional)**:
     ```env
     GEMINI_API_KEY=your-gemini-api-key
     ```
     *(Defaults to simulated demo mode if left empty)*

### 2. Run the Backend
Navigate to `/backend` and launch the service:
```bash
cd backend
mvn spring-boot:run
```
*Note: Hibernate automatically creates tables, indices, and relationships. `DatabaseSeeder` inserts sample categories and accounts.*

### 3. Run the Frontend
Navigate to `/frontend` and spin up the Vite development server:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173/login` in your browser.

---

## 🔑 Login Accounts (Pre-seeded)

Use the following default administrator account to sign in and approve pending user registrations:

| Username / Email | Password | Role | Description |
| :--- | :--- | :--- | :--- |
| **`manageremail@gmail.com`** (or **`admin`**) | `admin123` | `MANAGER` | System administrator with full access to dashboard metrics, category management, approvals, and the AI assistant. |

All regular team members must submit a registration request on the login page and wait for the manager to approve them before logging in.

---

## 🤖 AI Chat Assistant Configuration
The widget sends context summaries of the team's reports to Gemini (`gemini-2.5-flash`).
To configure live Gemini AI:
1. Append your Gemini API key in the `.env` file: `GEMINI_API_KEY=your-api-key`.
2. Restart the Spring Boot backend.
*Note: If no API key is specified, the assistant runs in simulated demo mode, generating analysis directly from the database mock-engine.*

---

## 📧 SMTP Email Configuration (Optional)
The system uses SMTP (configured for Gmail by default) to send registration approval notifications and one-time password (OTP) email verifications.
To enable real email dispatch:
1. Open the `.env` file in the root directory.
2. Define your SMTP credentials:
   ```env
   SMTP_GMAIL=your-email@gmail.com
   SMTP_APP_PASSWORD=your-16-character-google-app-password
   ```
   *Note: To use Google's SMTP servers, you must have 2-Step Verification enabled on your Google Account. You can then generate an App Password via Google Account Security settings.*
3. Restart the Spring Boot backend.

