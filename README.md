# AyurSutra
### An Intelligent Patient Management and Therapy Scheduling System for Panchakarma Centres

AyurSutra is a web-based patient management and therapy scheduling system designed for Panchakarma centres. It aims to digitise clinical workflows, simplify patient and staff management, organise therapy schedules, and support structured clinical documentation and healthcare compliance.

## 1. Key Features

- **Role-Based Access:** Separate access for Admin, Doctor, Therapist, Receptionist, and Patient.
- **Authentication:** Secure login and JWT-based authentication.
- **Patient Management:** Manage patient information and patient-related records.
- **Clinical Records (EMR):** Maintain structured patient clinical information, including Ayurvedic assessment details.
- **Therapy Management:** Organise therapy plans and treatment sessions.
- **Therapy Scheduling:** Support scheduling workflows and help identify therapist, room, and time-slot conflicts.
- **Appointments:** Manage patient appointments.
- **NABH/AYUSH Compliance:** Structured compliance chapters and related documentation.
- **Notifications:** Support application notifications and communication workflows.
- **Staff Management:** Role-based staff administration.
- **Dashboard:** Role-oriented dashboards for different users.

*Note: The availability of individual features may depend on the current implementation and configured services.*

## 2. Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| UI | Tailwind CSS, Lucide React, Framer Motion |
| Routing | React Router |
| API Communication | Axios |
| Data Fetching | TanStack Query |
| Backend | Java 21, Spring Boot 3.5.5 |
| Security | Spring Security, JWT |
| Database | MongoDB Atlas |
| Backend Build Tool | Maven |
| Validation | Jakarta Validation |

## 3. Project Structure

```text
Ayursutra/
│
├── ayursutra-frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.ts
│   └── README.md
│
├── ayursutra-backend/
│   ├── .mvn/
│   ├── src/
│   ├── uploads/
│   ├── mvnw
│   ├── mvnw.cmd
│   └── pom.xml
│
├── .gitignore
└── README.md
```

## 4. Prerequisites

Install the following before running the project:

- Java JDK 21
- Node.js (Node 22.12 or later recommended)
- npm
- Git
- MongoDB Atlas access

You do not need to install MongoDB locally if you are using the configured MongoDB Atlas database.

## 5. Clone the Repository

Open a terminal and run:

```bash
git clone https://github.com/riya-maurya10/Ayursutra.git
cd Ayursutra
```

## 6. Backend Setup

### Step 1: Configure the application

The backend requires an `application.yml` file.

Create or obtain the file privately from the project owner and place it at:

```text
ayursutra-backend/src/main/resources/application.yml
```

**Important:** The configuration file is intentionally excluded from GitHub because it contains private database and authentication configuration. Do not upload it publicly or share it in public messages.

Each team member should obtain their own authorised configuration privately. MongoDB Atlas access must also be enabled for their network/IP address.

### Step 2: Run the backend

Open a terminal in the project root and execute:

**Windows:**

```powershell
cd ayursutra-backend
.\mvnw.cmd spring-boot:run
```

**macOS/Linux:**

```bash
cd ayursutra-backend
./mvnw spring-boot:run
```

Backend default URL:

```text
http://localhost:9999
```

API base URL:

```text
http://localhost:9999/api
```

## 7. Frontend Setup

Open a second terminal in the project root.

```bash
cd ayursutra-frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

Open the frontend URL in your browser after both frontend and backend have started.

## 8. Running the Complete Project

You need two terminals:

| Terminal | Command | Purpose |
|---|---|---|
| Terminal 1 | `cd ayursutra-backend` then run Maven wrapper | Starts Spring Boot backend |
| Terminal 2 | `cd ayursutra-frontend` then run npm commands | Starts React frontend |

Keep both terminals running while using the application.

## 9. User Roles

- **Admin:** Administrative operations and system management.
- **Doctor:** Patient clinical workflows and treatment-related operations.
- **Therapist:** Therapy and session-related workflows.
- **Receptionist:** Patient-facing administrative and appointment workflows.
- **Patient:** Patient dashboard and available patient services.

Access to modules depends on the permissions configured for each role.

## 10. Configuration and Security

- Never commit database credentials, JWT secrets, email passwords, or private configuration files.
- Do not upload patient documents or other confidential records.
- Each team member should use an authorised configuration file.
- Keep private credentials out of source code and public repositories.

## 11. Academic Project

**Project:** AyurSutra – An Intelligent Patient Management and Therapy Scheduling System for Panchakarma Centres

**Institution:** KIET Group of Institutions, Ghaziabad

**Programme:** B.Tech – Computer Science and Information Technology

**Academic Session:** 2023–2027

### Project Team

- Riya Maurya
- Sumit Joshi
- Tanishq Kumar
- Raman Kumar Sherawat

**Project Guide:** Ms. Sonia Deshmukh

---

AyurSutra is developed as an academic project to explore the application of modern software engineering and digital healthcare workflows in traditional Ayurvedic Panchakarma centres.