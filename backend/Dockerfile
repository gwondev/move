# 1단계: 빌드
FROM eclipse-temurin:17 AS build
WORKDIR /app

# Gradle Wrapper와 소스 복사
COPY . .
RUN ./gradlew clean bootJar -x test

# 2단계: 실행
FROM eclipse-temurin:17
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
