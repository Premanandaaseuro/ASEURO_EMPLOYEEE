# =============================================
# Multi-stage Dockerfile for Spring Boot Backend
# Stage 1: Build with Maven
# Stage 2: Run with minimal JRE (Alpine)
# =============================================

# --- Stage 1: Build ---
FROM maven:3.9.6-eclipse-temurin-17 AS builder

WORKDIR /app

# Copy pom first for Docker layer caching (dependencies won't re-download unless pom changes)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source and build
COPY src ./src
RUN mvn clean package -DskipTests -B

# --- Stage 2: Runtime ---
FROM eclipse-temurin:17-jre-alpine

WORKDIR /app

# Create non-root user for security best practice
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy built JAR from builder stage
COPY --from=builder /app/target/*.jar app.jar

# Change ownership
RUN chown appuser:appgroup app.jar

USER appuser

# Expose port
EXPOSE 8080

# Health check for Docker/ECS
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-Dspring.profiles.active=docker", \
  "-jar", "app.jar"]
