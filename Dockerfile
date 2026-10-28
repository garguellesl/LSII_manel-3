# syntax=docker/dockerfile:1
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY backend/pom.xml backend/pom.xml
COPY backend/src backend/src
COPY frontend frontend
WORKDIR /workspace/backend
# Tests run separately with Docker/Testcontainers; the image build has no Docker socket.
RUN --mount=type=cache,target=/root/.m2 mvn -B -ntp -Pprod -DskipTests package

FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app
RUN addgroup -S protube && adduser -S -G protube protube
COPY --from=build --chown=protube:protube /workspace/backend/target/protube-back-0.0.1-SNAPSHOT.jar app.jar
USER protube
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
