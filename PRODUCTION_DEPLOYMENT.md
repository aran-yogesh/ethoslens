# Production Deployment Guide

## ✅ Pre-Deployment Checklist

### 1. Security Considerations

#### Known Vulnerabilities (Non-Critical)
- **7 moderate/low severity vulnerabilities** in CopilotKit dependencies
- These are in non-production-critical syntax highlighting libraries
- Recommend updating CopilotKit packages when stable versions are available
- Monitor: https://github.com/advisories

#### Environment Variables
- **NEVER commit `.env` file to version control** ✅ (already in .gitignore)
- Use `.env.example` as template
- Store secrets in secure vault (AWS Secrets Manager, Azure Key Vault, etc.)

### 2. Configuration for Production

#### Update Environment Variables
```bash
# Copy and update for production
cp .env.example .env

# Update these for production:
- NEO4J_URI: Use production Neo4j Aura instance
- API Keys: Use production API keys with rate limits
- VITE_USE_INKEEP_AGENTS: Set to 'true' for Inkeep agents
- PORT: Default 4000 (or your production port)
```

#### Update Inkeep Agents URLs
For production, update in `.env`:
```
VITE_INKEEP_AGENTS_URL=https://your-production-inkeep-url
INKEEP_AGENTS_URL=https://your-production-inkeep-url
```

### 3. Build Optimization

The application is configured with:
- ✅ Code splitting (React, Graph, UI vendors)
- ✅ Chunk size optimization (1000KB limit)
- ✅ Gzip compression enabled
- ✅ Tree shaking for unused code

Build command:
```bash
npm run build
```

Expected output:
- Main bundle: ~827KB gzipped
- React vendor: Separate chunk
- Graph vendor: Separate chunk
- CSS: ~10KB gzipped

### 4. Deployment Options

#### Option A: Docker Deployment (Recommended)

1. **Build Docker images:**
```bash
# Build frontend
docker build -t ethoslens-frontend:latest -f Dockerfile .

# Build backend  
docker build -t ethoslens-backend:latest -f Dockerfile.backend .

# Build Inkeep agents
cd my-agent-directory
docker-compose up -d
```

2. **Run containers:**
```bash
docker run -d -p 5173:5173 --env-file .env ethoslens-frontend
docker run -d -p 4000:4000 --env-file .env ethoslens-backend
```

#### Option B: Traditional Hosting

1. **Build the application:**
```bash
npm install
npm run build
```

2. **Serve static files:**
- Upload `dist/` folder to CDN/Static hosting
- Examples: Vercel, Netlify, AWS S3 + CloudFront

3. **Run backend server:**
```bash
npm run server
```
- Use process manager (PM2, systemd)
- Configure reverse proxy (Nginx, Apache)

#### Option C: Cloud Platform Deployment

**Vercel/Netlify (Frontend):**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Heroku/Railway (Backend):**
```json
// Add to package.json
{
  "scripts": {
    "start": "node server.js"
  }
}
```

### 5. Health Monitoring

#### Health Check Endpoints
- Frontend: `http://your-domain/`
- Backend: `http://your-domain:4000/health`
- Governance Status: `http://your-domain:4000/api/governance/status`
- Inkeep Agents: `http://your-inkeep-url/health`

Expected responses:
```json
// Backend health
{
  "status": "healthy",
  "timestamp": "2025-10-14T05:11:17.305Z",
  "service": "EthosLens Agent Backend",
  "services": {
    "llamaIndex": true,
    "neo4j": true,
    "copilotKit": true
  }
}

// Governance status
{
  "success": true,
  "governance": {
    "usingInkeep": true,
    "inkeepAvailable": true,
    "agentType": "inkeep"
  }
}
```

### 6. Inkeep Agents Deployment

#### Deploy Agent Graphs
```bash
cd my-agent-directory

# Push graphs to production Inkeep service
pnpm inkeep push --config src/inkeep.config.ts

# Verify deployment
pnpm inkeep list-graphs
```

Expected output:
- ✅ governance-graph-basic (5 agents)
- ✅ governance-graph-advanced (7 agents)
- ✅ compliance-audit-graph (6 agents)

### 7. Performance Optimization

#### Frontend
- Enable CDN for static assets
- Configure caching headers
- Enable Brotli compression (better than gzip)
- Use lazy loading for routes

#### Backend
- Enable compression middleware
- Set up connection pooling for Neo4j
- Implement rate limiting
- Add request caching for frequent queries

#### Database
- Use Neo4j Aura production tier
- Configure read replicas if needed
- Set up automated backups
- Monitor query performance

### 8. Monitoring & Logging

#### Recommended Tools
- **Application Monitoring:** New Relic, Datadog, or Sentry
- **Log Aggregation:** ELK Stack, Splunk, or CloudWatch
- **Uptime Monitoring:** UptimeRobot, Pingdom
- **Neo4j Monitoring:** Neo4j Ops Manager

#### Key Metrics to Monitor
- Response times (p50, p95, p99)
- Error rates
- API rate limit usage
- Database connection pool
- Memory and CPU usage
- Violation detection accuracy

### 9. Security Hardening

#### HTTPS/TLS
- Use valid SSL certificates (Let's Encrypt)
- Enable HSTS headers
- Force HTTPS redirects

#### API Security
- Implement rate limiting (express-rate-limit)
- Add request validation
- Enable CORS with whitelist
- Add API key authentication for sensitive endpoints

#### Content Security
- Set CSP headers
- Enable XSS protection
- Add helmet.js middleware
- Sanitize all user inputs

### 10. Backup & Recovery

#### Database Backups
- Automated daily backups of Neo4j
- Store backups in separate region
- Test restore procedures monthly

#### Configuration Backups
- Version control all configuration
- Document all environment variables
- Keep encrypted backup of secrets

## 🚀 Deployment Steps

### Initial Deployment

1. **Prepare environment:**
```bash
git clone <repository>
cd AgenticFour
cp .env.example .env
# Edit .env with production values
```

2. **Install dependencies:**
```bash
npm install
cd my-agent-directory && pnpm install
```

3. **Deploy Inkeep agents:**
```bash
cd my-agent-directory
pnpm inkeep push --config src/inkeep.config.ts
```

4. **Build frontend:**
```bash
npm run build
```

5. **Start services:**
```bash
# Start Inkeep agents
./run.sh

# Start backend (in new terminal)
npm run server

# Serve frontend (production server)
npx serve -s dist -l 5173
```

6. **Verify deployment:**
```bash
curl http://localhost:4000/health
curl http://localhost:4000/api/governance/status
```

### Updates & Rollbacks

#### Updating Application
```bash
git pull origin main
npm install
npm run build
# Restart services
```

#### Rollback Procedure
```bash
git checkout <previous-commit>
npm install
npm run build
# Restart services
```

## 📋 Post-Deployment Verification

- [ ] All health endpoints return 200
- [ ] Governance system detects violations
- [ ] Inkeep agents are active (`agentType: "inkeep"`)
- [ ] No "Agent graph not found" errors
- [ ] Neo4j connection successful
- [ ] API rate limits functioning
- [ ] SSL certificates valid
- [ ] Monitoring alerts configured
- [ ] Backup procedures tested

## 🐛 Troubleshooting

### Common Issues

**1. "Agent graph not found" error**
- Verify Inkeep agents are deployed: `pnpm inkeep list-graphs`
- Check INKEEP_AGENTS_URL in .env
- Ensure headers include x-inkeep-project-id and x-inkeep-graph-id

**2. Neo4j connection failures**
- Verify credentials in .env
- Check network connectivity
- Confirm Aura instance is running

**3. High memory usage**
- Review chunk sizes in build
- Check for memory leaks in Node.js
- Monitor Neo4j connection pool

**4. Slow response times**
- Enable caching
- Optimize database queries
- Scale horizontally with load balancer

## 📞 Support

For issues specific to:
- **EthosLens:** Check PROJECT.md and README.md
- **Inkeep Agents:** https://docs.inkeep.com
- **Neo4j:** https://neo4j.com/docs/

## 🔄 Maintenance Schedule

- **Daily:** Monitor health checks and error rates
- **Weekly:** Review security advisories and update dependencies
- **Monthly:** Backup verification and disaster recovery drill
- **Quarterly:** Security audit and penetration testing
