// Unified governance service (JS runtime for Node server)
import { inkeepAgentsService } from './inkeepAgentsService.js';

class GovernanceService {
  static instance;
  useInkeepAgents;
  inkeepAvailable = false;

  constructor() {
    // Default to true (Inkeep Agents) unless explicitly set to false
    // Check both backend (USE_INKEEP_AGENTS) and frontend (VITE_USE_INKEEP_AGENTS) vars
    this.useInkeepAgents = process.env.USE_INKEEP_AGENTS !== 'false' && process.env.VITE_USE_INKEEP_AGENTS !== 'false';
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
    
    // Try Inkeep first, but ALWAYS fall back to legacy detection
    let inkeepSuccess = false;
    if (useInkeep) {
      try {
        console.log(`[Governance] Attempting Inkeep analysis for: ${input.substring(0, 50)}...`);
        const result = await inkeepAgentsService.processAdvancedGovernance(input, output, context);
        
        if (result && result.violations && result.violations.length > 0) {
          interaction.violations.push(...result.violations);
          interaction.agentActions.push(...(result.agentActions || []));
          inkeepSuccess = true;
          console.log(`[Governance] Inkeep found ${result.violations.length} violations`);
        } else {
          console.log('[Governance] Inkeep returned no violations, using legacy fallback');
        }
      } catch (e) {
        console.log(`[Governance] Inkeep error: ${e.message}, falling back to legacy`);
        interaction.agentActions.push({ 
          agentName: 'InkeepGovernance', 
          action: 'error', 
          details: `Inkeep error: ${e.message}`, 
          timestamp: new Date() 
        });
      }
    }
    
    // ALWAYS run legacy detection as well to ensure safety
    const violations = this.#detectViolations(input, output);
    
    if (violations.length > 0) {
      // Add legacy violations if not already detected by Inkeep
      const existingTypes = new Set(interaction.violations.map(v => v.type));
      for (const v of violations) {
        if (!existingTypes.has(v.type)) {
          interaction.violations.push(v);
        }
      }
      
      interaction.agentActions.push({ 
        agentName: inkeepSuccess ? 'LegacyPolicyEnforcer (Verification)' : 'LegacyPolicyEnforcer', 
        action: violations.length > 0 ? 'block' : 'approve',
        details: `Detected ${violations.length} violation(s)`, 
        timestamp: new Date() 
      });
      
      console.log(`[Governance] Legacy detection found ${violations.length} violations`);
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

  async getStatus() {
    // Re-check availability to ensure it's up to date
    if (this.useInkeepAgents) {
      this.inkeepAvailable = await inkeepAgentsService.isAvailable();
    }
    
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
