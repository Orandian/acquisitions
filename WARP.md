# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview

- Runtime: Node.js (ES Modules)
- Framework: Express
- Database: PostgreSQL via Neon HTTP driver + Drizzle ORM
- Key features: Auth (sign-up) with Zod validation, bcrypt hashing, JWT issuance, secure cookies, structured logging

Common commands

- Install dependencies
  - npm install
- Run the dev server (auto-restart on file changes)
  - npm run dev
- Lint
  - npm run lint
  - npm run lint:fix
- Format
  - npm run format
  - npm run format:check
- Database (Drizzle)
  - Generate SQL migrations from models: npm run db:generate
  - Apply migrations to DATABASE_URL: npm run db:migrate
  - Inspect DB and migrations: npm run db:studio

Environment
Define these variables (e.g., via .env):

- DATABASE_URL: Postgres connection string (Neon or any Postgres)
- JWT_SECRET: Secret for signing JWTs
- JWT_EXPIRATION: e.g., 1d, 12h (default 1d)
- PORT: HTTP port (default 3000)
- LOG_LEVEL: winston level (e.g., info, debug)
- NODE_ENV: development or production

Architecture and flow

- Entry
  - src/index.js loads environment (dotenv) and starts the HTTP server (src/server.js)
  - src/server.js binds app.listen(PORT)
  - src/app.js constructs the Express app, configures middleware, and mounts routes
- Routing
  - Base routes: GET / (Hello World), GET /health, GET /api
  - Auth routes mounted at /api/auth (src/routes/auth.routes.js)
    - POST /api/auth/sign-up → signup controller
- Controllers and validation
  - signup (src/controllers/auth.controller.js)
    - Validates req.body with Zod (src/validations/auth.validation.js)
    - Calls createUser service
    - Issues JWT via utils/jwt.js and sets cookie via utils/cookies.js
- Services and data
  - src/services/auth.service.js
    - Hashes password with bcrypt
    - Uses Drizzle ORM against Neon HTTP driver
    - Checks uniqueness by email, inserts user, returns selected fields
- Data access
  - src/config/database.js exports db and sql
  - Models defined in src/models/\*.js (e.g., users table in user.model.js)
  - Drizzle config at drizzle.config.js (schema: src/models/\*.js, out: drizzle/)
  - Generated migrations in drizzle/
- Middleware and logging
  - Security: helmet, cors
  - Parsing: express.json, express.urlencoded, cookie-parser
  - Logging: morgan streams into winston (src/config/logger.js)
  - Logger writes to logs/error.log and logs/combined.log; console logging in non-production
- Module resolution
  - Uses Node import maps in package.json "imports" for #aliases (e.g., #routes/_, #services/_)

Testing status

- No test runner or npm test script is currently configured
- ESLint includes a tests/\*_/_.js override (globals for typical test APIs), but there are no test files yet

Operational hints

- Health check: GET /health returns { status: 'OK', timestamp, uptime }
- Auth sign-up payload (JSON): { name, email, password, role? } with role ∈ { 'user', 'admin' }
- JWT and cookie behavior
  - utils/jwt.js reads JWT_SECRET and JWT_EXPIRATION
  - utils/cookies.js sets httpOnly, sameSite=strict, secure in production, 15m maxAge

Troubleshooting

- Drizzle commands require DATABASE_URL; ensure .env is loaded (dotenv is used in runtime and drizzle.config.js)
- If logs directory is missing, winston file transports will create it when first writing
