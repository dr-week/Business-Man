# Authentication & User Database Architecture

## 1. Overview
BUSINESSman provides secure, passwordless authentication using **Google Identity Services (One Tap / OIDC)**, backed by a dedicated, isolated user & session database store.

## 2. Security Threat Model & Mitigations
- **No Stored Passwords**: Eliminates credential stuffing, password spray, and hash cracking attacks entirely.
- **Audience Isolation (Confused Deputy Prevention)**: `aud` claims in Google ID tokens are verified against `GOOGLE_CLIENT_ID`. Tokens issued for other applications are rejected immediately.
- **Cryptographic Expiration & Freshness**: Strict validation of `exp` and `iat` claims prevents token reuse.
- **Session Token Hashing**: Plaintext session tokens are never stored in the database. Tokens are hashed with SHA-256 before storage (`user_sessions.session_token_hash`).
- **Cookie Security**: Session cookies (`bm_session`) are issued with `HttpOnly; SameSite=Lax; Path=/; Secure (in production)` to mitigate cross-site scripting (XSS) and cross-site request forgery (CSRF).
- **Tenant & Identity Scoping**: Authenticated sessions map directly to `ownerId()`. Every market research run, check, and decision is isolated to the authenticated user.

## 3. Database Isolation
User identity and session tables are segregated from operational research dossiers:
- `users`: `id`, `google_sub`, `email`, `display_name`, `picture_url`, `role`, `created_at`, `last_login_at`
- `user_sessions`: `id`, `session_token_hash`, `user_id`, `expires_at`, `created_at`

Research tables (`opportunities`, `evidence`, `research_runs`) retain independent schema boundaries and reference only user `ownerId`.

## 4. API Endpoints
- `POST /api/auth/google`: Verifies Google credential token, provisions or updates the user record, and issues an `HttpOnly` session cookie.
- `GET /api/auth/me`: Retrieves current authenticated user profile (`401` if unauthenticated).
- `POST /api/auth/logout`: Revokes server-side session and clears the cookie.
