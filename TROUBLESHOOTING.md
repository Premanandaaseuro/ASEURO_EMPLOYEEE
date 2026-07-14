# 🛠️ Capstone Project Troubleshooting Guide

This guide provides step-by-step diagnostic and troubleshooting strategies for the Capstone deployment architecture:
**React (S3 Website) ➔ Spring Boot REST API (EC2 Docker Container) ➔ PostgreSQL (Amazon RDS)**

---

## 🔒 1. Security Group & Port Access Issues

### Symptoms
- Frontend application shows browser errors like `ERR_CONNECTION_TIMED_OUT` when attempting to connect to the backend REST API.
- Direct `curl` commands to `http://<ec2-ip>:8080/actuator/health` hang indefinitely.
- Unable to SSH into the EC2 instance using the PEM key.

### Diagnostic Steps

1. **Verify EC2 Security Group Inbound Rules**
   Go to **AWS Console ➔ EC2 ➔ Instances ➔ Select Instance ➔ Security Tab**. 
   Verify the assigned security group contains the following inbound rules:
   
   | Protocol | Port Range | Source | Purpose |
   |----------|------------|--------|---------|
   | TCP | 22 | `0.0.0.0/0` (or your IP) | SSH access |
   | TCP | 8080 | `0.0.0.0/0` | Spring Boot REST API |
   | TCP | 80 | `0.0.0.0/0` | HTTP traffic (if proxy is used) |

2. **Verify EC2 Network ACLs & Routing**
   Ensure the Subnet hosting the EC2 instance has an **Internet Gateway** attached in its Route Table, routing `0.0.0.0/0` outbound.

3. **Check Local Firewall rules on EC2**
   SSH into EC2 and check if local iptables/firewalld rules are blocking port 8080:
   ```bash
   sudo iptables -L -n -v
   ```

### Resolution
Add the missing ingress rules via AWS CLI:
```bash
# Allow inbound port 8080 (REST API)
aws ec2 authorize-security-group-ingress \
  --group-id <sg-id> \
  --protocol tcp \
  --port 8080 \
  --cidr 0.0.0.0/0 \
  --region ap-south-1
```

---

## 🗄️ 2. Database Connectivity Issues

### Symptoms
- Spring Boot container starts but crashes immediately with a `Connection refused` or `HikariPool Connection Timeout` error.
- Direct database query clients cannot connect to the RDS endpoint.

### Diagnostic Steps

1. **Test Connectivity from EC2 Instance**
   SSH into the EC2 instance and run `nc` (netcat) or `telnet` to check if port 5432 on the RDS host is reachable:
   ```bash
   nc -zv <rds-endpoint> 5432
   ```
   *If this hangs or fails, the network path between EC2 and RDS is blocked.*

2. **Verify RDS Security Group rules**
   Go to **AWS Console ➔ RDS ➔ Databases ➔ Select database ➔ Connectivity & Security**.
   Find the Security Group applied to RDS. It must allow inbound traffic on **Port 5432** from the EC2 Instance's IP address or security group:
   
   | Protocol | Port Range | Source | Purpose |
   |----------|------------|--------|---------|
   | TCP | 5432 | `sg-xxxxxxxx` (EC2 Security Group) | Secure RDS access |

3. **Check RDS Public Access Setting**
   If connecting from outside AWS, ensure the RDS property **Publicly Accessible** is set to `Yes`.

### Resolution
Apply the proper ingress rule to the RDS Security Group to authorize the EC2 Security Group:
```bash
aws ec2 authorize-security-group-ingress \
  --group-id <rds-security-group-id> \
  --protocol tcp \
  --port 5432 \
  --source-group <ec2-security-group-id> \
  --region ap-south-1
```

---

## 🐳 3. Docker Container Startup Failures

### Symptoms
- The container status shows `Restarting (X)` or `Exited (Y)`.
- GitHub Actions deploy stage fails during the backend health check wait loop.

### Diagnostic Steps

1. **List All Containers**
   SSH into EC2 and run:
   ```bash
   docker ps -a
   ```

2. **Retrieve Exit Codes and Container Logs**
   Check the logs of the failed container:
   ```bash
   docker logs emp-backend
   ```

3. **Common Spring Boot Docker Errors:**

   - **Circular Dependency Error:**
     *Symptom:* `Requested bean is currently in creation: Is there an unresolvable circular reference?`
     *Fix:* Inject dependent beans lazily using the `@Lazy` annotation or split the configuration components.
     
   - **Environment Variable Missing:**
     *Symptom:* `Could not resolve placeholder 'DB_URL' in value "${DB_URL}"`
     *Fix:* Verify that the `docker run` command in the CI/CD pipeline contains the `-e DB_URL="..."` parameter and the secret is populated on GitHub.

   - **Out of Memory (OOM) Kill:**
     *Symptom:* Exit code `137`
     *Fix:* Check EC2 memory capacity. If using free-tier instances (t2.micro/t3.micro), increase memory constraints or configure JVM memory options inside the Dockerfile:
     ```dockerfile
     ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
     ```

---

## 📊 4. CloudWatch Log Analysis

### Symptoms
- Containers crash but `docker logs` yields no information because the logs are wiped when the container exits and restarts.
- Need centralized search and alert capabilities for production system health.

### Diagnostic Steps

1. **Verify CloudWatch Agent is Running on EC2**
   ```bash
   sudo systemctl status amazon-cloudwatch-agent
   ```

2. **Check AWS Docker Log Driver Integration**
   Inspect the container configuration using:
   ```bash
   docker inspect emp-backend | grep LogConfig -A 10
   ```
   It should output:
   ```json
   "LogConfig": {
       "Type": "awslogs",
       "Config": {
           "awslogs-group": "/emp/backend",
           "awslogs-region": "ap-south-1",
           "awslogs-stream": "backend-xxxxxxxx"
       }
   }
   ```

3. **Verify IAM Policy on EC2 Role**
   The IAM Role attached to the EC2 Instance Profile must contain the `CloudWatchAgentServerPolicy` or custom write permission permissions (`logs:CreateLogStream`, `logs:PutLogEvents`).

4. **Navigate CloudWatch Logs Console**
   - Go to **CloudWatch ➔ Log groups**.
   - Select `/emp/backend` or `/emp/frontend`.
   - Click on the log stream corresponding to the deployment SHA/tag.
   - Use **Log Insights** to query logs globally using standard SQL-like syntax:
     ```sql
     fields @timestamp, @message
     | filter @message like /ERROR/
     | sort @timestamp desc
     | limit 20
     ```

### Troubleshooting "Log Group Does Not Exist" Error
If docker run fails with:
`failed to initialize logging driver: ResourceNotFoundException: The specified log group does not exist.`
Run this command from your terminal to pre-create the log groups:
```bash
aws logs create-log-group --log-group-name /emp/backend --region ap-south-1
```
