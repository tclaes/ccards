# ccards

Nx monorepo with an Angular web app (`apps/web`) and a Spring Boot API (`apps/api`).

## Requirements

- Node.js 24 (see `.nvmrc`; run `nvm use`)
- npm
- JDK 21 (for `apps/api`). Maven is **not** needed: the Maven Wrapper (`apps/api/mvnw`) downloads it on first use.

## Stack

| Tool                | Version  |
| ------------------- | -------- |
| Nx                  | 24.0.0   |
| Angular             | 22.2     |
| Vitest (unit tests) | 4.x      |
| TypeScript          | 6.0      |
| ESLint, Prettier    | 9.x, 3.x |
| Spring Boot         | 4.2      |
| Java                | 21       |
| Maven (via wrapper) | 3.10     |

The web app uses standalone components, signals and zoneless change detection (no `zone.js`).

### Why Maven and Spring Boot 4.2

- **Maven** over Gradle: it is the most common build tool in Spring Boot docs and projects, and the declarative `pom.xml` is easy to learn from. The wrapper pins the version for everyone.
- **Spring Boot 4.2** instead of the "Spring Boot 3" in issue #2: 4.2 is the current release, and the 3.x line no longer gets free security patches. Watch out when following 3.x tutorials: some starters have new names in 4.x (for example `spring-boot-starter-webmvc`, and the test starters per module).

## Project structure

```text
apps/
  web/                         Angular front end
  api/                         Spring Boot back end
    pom.xml                    Maven build (parent: spring-boot-starter-parent)
    mvnw, mvnw.cmd, .mvn/      Maven Wrapper
    project.json               Nx targets (serve / build / test call ./mvnw)
    src/main/java/com/ccards/api/
      ApiApplication.java      entry point (@SpringBootApplication)
      controller/              HTTP layer: @RestController, no business logic
      service/                 business logic and transactions
      repository/              data access (Spring Data)
    src/main/resources/
      application.yml          configuration (port, Actuator)
    src/test/java/...          tests (JUnit 5, Spring Boot Test)
```

The back end is split into layers. Dependencies only point downwards: **controller → service → repository**, never the other way round. A controller never calls a repository directly.

## Getting started

```sh
nvm use
npm ci
```

## Commands

Web app:

```sh
npx nx serve web   # dev server on http://localhost:4200
npx nx lint web    # ESLint
npx nx test web    # unit tests (Vitest)
npx nx build web   # production build to dist/apps/web
```

API:

```sh
npx nx serve api   # starts the API on http://localhost:8080
npx nx test api    # JUnit tests (./mvnw test)
npx nx build api   # executable JAR in apps/api/target/
java -jar apps/api/target/api-0.0.1-SNAPSHOT.jar   # run the built JAR
```

Health check: `curl http://localhost:8080/api/health` returns `{"status":"UP"}`.

The first API command is slow, because the wrapper downloads Maven and the dependencies into `~/.m2`. After that they run from the local cache.

If port 8080 is taken, the API stops with "Port 8080 was already in use". Nx still prints "Successfully ran target serve" in that case (Nx treats a finished continuous target as success), so read the log. To use another port, run `SERVER_PORT=8081 npx nx serve api`.

Formatting:

```sh
npm run format:check   # Prettier check
npm run format         # Prettier write
```

## Specs

Behavior and planned changes are tracked with [OpenSpec](https://github.com/Fission-AI/OpenSpec) in `openspec/`.
