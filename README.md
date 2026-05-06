# PAX — Social Platform

[![Backend CI](https://github.com/Jambbo/PAX/actions/workflows/backend-ci.yml/badge.svg)](https://github.com/Jambbo/PAX/actions/workflows/backend-ci.yml)
[![Java](https://img.shields.io/badge/Java-24-orange?logo=openjdk)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.5-brightgreen?logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql)](https://www.postgresql.org/)

PAX is a full-stack social platform built for real-time communication and community building. Users can publish posts, join groups, exchange direct messages, react to content, and manage their social graph — all secured with Keycloak-based OAuth2/OIDC authentication.

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Project Structure](#project-structure)

---

## Features

- **Authentication** — OAuth2 Authorization Code Flow with PKCE via Keycloak. JWT access tokens validated by the resource server.
- **Posts & Feed** — Create, update, delete posts. Like, bookmark, and view trending content sorted by views or likes.
- **Groups** — Public and private groups with owner/admin roles, member counts, and a personal wall group per user.
- **Comments** — Threaded comments with independent like/dislike reactions.
- **Real-time Chat** — WebSocket-based direct messaging using STOMP over SockJS with attachment support.
- **Notifications** — Real-time push notifications via WebSocket for likes, comments, and friend requests with missed-notification sync on reconnect.
- **Friend System** — Send, accept, and decline friend requests; check friendship status; remove friends.
- **Global Search** — Full-text search across users, groups, and posts in a single request.
- **Profile** — Editable profile, privacy toggle, online/offline status, bookmarks, liked posts.

---

## Architecture

```
PAX/
├── system/          # Spring Boot backend (Java 24, Gradle)
│   ├── REST API     # /api/v1/** controllers
│   ├── WebSocket    # STOMP — chat + notifications
│   ├── Security     # Keycloak JWT resource server
│   └── Database     # PostgreSQL + Liquibase migrations
│
├── frontend/        # React 19 + TypeScript + Vite frontend
│   ├── Auth         # PKCE OAuth2 flow, token refresh
│   ├── Features     # Chat, Notifications
│   └── Pages        # Feed, Groups, Profile, Messages, …
│
└── docker-compose.yml  # PostgreSQL, Keycloak, Keycloak-DB
```

**Tech stack:**

| Layer | Technology |
|---|---|
| Backend | Java 24, Spring Boot 3.5, Spring Security, Spring Data JPA |
| Frontend | React 19, TypeScript, Redux Toolkit, Vite, Tailwind CSS |
| Auth | Keycloak 26, OAuth2 PKCE, JWT |
| Database | PostgreSQL 17, Liquibase |
| Messaging | Spring WebSocket, STOMP, SockJS |
| Testing | JUnit 5, Mockito, Spring Boot Test, Jacoco |

---

## Prerequisites

| Tool | Version |
|---|---|
| Java (Temurin) | 24+ |
| Node.js | 18+ |
| Docker & Docker Compose | latest |
---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Jambbo/PAX.git
cd PAX
```

### 2. Configure environment variables

Create `system/.env` based on the template below (see [Configuration](#configuration) for all variables):

```bash
cp system/.env.example system/.env   # if provided, otherwise create manually
```

### 3. Start infrastructure

Postgres and Keycloak are managed by Docker Compose:

```bash
docker compose up -d
```

This starts:
- **PostgreSQL** on `localhost:5435` (application DB)
- **Keycloak** on `localhost:8080` (realm `pax`)
- **Keycloak PostgreSQL** on `localhost:5433`

Wait for Keycloak to be healthy (the health endpoint is `http://localhost:9000/health/ready`) before starting the backend.

### 4. Set up Keycloak realm

1. Open `http://localhost:8080` and log in with `admin / admin`
2. Create a realm named **`pax`**
3. Create a client **`pax-frontend`** with:
   - Client authentication: off (public client)
   - Authorization: off
   - Valid redirect URIs: `http://localhost:3000/*`
   - Web origins: `http://localhost:3000`
4. (Optional) Import seed data from `system/src/main/resources/liquibase/changesets/V2__insert_users_and_group_data.sql`

### 5. Start the backend

```bash
cd system
./gradlew bootRun
```

The API starts on `http://localhost:8081`.

### 6. Start the frontend

```bash
cd frontend/paxfrontend
npm install
npm run dev
```

The app opens at `http://localhost:3000`.

---

## Configuration

All backend configuration is driven by environment variables loaded from `system/.env`.

| Variable | Description | Example |
|---|---|---|
| `HOST` | PostgreSQL host and port | `localhost:5435` |
| `POSTGRES_DB` | Database name | `system_db` |
| `POSTGRES_SCHEMA` | Active schema | `paxsystem` |
| `POSTGRES_USER` | Database user | `postgres` |
| `POSTGRES_PASSWORD` | Database password | *(secret)* |
| `KEYCLOAK_ISSUER_URI` | Keycloak realm issuer URL | `http://localhost:8080/realms/pax` |
| `JWT_SECRET` | Signing secret (if using local JWT) | *(secret)* |
| `JWT_ACCESS_DURATION` | Access token lifetime | `1h` |
| `JWT_REFRESH_DURATION` | Refresh token lifetime | `2d` |
| `KC_DB_URL` | JDBC URL for Keycloak's own database | `jdbc:postgresql://pax-keycloak-postgres:5432/keycloak` |
| `KC_DB_USERNAME` | Keycloak DB user | `keycloak` |
| `KC_DB_PASSWORD` | Keycloak DB password | *(secret)* |

**Minimal `system/.env`:**

```properties
HOST=localhost:5435
POSTGRES_DB=system_db
POSTGRES_SCHEMA=paxsystem
POSTGRES_USER=postgres
POSTGRES_PASSWORD=changeme

KEYCLOAK_ISSUER_URI=http://localhost:8080/realms/pax
JWT_SECRET=changeme
JWT_ACCESS_DURATION=1h
JWT_REFRESH_DURATION=2d

KC_DB_URL=jdbc:postgresql://pax-keycloak-postgres:5432/keycloak
KC_DB_USERNAME=keycloak
KC_DB_PASSWORD=changeme
```

---

## Running the Application

| Command | What it does |
|---|---|
| `docker compose up -d` | Start Postgres + Keycloak |
| `./gradlew bootRun` (in `system/`) | Start the backend on `:8081` |
| `npm run dev` (in `frontend/paxfrontend/`) | Start the frontend on `:3000` |
| `./gradlew build` | Build and run all tests + coverage check |

---

## API Reference

All REST endpoints are prefixed with `/api/v1` unless noted. Every authenticated endpoint expects a `Bearer <JWT>` header issued by Keycloak.

---

### Users — `/api/v1/users`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/users/{id}` | — | Get user by ID |
| `GET` | `/api/v1/users` | — | List all users |
| `GET` | `/api/v1/users/count` | — | Total user count |
| `GET` | `/api/v1/users/username/{username}` | — | Find user by username |
| `GET` | `/api/v1/users/check-username/{username}` | — | Check username availability |
| `GET` | `/api/v1/users/latest?limit=5` | — | Recently joined users |
| `PUT` | `/api/v1/users/{id}` | owner | Update profile |
| `DELETE` | `/api/v1/users/{id}` | ADMIN | Delete account |
| `PATCH` | `/api/v1/users/me/status` | ✓ | Set ONLINE / OFFLINE |
| `PATCH` | `/api/v1/users/me/profile-privacy` | ✓ | Toggle profile visibility |
| `GET` | `/api/v1/users/search?username=` | ✓ | Search users by username prefix |
| `GET` | `/api/v1/users/me/friends` | ✓ | My friends list |
| `GET` | `/api/v1/users/{userId}/friendship-status` | ✓ | `FRIENDS` / `PENDING_OUTGOING` / `PENDING_INCOMING` / `NONE` |
| `POST` | `/api/v1/users/{userId}/friend-request` | ✓ | Send friend request |
| `POST` | `/api/v1/users/friend-request/{notificationId}/accept?senderId=` | ✓ | Accept friend request |
| `POST` | `/api/v1/users/friend-request/{notificationId}/decline` | ✓ | Decline friend request |
| `DELETE` | `/api/v1/users/{userId}/friend` | ✓ | Remove friend |
| `GET` | `/api/v1/users/me/friend-requests/outgoing` | ✓ | Outgoing pending requests |
| `GET` | `/api/v1/users/{userId}/wall` | ✓ | Get (or create) user wall group ID |
| `GET` | `/api/v1/users/group/{groupId}` | — | Members of a group |
| `GET` | `/api/v1/users/{userId}/likedPosts` | — | Posts liked by user |

---

### Posts — `/api/v1/posts`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/posts` | ✓ | Create post |
| `GET` | `/api/v1/posts/{id}` | — | Get post |
| `GET` | `/api/v1/posts/all` | — | All visible posts |
| `PUT` | `/api/v1/posts/{postId}` | owner | Update post |
| `DELETE` | `/api/v1/posts/{postId}` | owner / group owner / ADMIN | Delete post |
| `GET` | `/api/v1/posts/author/{authorId}` | — | Posts by author |
| `GET` | `/api/v1/posts/group/{groupId}` | — | Posts in group |
| `GET` | `/api/v1/posts/trending/views` | — | Top posts by views |
| `GET` | `/api/v1/posts/trending/likes` | — | Top posts by likes |
| `POST` | `/api/v1/posts/{id}/view` | — | Increment view count |
| `POST` | `/api/v1/posts/{postId}/like` | ✓ | Toggle like |
| `POST` | `/api/v1/posts/{id}/bookmark` | ✓ | Add bookmark |
| `DELETE` | `/api/v1/posts/{id}/bookmark` | ✓ | Remove bookmark |
| `GET` | `/api/v1/posts/bookmarks` | ✓ | My bookmarked posts |
| `GET` | `/api/v1/posts/{id}/bookmark/status` | ✓ | Is post bookmarked? |

**Create post request body:**

```json
{
  "text": "Hello, PAX!",
  "groupId": null,
  "images": ["https://example.com/photo.jpg"]
}
```

---

### Groups — `/api/v1/groups`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/groups` | ✓ | Create group |
| `GET` | `/api/v1/groups/{id}` | — | Get group |
| `GET` | `/api/v1/groups/all` | — | Groups not yet joined (or all if unauthenticated) |
| `GET` | `/api/v1/groups/me` | ✓ | My groups |
| `GET` | `/api/v1/groups/owner/{ownerId}` | — | Groups owned by user |
| `PUT` | `/api/v1/groups/{groupId}` | owner | Update group |
| `DELETE` | `/api/v1/groups/{groupId}` | owner / ADMIN | Delete group |
| `POST` | `/api/v1/groups/{groupId}/join` | ✓ | Join group |
| `POST` | `/api/v1/groups/{groupId}/leave` | ✓ | Leave group |

---

### Comments — `/api/v1/posts/{postId}/comments`

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/posts/{postId}/comments` | ✓ | Add comment |
| `GET` | `/api/v1/posts/{postId}/comments` | — | Get comments (newest first) |
| `PUT` | `/api/v1/posts/{postId}/comments/{commentId}` | owner / ADMIN | Update comment |
| `DELETE` | `/api/v1/posts/{postId}/comments/{commentId}` | owner / ADMIN | Delete comment |
| `POST` | `/api/v1/posts/{postId}/comments/{commentId}/like` | ✓ | Like comment |
| `POST` | `/api/v1/posts/{postId}/comments/{commentId}/dislike` | ✓ | Dislike comment |
| `DELETE` | `/api/v1/posts/{postId}/comments/{commentId}/interaction` | ✓ | Remove reaction |

---

### Notifications — `/api/v1/notifications`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/notifications?page=0&size=20` | ✓ | Paginated notifications |
| `GET` | `/api/v1/notifications/sync?lastId=0` | ✓ | Missed notifications since last ID |
| `PUT` | `/api/v1/notifications/{id}/read` | ✓ | Mark as read |
| `PUT` | `/api/v1/notifications/read-all` | ✓ | Mark all as read |
| `DELETE` | `/api/v1/notifications/{id}` | ✓ | Delete one |
| `DELETE` | `/api/v1/notifications` | ✓ | Delete all |

---

### Chat — `/api/chat`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/chat/conversations` | ✓ | My conversations |
| `GET` | `/api/chat/{conversationId}?page=0&size=20` | ✓ | Paginated message history |

**WebSocket (STOMP):**

Connect to `ws://localhost:8081/ws` with `Authorization: Bearer <JWT>` in the STOMP `CONNECT` frame.

| Destination | Direction | Description |
|---|---|---|
| `/app/chat.send` | client → server | Send a message |
| `/user/queue/messages` | server → client | Incoming messages |
| `/user/queue/notifications` | server → client | Real-time notifications |

---

### Search — `/api/v1/search`

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/search?query=java` | — | Search users, groups, and posts |

**Response:**

```json
{
  "users":  [ { "id": "…", "username": "javadev", … } ],
  "groups": [ { "id": 1, "name": "Java Enthusiasts", … } ],
  "posts":  [ { "id": 42, "text": "learning java", … } ]
}
```

---

## Testing

The backend has layered tests: repository (DataJpaTest with H2), service (Mockito unit tests), and controller (WebMvcTest with MockMvc). Jacoco enforces coverage minimums at build time.

```bash
# Run all tests
cd system && ./gradlew test

# Run tests with coverage report (output: build/reports/jacoco/test/html/index.html)
cd system && ./gradlew test jacocoTestReport

# Enforce coverage thresholds (90% instruction coverage on service, security, advice packages)
cd system && ./gradlew check
```

**Coverage thresholds** (enforced in CI):

| Package | Minimum |
|---|---|
| `com.example.system.service.*` | 90% |
| `com.example.system.rest.security` | 90% |
| `com.example.system.rest.controller.advice` | 90% |

---

## Project Structure

```
system/
├── src/main/java/com/example/system/
│   ├── domain/model/          # JPA entities: User, Post, Group, Comment, Notification, …
│   ├── repository/            # Spring Data JPA repositories
│   ├── service/               # Business logic (post, group, user, comment, chat, notification, search)
│   └── rest/
│       ├── controller/        # REST controllers + WebSocket controllers
│       ├── dto/               # Request/response DTOs (records + classes)
│       ├── dto/mapper/        # MapStruct mappers
│       └── security/          # OwnershipService, UserAuthorizationService, JwtChannelInterceptor
│
├── src/main/resources/
│   ├── application.yml        # Main config (env-var driven)
│   └── liquibase/             # Database migrations (V1__init.sql, V2__seed_data.sql)
│
├── src/test/
│   ├── java/…/repository/     # DataJpaTest — SQL query correctness
│   ├── java/…/service/        # Unit tests — business logic with Mockito
│   ├── java/…/rest/           # WebMvcTest — controller layer + security + exception handler
│   └── resources/
│       └── application.yml    # Test overrides (H2, stub Keycloak, disabled Liquibase)
│
└── build.gradle.kts           # Gradle build: dependencies, Checkstyle, Jacoco

frontend/paxfrontend/
├── src/
│   ├── features/Auth/         # PKCE OAuth2 flow, token storage, auto-refresh
│   ├── features/Chat/         # STOMP WebSocket client
│   ├── features/Notifications/# WebSocket notification hook
│   └── pages/                 # main, groups, profile, messages, bookmarks, trending, settings, notifications
└── vite.config.ts             # Dev server on :3000
```
