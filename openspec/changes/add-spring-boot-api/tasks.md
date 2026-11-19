# Tasks

## 1. Project scaffold

- [x] 1.1 With the user's OK for the download, fetch a Spring Initializr zip (Maven, Java 21, Boot 4.2.0, deps web + actuator, group `com.ccards`, artifact `api`, package `com.ccards.api`) into the scratchpad, unzip it into `apps/api`, and remove `HELP.md`. Verify that `apps/api/pom.xml`, `mvnw`, `mvnw.cmd` and `.mvn/wrapper/maven-wrapper.properties` exist, and that the pom has parent `spring-boot-starter-parent` 4.2.0 and `java.version` 21
- [x] 1.2 Make `mvnw` executable in git (`git update-index --chmod=+x apps/api/mvnw`) and add `apps/api/target/` (Maven output) to `.gitignore`. Verify `git ls-files -s apps/api/mvnw` shows mode `100755` and that `git status` does not list `target/` after a build
- [x] 1.3 Run `./mvnw -B -q validate` in `apps/api`. Verify the wrapper downloads Maven and exits 0 with no global `mvn` installed

## 2. Health endpoint and configuration

- [x] 2.1 Replace `application.properties` with `application.yml` (port 8080, Actuator base path `/api`, exposure `health` only, `show-details: never`, as in design D4). Verify that `./mvnw spring-boot:run` starts, `curl -i localhost:8080/api/health` returns 200 with `{"status":"UP"}`, and that `/api/env` and `/actuator/health` return 404
- [x] 2.2 Add an integration test (`@SpringBootTest`, random port) that asserts `GET /api/health` returns 200 with `status` `UP`, and that `GET /api/env` returns 404. Verify `./mvnw -B test` passes. Then break the expected value on purpose, check that the run fails and names the test, and revert

## 3. Package layout

- [x] 3.1 Create the `com.ccards.api.controller`, `.service` and `.repository` packages, each with a `package-info.java` that describes its role and the controller → service → repository dependency direction. Verify `./mvnw -B compile` passes and that the three packages are tracked in git

## 4. Nx integration

- [x] 4.1 Add `apps/api/project.json` (name `api`, `projectType: application`) with `nx:run-commands` targets `serve` (continuous, `readyWhen` on the "Started ApiApplication" log line), `build` (`package -DskipTests`, outputs `{projectRoot}/target`, cached, inputs as in D2) and `test` (cached), all with `cwd: apps/api`. Verify that `npx nx show projects` lists `api` and `web`, and that `npx nx show project api` shows the three targets
- [x] 4.2 Verify `npx nx serve api` starts on port 8080 and `curl localhost:8080/api/health` returns `{"status":"UP"}`. While it runs, start a second `npx nx serve api` and check that it fails and reports that port 8080 is in use
- [x] 4.3 Verify that `npx nx test api` exits 0 and that a second run with no changes is served from the Nx cache
- [x] 4.4 Verify that `npx nx build api` produces `apps/api/target/api-*.jar`, that `java -jar` on it serves `/api/health` → `{"status":"UP"}`, and that `npx nx lint web` and `npx nx test web` still pass (nothing broken for `web`)

## 5. Documentation

- [x] 5.1 Update the root `README.md`: add JDK 21 to requirements, a stack-table row for Spring Boot 4.2 / Java 21 / Maven (wrapper), the project structure (`apps/web`, `apps/api` with `controller` / `service` / `repository` and their roles), the `nx serve|test|build api` commands, the health URL, and a note that the first run downloads Maven and dependencies. Also note why Maven and Boot 4.2 were chosen over the issue's "Spring Boot 3". Verify that each documented `api` command runs as written and that `npm run format:check` passes

## 6. Integration check

- [x] 6.1 From a clean clone (`npm ci`, empty Nx cache), run `nx serve api` + health curl, `nx test api` and `nx build api`. Verify that all succeed and match the acceptance criteria of issue #2

## Workflow follow-up

- Archive the change after review (`/opsx:archive`) so `api-service` becomes a main spec. The earlier `setup-nx-angular-workspace` change is still unarchived as well.
- Check off the acceptance criteria on issue #2 once merged, and mention the Spring Boot 4.2 deviation in the PR.
