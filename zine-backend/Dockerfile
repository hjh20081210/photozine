# ---- 构建阶段：用 Maven + JDK17 编译打 jar ----
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -B -q dependency:go-offline || true
COPY src ./src
RUN mvn -B -q -DskipTests package

# ---- 运行阶段：轻量 JRE17 ----
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

ENV UPLOAD_PATH=/app/upload
RUN mkdir -p /app/upload

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]