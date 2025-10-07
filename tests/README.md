# Tests

This directory contains test files for the EthosLens project.

## Integration Tests

### test-integration.js
Integration test script for testing the EthosLens governance system with both legacy and Inkeep agents.

**Usage:**
```bash
# Make sure the server is running first
npm run server

# In another terminal, run the integration tests
node tests/test-integration.js
```

**What it tests:**
- Service availability (main backend and Inkeep agents)
- Safe prompts (should be approved)
- PII requests (should be blocked)
- Misinformation detection (should be flagged)
- Violence/harmful content (should be blocked)
- Agent switching between legacy and Inkeep implementations
