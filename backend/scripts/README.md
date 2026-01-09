# Backend Scripts

Utility scripts for backend development and deployment.

## Available Scripts

### `generate-secrets.js`

Generates strong cryptographic secrets for JWT authentication.

**Usage:**

```bash
node scripts/generate-secrets.js
```

**Output:**

```
JWT_SECRET=<64-character-hex-string>
REFRESH_TOKEN_SECRET=<64-character-hex-string>
```

**When to use:**

- Initial production setup
- Security rotation of secrets
- Creating new environments

**⚠️ Security Note:** Never commit generated secrets to version control. Copy them directly to your `.env` file on the server.

---

### `pre-deploy-check.js`

Validates that your application is ready for production deployment.

**Usage:**

```bash
node scripts/pre-deploy-check.js
```

**Checks performed:**

- ✓ Build files exist (backend `dist/`, frontend `dist/`)
- ✓ Configuration files present (`.env.example`)
- ✓ Required directories exist or will be created
- ✓ All npm scripts defined
- ✓ Environment variables documented
- ✓ TypeScript compilation successful

**Exit codes:**

- `0` - All checks passed (ready to deploy)
- `1` - Critical errors found (fix before deploying)

**When to use:**

- Before every production deployment
- In CI/CD pipelines
- After major configuration changes

---

## Adding New Scripts

Place utility scripts in this directory and document them above.
