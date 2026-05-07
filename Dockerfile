FROM eclipse-temurin:26-jdk AS build
WORKDIR /app

COPY .mvn ./.mvn
COPY mvnw mvnw.cmd pom.xml ./
COPY src ./src

RUN chmod +x mvnw && ./mvnw -DskipTests package

FROM eclipse-temurin:26-jre
WORKDIR /app

COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8085

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
