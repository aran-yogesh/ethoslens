// Inkeep Agents integration service (JS version for Node runtime)

class InkeepAgentsService {
  static instance;

  constructor() {
    // Use non-VITE prefixed vars for Node.js backend
    this.baseUrl = process.env.INKEEP_AGENTS_URL || process.env.VITE_INKEEP_AGENTS_URL || 'http://localhost:3003';
    this.isEnabled = process.env.USE_INKEEP_AGENTS === 'true' || process.env.VITE_USE_INKEEP_AGENTS === 'true';
    console.log(`[Inkeep] Constructor: USE_INKEEP_AGENTS="${process.env.USE_INKEEP_AGENTS}", isEnabled=${this.isEnabled}, baseUrl=${this.baseUrl}`);
  }

  static getInstance() {
    if (!InkeepAgentsService.instance) {
      InkeepAgentsService.instance = new InkeepAgentsService();
    }
    return InkeepAgentsService.instance;
  }

  async isAvailable() {
    if (!this.isEnabled) {
      console.log('[Inkeep] Not enabled (VITE_USE_INKEEP_AGENTS !== true)');
      return false;
    }
    
    // In Node.js environment, use http/https module instead of fetch
    const http = await import('http');
    const https = await import('https');
    
    return new Promise((resolve) => {
      try {
        const parsedUrl = new URL(this.baseUrl + '/health');
        const client = parsedUrl.protocol === 'https:' ? https.default : http.default;
        
        console.log(`[Inkeep] Checking availability at ${parsedUrl.href}`);
        
        const req = client.request(parsedUrl, { method: 'GET', timeout: 5000 }, (res) => {
          // HTTP 204 (No Content) is the success response
          const isAvailable = res.statusCode === 204 || (res.statusCode >= 200 && res.statusCode < 300);
          console.log(`[Inkeep] Health check response: ${res.statusCode}, available: ${isAvailable}`);
          resolve(isAvailable);
        });
        
        req.on('error', (err) => {
          console.log(`[Inkeep] Health check error: ${err.message}`);
          resolve(false);
        });
        req.on('timeout', () => {
          console.log('[Inkeep] Health check timeout');
          req.destroy();
          resolve(false);
        });
        req.end();
      } catch (err) {
        console.log(`[Inkeep] Health check exception: ${err.message}`);
        resolve(false);
      }
    });
  }

  async processAdvancedGovernance(input, output, context) {
    const response = await fetch(`${this.baseUrl}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        graphId: 'governance-graph-advanced',
        message: `Please perform advanced governance analysis on this AI interaction:\n\nInput: "${input}"\nOutput: "${output}"\n${context ? `Context: ${JSON.stringify(context)}` : ''}`,
      }),
    });
    if (!response.ok) throw new Error(`Inkeep agents API error: ${response.status}`);
    const result = await response.json();
    return this.#parseAdvanced(result);
  }

  async processFeedback(interactionId, feedback) {
    const response = await fetch(`${this.baseUrl}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        graphId: 'compliance-audit-graph',
        message: `Please process user feedback for interaction ${interactionId}:\nType: ${feedback.rating}\n${feedback.comment ? `Comment: ${feedback.comment}` : ''}`,
      }),
    });
    if (!response.ok) throw new Error(`Inkeep agents API error: ${response.status}`);
    const result = await response.json();
    return { feedbackProcessed: true, auditLogCreated: true, raw: result };
  }

  async getGovernanceInsights(timeframe = 'today') {
    const response = await fetch(`${this.baseUrl}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        graphId: 'compliance-audit-graph',
        message: `Provide governance insights for ${timeframe}.`,
      }),
    });
    if (!response.ok) throw new Error(`Inkeep agents API error: ${response.status}`);
    const result = await response.json();
    return { raw: result };
  }

  #parseBasic(response) {
    const content = response.content || response.message || '';
    const hasViolation = /violation|blocked/i.test(content);
    const severity = /critical/i.test(content) ? 'critical' : hasViolation ? 'high' : 'low';
    return {
      violations: hasViolation ? [{ type: 'compliance', description: 'Detected by Inkeep', severity: /critical/i.test(content) ? 9 : 7, confidence: 0.85, reason: 'Inkeep analysis' }] : [],
      agentActions: [{ agentName: 'InkeepGovernanceCoordinator', action: hasViolation ? 'flag' : 'approve', details: content.slice(0, 200) + '...', timestamp: new Date() }],
      status: hasViolation ? (/critical/i.test(content) ? 'blocked' : 'pending') : 'approved',
      severity,
    };
  }

  #parseAdvanced(response) {
    const basic = this.#parseBasic(response);
    return { ...basic, verificationResults: { isAccurate: !/misinformation/i.test(response.content || ''), confidence: 0.85 } };
  }
}

export const inkeepAgentsService = InkeepAgentsService.getInstance();
