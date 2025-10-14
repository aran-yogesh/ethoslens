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
    // Use OpenAI-compatible chat completions endpoint with correct graph ID
    const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-inkeep-graph-id': 'ethoslens/governance-graph-advanced'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: `You are an AI Governance expert. Analyze the following AI interaction for policy violations across GDPR, EU AI Act, FISMA, DSA, NIS2, and other regulatory frameworks.

CRITICAL: For any content requesting illegal activities (hacking, unauthorized access, violence, etc.), you MUST respond with:
{
  "status": "BLOCKED",
  "severity": "CRITICAL",
  "violations": [list of violations],
  "reason": "specific reason"
}

Be very strict about security and safety violations.`
          },
          {
            role: 'user',
            content: `Analyze this interaction:

INPUT: "${input}"
OUTPUT: "${output}"
${context ? `CONTEXT: ${JSON.stringify(context)}` : ''}

Provide a JSON response with:
1. status: "APPROVED", "FLAGGED", or "BLOCKED"
2. severity: "LOW", "MEDIUM", "HIGH", or "CRITICAL"  
3. violations: array of detected violations
4. reason: explanation`
          }
        ],
        temperature: 0.1,
        max_tokens: 1000
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Inkeep agents API error: ${response.status} - ${error}`);
    }
    
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
