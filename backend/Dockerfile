FROM public.ecr.aws/docker/library/maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src
COPY pom.xml ./
RUN mvn -q dependency:go-offline
COPY src src
RUN mvn -q package -DskipTests

FROM public.ecr.aws/docker/library/eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S app && adduser -S app -G app && mkdir uploads && chown app:app uploads
COPY --from=build /src/target/*.jar app.jar
USER app
VOLUME /app/uploads
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/api/actuator/health | grep -q '"status":"UP"' || exit 1
ENTRYPOINT ["java", "-jar", "app.jar"]