FROM eclipse-temurin:21
WORKDIR /app

# GitHub Actions에서 만든 JAR을 COPY
COPY backend.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
