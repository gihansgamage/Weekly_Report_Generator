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

### 1. Database Setup
Launch PostgreSQL and run:
```sql
CREATE DATABASE weekly_report_db;
```
Verify or update credentials in `.env` in the root folder:
```env
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/weekly_report_db
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=postgres
```

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

Use these accounts to sign in immediately:

| Email | Password | Role | Description |
| :--- | :--- | :--- | :--- |
| **`manager@example.com`** | `manager123` | `MANAGER` | Full dashboard metrics, filtering, categories CRUD, AI assistant access. |
| **`member@example.com`** | `member123` | `MEMBER` | Submit reports, save drafts, view own history list. |
| **`dev@example.com`** | `member123` | `MEMBER` | Alternate developer account to test pending / late statuses. |

---

## 🤖 AI Chat Assistant Configuration
The widget sends context summaries of the team's reports to Gemini (`gemini-2.5-flash`).
To configure live Gemini AI:
1. Append your Gemini API key in the `.env` file: `GEMINI_API_KEY=your-api-key`.
2. Restart the Spring Boot backend.
*Note: If no API key is specified, the assistant runs in simulated demo mode, generating analysis directly from the database mock-engine.*
