FROM eclipse-temurin:21 AS build
WORKDIR /app
COPY . .
RUN ./gradlew clean bootJar -x test

FROM eclipse-temurin:21
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]


