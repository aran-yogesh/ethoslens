// Unified governance service (JS runtime for Node server)
import { inkeepAgentsService } from './inkeepAgentsService.js';

class GovernanceService {
  static instance;
  useInkeepAgents;
  inkeepAvailable = false;

  constructor() {
    this.useInkeepAgents = process.env.VITE_USE_INKEEP_AGENTS === 'true';
    this.#checkInkeepAvailability();
  }

  static getInstance() {
    if (!GovernanceService.instance) {
      GovernanceService.instance = new GovernanceService();
    }
    return GovernanceService.instance;
  }

  async #checkInkeepAvailability() {
    this.inkeepAvailable = await inkeepAgentsService.isAvailable();
  }

  async processInteraction(input, output, context) {
    const interaction = {
      id: `interaction_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      input,
      output,
      timestamp: new Date(),
      status: 'pending',
      severity: 'low',
      violations: [],
      agentActions: [],
    };

    const useInkeep = this.useInkeepAgents && this.inkeepAvailable;
    try {
      if (useInkeep) {
        const result = await inkeepAgentsService.processAdvancedGovernance(input, output, context);
        interaction.violations.push(...(result.violations || []));
        interaction.agentActions.push(...(result.agentActions || []));
      } else {
        // Legacy fallback with proper violation detection
        const violations = this.#detectViolations(input, output);
        interaction.violations.push(...violations);
        interaction.agentActions.push({ 
          agentName: 'LegacyPolicyEnforcer', 
          action: violations.length > 0 ? 'block' : 'approve',
          details: `Detected ${violations.length} violation(s)`, 
          timestamp: new Date() 
        });
      }
    } catch (e) {
      interaction.agentActions.push({ agentName: 'GovernanceService', action: 'log', details: `Processing error: ${e.message}`, timestamp: new Date() });
    }

    // Finalize status
    if (interaction.violations.length === 0) {
      interaction.status = 'approved';
      interaction.severity = 'low';
    } else if (interaction.violations.some(v => v.severity >= 9)) {
      interaction.status = 'blocked';
      interaction.severity = 'critical';
    } else if (interaction.violations.some(v => v.severity >= 7)) {
      interaction.status = 'pending';
      interaction.severity = 'high';
    } else {
      interaction.status = 'pending';
      interaction.severity = 'medium';
    }

    return interaction;
  }

  getStatus() {
    return {
      usingInkeep: this.useInkeepAgents,
      inkeepAvailable: this.inkeepAvailable,
      agentType: this.useInkeepAgents && this.inkeepAvailable ? 'inkeep' : 'legacy',
    };
  }

  async switchAgentType(useInkeep) {
    this.useInkeepAgents = !!useInkeep;
    if (this.useInkeepAgents) await this.#checkInkeepAvailability();
  }

  async getGovernanceInsights(timeframe = 'today') {
    if (this.useInkeepAgents && this.inkeepAvailable) {
      return await inkeepAgentsService.getGovernanceInsights(timeframe);
    }
    return { totalInteractions: 0, totalViolations: 0, blockedCount: 0, approvalRate: '100%' };
  }

  #detectViolations(input, output) {
    const violations = [];
    const text = `${input} ${output}`.toLowerCase();

    // WiFi hacking detection patterns (with hyphen support)
    const wifiHackingPatterns = [
      /hack\s+into\s+someone.*wi[-\s]?fi/i,
      /hack\s+into.*wi[-\s]?fi/i,
      /break\s+into.*wi[-\s]?fi.*without.*knowing/i,
      /crack.*wi[-\s]?fi.*password/i,
      /bypass.*wi[-\s]?fi.*security/i,
      /steal.*wi[-\s]?fi.*password/i,
      /unauthorized.*wi[-\s]?fi.*access/i,
      /how\s+(do|can|to)\s+i.*hack.*wi[-\s]?fi/i,
    ];

    for (const pattern of wifiHackingPatterns) {
      if (pattern.test(text)) {
        violations.push({
          type: 'illegal_activity',
          description: 'WiFi hacking attempt detected',
          reason: 'Content requests assistance with unauthorized WiFi access (hacking)',
          severity: 9.0,
          confidence: 0.95,
          regulatoryFramework: 'Computer Fraud and Abuse Act'
        });
        break;
      }
    }

    // General hacking patterns
    const hackingPatterns = [
      /hack\s+into/i,
      /break\s+into\s+(account|system|network)/i,
      /crack\s+password/i,
      /bypass\s+security/i,
      /unauthorized\s+access/i,
      /exploit\s+vulnerability/i,
    ];

    for (const pattern of hackingPatterns) {
      if (pattern.test(text) && violations.length === 0) {
        violations.push({
          type: 'illegal_activity',
          description: 'Illegal hacking or cybersecurity violation detected',
          reason: 'Content requests assistance with unauthorized access or hacking',
          severity: 9.5,
          confidence: 0.9,
          regulatoryFramework: 'Computer Fraud and Abuse Act'
        });
        break;
      }
    }

    // Violence patterns
    const violencePatterns = [
      /how\s+to\s+kill/i,
      /how\s+to\s+murder/i,
      /how\s+to\s+hurt\s+someone/i,
      /ways\s+to\s+kill/i,
      /murder\s+someone/i,
    ];

    for (const pattern of violencePatterns) {
      if (pattern.test(text)) {
        violations.push({
          type: 'violence',
          description: 'Violent content detected',
          reason: 'Content contains requests for violence or harm',
          severity: 9.8,
          confidence: 0.95,
          regulatoryFramework: 'Safety Standards'
        });
        break;
      }
    }

    // Personal information request patterns
    const piiPatterns = [
      /(phone\s+number|address|email).*of.*(celebrity|taylor\s+swift|elon\s+musk)/i,
      /give\s+me.*(phone\s+number|address|email)/i,
    ];

    for (const pattern of piiPatterns) {
      if (pattern.test(text)) {
        violations.push({
          type: 'gdpr',
          description: 'Personal information request detected',
          reason: 'Content requests private personal information',
          severity: 8.5,
          confidence: 0.9,
          regulatoryFramework: 'GDPR'
        });
        break;
      }
    }

    return violations;
  }
}

export const governanceService = GovernanceService.getInstance();
