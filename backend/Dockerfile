FROM eclipse-temurin:21-jdk AS build
WORKDIR /src
COPY mvnw pom.xml ./
COPY .mvn .mvn
RUN ./mvnw -q dependency:go-offline
COPY src src
# Tests need a live MySQL, so they run outside the image build.
RUN ./mvnw -q package -DskipTests

FROM eclipse-temurin:21-jre
WORKDIR /app
RUN useradd --system app && mkdir uploads && chown app uploads
COPY --from=build /src/target/*.jar app.jar
USER app
# Hotel photos; mount a volume here so they survive container restarts.
VOLUME /app/uploads
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
