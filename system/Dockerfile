FROM eclipse-temurin:24-jdk AS build
WORKDIR /app
COPY . .
RUN chmod +x ./gradlew
RUN ./gradlew build -x test

FROM eclipse-temurin:24-jre
WORKDIR /app
COPY --from=build /app/build/libs/system-1.0.0.jar app.jar
CMD ["java", "-jar", "app.jar"]
