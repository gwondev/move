#FROM eclipse-temurin:21 AS build
#WORKDIR /app
#COPY . .
#RUN ./gradlew clean bootJar -x test

#FROM eclipse-temurin:21
#WORKDIR /app
#COPY --from=build /app/build/libs/*.jar app.jar
#EXPOSE 8080
#ENTRYPOINT ["java", "-jar", "app.jar"]

# DockerHub 레지스트리 방식 대신, 서버 빌드 방식에 최적화된 Dockerfile

FROM openjdk:21-jdk-slim
WORKDIR /backend
COPY build/libs/*.jar backend.jar
EXPOSE 8080
CMD ["java", "-jar", "backend.jar"]