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

# 1. 실행에 필요한 Java 21 런타임이 포함된 베이스 이미지
# (openjdk:21-jdk-slim도 좋지만, 원래 사용하시던 eclipse-temurin으로 통일)
FROM eclipse-temurin:21

# 2. 컨테이너 내부에서 사용할 작업 디렉토리 설정
WORKDIR /app

# 3. deploy.yml 스크립트가 만들어 둔 'backend.jar' 파일을 이미지 안으로 복사
#    이 명령어는 빌드 컨텍스트(move/)에 있는 backend.jar를 찾습니다.
COPY backend.jar app.jar

# 4. 외부에 노출할 포트 번호 명시
EXPOSE 8080

# 5. 컨테이너가 시작될 때 JAR 파일을 실행
ENTRYPOINT ["java", "-jar", "app.jar"]