# Security-Focused Workflow

## Task

[DESCRIBE THE SECURITY-SENSITIVE TASK HERE]

---

## Phase 1: Threat Modeling

Before writing any code:

1. Identify assets being protected (user data, recipes, pantry, auth tokens)
2. Identify threat actors (unauthenticated users, malicious users)
3. List potential attack vectors
4. Determine security requirements
5. Review existing security controls (Clerk auth, Zod validation)

**Deliverable:** Threat assessment in TodoWrite

---

## Phase 2: TDD with Security Tests

### Step 1: Write Security Test Cases First

```typescript
describe("Security: functionName", () => {
  it("rejects malicious input", () => { ... });
  it("enforces authorization", () => { ... });
  it("handles edge cases safely", () => { ... });
});
```

### Step 2: Implement Secure Code

- Input validation FIRST (Zod schemas)
- Principle of least privilege
- Fail securely (deny by default)
- Defense in depth

### Step 3: Verify Security Tests Pass

---

## Phase 3: Quality Gates

Run all gates - ALL must pass:

```bash
pnpm typecheck  # 0 errors required
pnpm lint       # 0 errors required
```

---

## Phase 4: OWASP Top 10 Review

### A01: Broken Access Control

- [ ] Clerk auth middleware on every protected route
- [ ] No direct object references without userId check
- [ ] CORS properly configured (hono/cors)

### A03: Injection

- [ ] All inputs validated with Zod
- [ ] Drizzle ORM parameterized queries (never raw SQL)
- [ ] No dynamic code execution with user input

### A05: Security Misconfiguration

- [ ] No default credentials
- [ ] Error messages don't leak stack traces (errorHandler middleware)
- [ ] No secrets in code or client bundle

### A07: Auth Failures

- [ ] Clerk JWT verification on all API routes
- [ ] Token expiry handled (401 -> client re-auth)

---

## Phase 5: API Security (if applicable)

### Authentication

- [ ] Clerk JWT properly validated in middleware
- [ ] Token expiration enforced
- [ ] No sensitive data in response unless authorized

### Input Validation

- [ ] Request body validated with Zod schemas
- [ ] Request size limits considered
- [ ] Content-type validation

### Response Security

- [ ] No sensitive data exposure (passwords, tokens, internal IDs)
- [ ] Proper error codes (no stack traces to client)

---

## Phase 6: Code Review (Security QCHECK)

Score each 0-10:

### Input Handling

- [ ] All inputs validated at boundary
- [ ] Zod schemas comprehensive
- [ ] Type coercion handled

### Authentication/Authorization

- [ ] Auth checks present on all routes
- [ ] Least privilege enforced (userId scoping)
- [ ] No privilege escalation paths

### Data Protection

- [ ] Sensitive data identified
- [ ] No secrets in code
- [ ] API keys only in environment variables

**Target:** >= 95/100 (higher for security work)

---

## Success Criteria

ALL must be true:

- [ ] Quality gates pass (0 errors)
- [ ] QCHECK score >= 95/100
- [ ] OWASP checklist complete
- [ ] No known vulnerabilities introduced

---

## Completion

When ALL criteria are met, stage changes and wait for user commit approval:

```
feat(security): description
# or
fix(security): description
```

Then output:

```
<promise>SECURITY VERIFIED - QCHECK SCORE: [score]/100</promise>
```
