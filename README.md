# 🏢 Employee Management System

> A production-grade full-stack application demonstrating the complete CI/CD lifecycle:
> **React → Spring Boot → PostgreSQL → Docker → Amazon ECR → EC2 → GitHub Actions → CloudWatch**

[![CI/CD](https://github.com/YOUR_USERNAME/employee-management/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/YOUR_USERNAME/employee-management/actions)

---

## 🏗️ Architecture

```
Developer (VS Code / IntelliJ)
     │  git push
     ▼
GitHub Repository
     │
     ▼
┌─────────────────────────────────────────┐
│         GitHub Actions Pipeline          │
│  ┌──────────────┐  ┌─────────────────┐  │
│  │ CI: Build &  │→ │ Docker Build &  │  │
│  │    Test      │  │ Push to AWS ECR │  │
│  └──────────────┘  └────────┬────────┘  │
│                             │           │
│                    ┌────────▼────────┐  │
│                    │  Deploy to EC2  │  │
│                    │  (via SSH)      │  │
│                    └─────────────────┘  │
└─────────────────────────────────────────┘
                    │
                    ▼
         ┌──────────────────┐
         │   EC2 Instance   │
         │  ┌────────────┐  │
         │  │  Frontend  │  │  :80
         │  │  (Nginx)   │  │
         │  └─────┬──────┘  │
         │        │ proxy   │
         │  ┌─────▼──────┐  │
         │  │ Spring Boot │  │  :8080
         │  │  REST API   │  │
         │  └─────┬──────┘  │
         └────────┼─────────┘
                  │
                  ▼
         Amazon RDS PostgreSQL
                  │
                  ▼
            CloudWatch
         (Logs + Metrics)
```

## ✨ Features

- **JWT Authentication** — Login, register with role-based access (ADMIN/USER)
- **Employee CRUD** — Create, read, update, delete employees
- **Search & Filter** — Full-text search, department filter, status filter
- **Dashboard** — Real-time stats: headcount, salary avg, department breakdown
- **Pagination** — Server-side pagination on all lists
- **Health Checks** — Spring Actuator + Docker health checks
- **CloudWatch** — Logs and metrics for production monitoring

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + React Router |
| Styling | Vanilla CSS (Glassmorphism dark theme) |
| Backend | Spring Boot 3 + Spring Security + JPA |
| Auth | JWT (JJWT) |
| Database | PostgreSQL (local) / Amazon RDS (prod) |
| Containers | Docker (multi-stage builds) |
| Registry | Amazon ECR |
| Server | Amazon EC2 |
| CI/CD | GitHub Actions |
| Monitoring | Amazon CloudWatch |

---

## 🚀 Quick Start (Local)

### Prerequisites
- Java 17+
- Node.js 20+
- Docker Desktop
- Maven 3.9+

### Option A: Full Docker Stack (Recommended)

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/employee-management.git
cd employee-management

# Start everything (PostgreSQL + Backend + Frontend)
docker-compose up --build

# App is now running:
# Frontend → http://localhost
# Backend  → http://localhost:8080
# API Docs → http://localhost:8080/actuator/health
```

**Default credentials (seeded automatically):**
- Username: `admin`
- Password: `admin123`

### Option B: Run without Docker

```bash
# Start PostgreSQL (with Docker just for the DB)
docker run -d --name emp-postgres \
  -e POSTGRES_DB=employeedb \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 postgres:16-alpine

# Start Backend
cd backend
mvn spring-boot:run -Dspring.profiles.active=dev

# Start Frontend (new terminal)
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

---

## 📋 API Reference

All endpoints (except auth) require `Authorization: Bearer <token>` header.

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login → returns JWT |
| POST | `/api/auth/register` | Register new user |

### Employees (requires auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employees` | List all (paginated) |
| GET | `/api/employees/{id}` | Get by ID |
| POST | `/api/employees` | Create (ADMIN only) |
| PUT | `/api/employees/{id}` | Update (ADMIN only) |
| DELETE | `/api/employees/{id}` | Delete (ADMIN only) |
| GET | `/api/employees/search?keyword=` | Full-text search |
| GET | `/api/employees/stats` | Dashboard stats |
| GET | `/api/employees/departments` | All departments |

---

## ☁️ AWS Setup Guide

### Step 1: Create Amazon RDS (PostgreSQL)

```
AWS Console → RDS → Create database
  Engine:      PostgreSQL 16
  Template:    Free tier
  DB name:     employeedb
  Username:    postgres
  Password:    <your-password>
  Instance:    db.t3.micro
  Storage:     20 GB gp2
  VPC:         Default (or same as EC2)
  Public:      No (EC2 will access via private IP)
```

Note the **endpoint URL** — this becomes your `DB_URL`.

### Step 2: Create Amazon ECR Repositories

```bash
aws ecr create-repository --repository-name emp-backend  --region us-east-1
aws ecr create-repository --repository-name emp-frontend --region us-east-1
```

Note the registry URI: `123456789.dkr.ecr.us-east-1.amazonaws.com`

### Step 3: Launch EC2 Instance

```
AWS Console → EC2 → Launch Instance
  AMI:          Amazon Linux 2023
  Type:         t3.small (or t2.micro for free tier)
  Key pair:     Create new → download .pem file
  Security Group:
    Inbound:  port 22  (SSH)   → Your IP
              port 80  (HTTP)  → Anywhere (0.0.0.0/0)
              port 8080 (API)  → Anywhere (optional)
  Storage:    20 GB gp3
```

### Step 4: Configure EC2 — Install Docker & AWS CLI

SSH into your EC2:
```bash
ssh -i your-key.pem ec2-user@YOUR_EC2_PUBLIC_IP

# Install Docker
sudo yum update -y
sudo yum install docker -y
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o awscliv2.zip
unzip awscliv2.zip && sudo ./aws/install

# Install CloudWatch Agent
sudo yum install amazon-cloudwatch-agent -y

# Verify
docker --version
aws --version
```

### Step 5: Create IAM User for GitHub Actions

```
AWS Console → IAM → Users → Create user
  Name: github-actions-emp
  Policies:
    - AmazonEC2ContainerRegistryFullAccess
    - CloudWatchLogsFullAccess

→ Create Access Key → Download CSV
```

### Step 6: Configure IAM Role for EC2 (for CloudWatch)

```
AWS Console → IAM → Roles → Create role
  Trusted entity: EC2
  Policies:
    - CloudWatchAgentServerPolicy
    - AmazonEC2ContainerRegistryReadOnly

→ Attach this role to your EC2 instance
```

### Step 7: Set GitHub Secrets

Go to your GitHub repo → **Settings → Secrets and variables → Actions**

Add these secrets:

| Secret Name | Value |
|------------|-------|
| `AWS_ACCESS_KEY_ID` | From IAM user CSV |
| `AWS_SECRET_ACCESS_KEY` | From IAM user CSV |
| `AWS_REGION` | `us-east-1` |
| `ECR_REGISTRY` | `123456789.dkr.ecr.us-east-1.amazonaws.com` |
| `EC2_HOST` | EC2 public IP or DNS |
| `EC2_USERNAME` | `ec2-user` |
| `EC2_SSH_KEY` | Contents of your `.pem` file |
| `DB_URL` | `jdbc:postgresql://rds-endpoint:5432/employeedb` |
| `DB_USERNAME` | `postgres` |
| `DB_PASSWORD` | Your RDS password |
| `JWT_SECRET` | Long random string (32+ chars) |

### Step 8: Configure CloudWatch Agent on EC2

```bash
# Copy the config file to EC2
scp -i your-key.pem aws-setup/cloudwatch-agent-config.json \
  ec2-user@YOUR_EC2_IP:/tmp/

# On EC2:
sudo cp /tmp/cloudwatch-agent-config.json \
  /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 \
  -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

sudo systemctl enable amazon-cloudwatch-agent
```

---

## 🔄 CI/CD Flow Explained

```
git push main
     │
     ▼
GitHub detects push
     │
     ▼
Job 1: Build & Test (CI)
  ├── Checkout code
  ├── Set up Java 17
  ├── mvn clean package (runs tests)
  ├── Set up Node 20
  ├── npm ci + npm run build
  └── Upload artifacts
     │
     ▼ (only on push to main)
Job 2: Docker Build & Push
  ├── Configure AWS credentials
  ├── Login to Amazon ECR
  ├── docker build backend → push :latest + :sha
  └── docker build frontend → push :latest + :sha
     │
     ▼
Job 3: Deploy to EC2 (via SSH)
  ├── aws ecr get-login-password → docker login
  ├── docker pull backend:latest
  ├── docker pull frontend:latest
  ├── docker stop + rm old containers
  ├── docker run backend (with DB env vars)
  ├── Wait for health check
  ├── docker run frontend
  └── docker image prune
     │
     ▼
Application Live! 🎉
```

---

## 📁 Project Structure

```
employee-management/
├── .github/workflows/
│   └── ci-cd.yml              # GitHub Actions pipeline
├── backend/
│   ├── src/main/java/com/emp/
│   │   ├── config/            # Security, DataSeeder, ExceptionHandler
│   │   ├── controller/        # EmployeeController, AuthController
│   │   ├── dto/               # Request/Response DTOs
│   │   ├── model/             # Employee, User JPA entities
│   │   ├── repository/        # Spring Data JPA repos
│   │   ├── security/          # JwtUtil, JwtAuthFilter
│   │   └── service/           # EmployeeService, AuthService
│   ├── Dockerfile             # Multi-stage build
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── components/        # Layout, EmployeeFormModal
│   │   ├── context/           # AuthContext
│   │   ├── pages/             # LoginPage, DashboardPage, EmployeesPage
│   │   └── services/          # api.js (Axios client)
│   ├── nginx.conf             # Nginx + reverse proxy config
│   └── Dockerfile             # Multi-stage build
├── aws-setup/
│   └── cloudwatch-agent-config.json
├── docker-compose.yml         # Local dev stack
├── .env.example               # Environment template
└── README.md
```

---

## 🎯 Interview Talking Points

When presenting this project:

1. **Why Docker?** — Eliminates "it works on my machine". Same image runs locally and in production.
2. **Why multi-stage builds?** — Final image contains only the JRE (not the full Maven/JDK), reducing image size by ~60%.
3. **Why ECR?** — Images live close to EC2 (same VPC), faster pulls, integrated with IAM for access control.
4. **Why GitHub Actions over Jenkins?** — No infrastructure to maintain, free for public repos, YAML config lives in the repo.
5. **Why JWT stateless auth?** — No session storage needed, horizontally scalable, works perfectly with React SPA.
6. **CloudWatch integration?** — Docker `--log-driver=awslogs` sends all container stdout directly to CloudWatch Logs. No log files to manage.
7. **Zero-downtime?** — Next step: swap to ECS Blue/Green or Kubernetes rolling updates.

---

## 📸 Screenshots

| Login | Dashboard | Employees |
|-------|-----------|-----------|
| Dark glassmorphism login | Stat cards + charts | Searchable table + CRUD |

---

*Built with ❤️ as a CI/CD demonstration project.*
