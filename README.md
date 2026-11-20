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

## Local stack (PostgreSQL + Mailpit)

Needs Docker with Compose v2. The stack lives in `apps/api/compose.yaml`:

```sh
cd apps/api
docker compose up -d       # start PostgreSQL and Mailpit
docker compose down        # stop (data is kept in the `ccards_postgres-data` volume)
docker compose down -v     # stop and wipe the database
```

| Service    | Host address          | Notes                                        |
| ---------- | --------------------- | -------------------------------------------- |
| PostgreSQL | `localhost:5432`      | database/user/password: `ccards` (dev only)  |
| Mailpit    | SMTP `localhost:1025` | catches all mail, nothing leaves the machine |
| Mailpit UI | http://localhost:8025 | read the captured mail                       |

Ports are bound to `127.0.0.1` only. To change ports or credentials, copy `apps/api/.env.example` to `apps/api/.env` (git-ignored). Compose and `nx serve` both read it. If a port is taken (for example another PostgreSQL on 5432), compose fails with "port is already allocated"; set `POSTGRES_PORT` in `.env`. Set credential overrides before the first `docker compose up`: PostgreSQL applies `POSTGRES_USER`/`POSTGRES_PASSWORD`/`POSTGRES_DB` only to an empty data directory, so after changing them run `docker compose down -v` to recreate the database (this deletes its data).

Start the API against the stack with the Spring `local` profile:

```sh
npx nx serve api --configuration=local
```

With `local`, `/api/health` also reflects the database: it returns 503 `{"status":"DOWN"}` while PostgreSQL is unreachable. Without the profile (`npx nx serve api`, `npx nx test api`) no database or mail server is needed.

## Database migrations (Flyway)

The database schema is created and changed **only** by [Flyway](https://flywaydb.org/) migrations. Pending migrations run automatically when the API starts with the `local` profile; they are recorded in the `flyway_schema_history` table. Without the profile there is no database, so nothing runs.

- **Location:** `apps/api/src/main/resources/db/migration/`
- **Naming:** `V<number>__<snake_case_description>.sql`, for example `V2__create_loyalty_card.sql` (two underscores). `V1__init.sql` is an empty baseline.
- **Never edit a migration that has been applied** (anywhere, including a teammate's machine). Flyway stores a checksum and refuses to start with "checksum mismatch". Add a new `V<n+1>` that changes the schema instead.
- **Reset locally:** run `docker compose down -v` in `apps/api` to wipe the database (this also removes the containers), then `docker compose up -d --wait` to start PostgreSQL again and wait until it is healthy. The next API start with the `local` profile re-applies every migration from `V1`.
- **Hibernate only validates** (`spring.jpa.hibernate.ddl-auto=validate`). If an entity maps to a table or column no migration created, the API fails at startup with a validation error. We do not use `ddl-auto=update`: it changes the schema silently, leaves no history, cannot be reviewed in a pull request and can behave differently per machine.

The migration tests (`FlywayMigrationTests`) start a throwaway PostgreSQL with Testcontainers. They are skipped, not failed, when Docker is not available, so `npx nx test api` still works without Docker; run it with Docker before merging changes to migrations. Whether Docker is running is an input of the Nx `test` cache, so a result from a run without Docker is never reused once Docker is up.

## Continuous integration

`.github/workflows/ci.yml` runs on every pull request and on every push to `main`. It installs Node (from `.nvmrc`) and Java 21, then runs lint, test and build for the **affected** projects only:

```sh
npx nx affected -t lint test build   # what CI runs
npx nx run-many -t lint test build --all   # everything, regardless of changes
```

Locally, `affected` compares against `main` by default. Changes to shared files (`package.json`, `nx.json`, `.nvmrc`, `.github/workflows/`, ...) affect every project. A change that touches no project (for example only `README.md`) passes without running any task. `api` has no lint target yet (Java lint is not set up); it is covered by test and build. The runner has Docker, so `FlywayMigrationTests` run in CI instead of being skipped.

The single job is named `CI`. That name is the required status check on `main`; do not rename it without updating the protection rule. Branch protection is a repository setting (needs admin rights) and was applied once with:

```sh
gh api -X PUT repos/tclaes/ccards/branches/main/protection --input - <<'EOF'
{
  "required_status_checks": { "strict": false, "contexts": ["CI"] },
  "enforce_admins": false,
  "required_pull_request_reviews": { "required_approving_review_count": 0 },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```

The `CI` check must have run at least once before it can be required. To remove the rule: `gh api -X DELETE repos/tclaes/ccards/branches/main/protection`.

## Specs

Behavior and planned changes are tracked with [OpenSpec](https://github.com/Fission-AI/OpenSpec) in `openspec/`.
