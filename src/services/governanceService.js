/**
 * JavaScript Governance Service for Node.js Backend
 * 
 * This file provides a bridge between the Node.js server (server.js) and the governance logic.
 * It's a lightweight JavaScript version that doesn't require TypeScript compilation.
 * 
 * NOTE: There is also a TypeScript version (governanceService.ts) that includes full agent
 * integration (PolicyEnforcer, Verifier with Perplexity, etc.) used by the frontend.
 * This JS version is simplified for the backend server to avoid TypeScript import issues.
 * 
 * @see governanceService.ts - Full TypeScript implementation with all agents
 * @see server.js - Uses this file for backend governance
 */
class SimpleGovernanceService {
  constructor() {
    this.useInkeepAgents = process.env.VITE_USE_INKEEP_AGENTS === 'true';
  }

  /**
   * Process an AI interaction through the governance system
   */
  async processInteraction(input, output, context = {}) {
    const interactionId = `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🛡️ Processing interaction ${interactionId} with simple governance`);

    const interaction = {
      id: interactionId,
      input,
      output,
      timestamp: new Date(),
      status: 'pending',
      severity: 'low',
      violations: [],
      agentActions: []
    };

    // Detect violations using simple pattern matching
    const violations = await this.detectViolations(input, output);
    interaction.violations = violations;

    // Determine status based on violations
    this.determineFinalStatus(interaction);

    // Log agent actions
    interaction.agentActions.push({
      agentName: 'SimpleGovernance',
      action: 'analyze',
      details: `Found ${violations.length} violations`,
      timestamp: new Date()
    });

    return interaction;
  }

  /**
   * Detect violations in the content
   */
  async detectViolations(input, output) {
    const violations = [];
    const text = `${input} ${output}`.toLowerCase();

    console.log('🔍 Analyzing text for violations...');

    // Illegal Activities / Hacking Detection
    const hackingPatterns = [
      'hack into', 'hack someone', 'break into', 'unauthorized access',
      'crack password', 'bypass security', 'exploit vulnerability',
      'ddos attack', 'sql injection', 'phishing', 'malware',
      'how to hack', 'hacking tutorial', 'illegal access',
      'steal data', 'breach security', 'network intrusion'
    ];

    // Data Theft / Confidential Information Requests
    const dataTheftPatterns = [
      'share the internal', 'internal database', 'salary database',
      'confidential data', 'proprietary information', 'company secrets',
      'employee records', 'customer database', 'financial records',
      'trade secrets', 'classified information', 'private documents',
      'leak the data', 'access internal', 'company database',
      'sensitive information', 'restricted data', 'internal files'
    ];

    const foundHackingPattern = hackingPatterns.find(pattern => text.includes(pattern));
    if (foundHackingPattern) {
      console.log('🚨 HACKING VIOLATION DETECTED:', foundHackingPattern);
      violations.push({
        type: 'illegal_activity',
        description: 'Illegal hacking or cybersecurity violation detected',
        reason: 'Content requests assistance with unauthorized access, hacking, or other illegal activities',
        severity: 9.5,
        confidence: 0.95,
        regulatoryFramework: 'Computer Fraud and Abuse Act'
      });
    }

    const foundDataTheftPattern = dataTheftPatterns.find(pattern => text.includes(pattern));
    if (foundDataTheftPattern) {
      console.log('🚨 DATA THEFT VIOLATION DETECTED:', foundDataTheftPattern);
      violations.push({
        type: 'data_theft',
        description: 'Unauthorized access to confidential information detected',
        reason: 'Content requests access to proprietary, confidential, or sensitive company data',
        severity: 9.0,
        confidence: 0.9,
        regulatoryFramework: 'Data Protection Act'
      });
    }

    // PII Detection
    if (text.match(/\b\d{3}-\d{2}-\d{4}\b/) || // SSN
        text.match(/\b\d{16}\b/) || // Credit card
        text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/)) { // Email
      violations.push({
        type: 'pii',
        description: 'Personal Identifiable Information detected',
        reason: 'Content contains sensitive personal data',
        severity: 8.5,
        confidence: 0.9,
        regulatoryFramework: 'GDPR'
      });
    }

    // Harmful/Dangerous Content Detection
    const harmfulPatterns = [
      'how to make bomb', 'create explosive', 'make poison',
      'suicide methods', 'self harm', 'hurt someone',
      'kill someone', 'murder', 'violence against',
      'how to kill', 'kill my', 'kill him', 'kill her'
    ];
    
    const foundHarmfulPattern = harmfulPatterns.find(pattern => text.includes(pattern));
    if (foundHarmfulPattern) {
      console.log('🚨 HARMFUL CONTENT VIOLATION DETECTED:', foundHarmfulPattern);
      violations.push({
        type: 'harmful_content',
        description: 'Harmful or dangerous content detected',
        reason: 'Content may promote violence, self-harm, or dangerous activities',
        severity: 9.0,
        confidence: 0.9,
        regulatoryFramework: 'Content Safety Guidelines'
      });
    }

    // Bias Detection
    if (text.includes('all women') || text.includes('all men') || 
        text.includes('people of color are') || text.includes('white people are')) {
      violations.push({
        type: 'bias',
        description: 'Potential bias detected',
        reason: 'Content may contain discriminatory language',
        severity: 6.5,
        confidence: 0.7,
        regulatoryFramework: 'IEEE Ethics'
      });
    }

    // Misinformation Detection
    if (text.includes('vaccines cause autism') || text.includes('covid is fake') ||
        text.includes('climate change is a hoax')) {
      violations.push({
        type: 'misinformation',
        description: 'Potential misinformation detected',
        reason: 'Content may spread false information',
        severity: 7.0,
        confidence: 0.8,
        regulatoryFramework: 'DSA'
      });
    }

    console.log(`📊 Total violations detected: ${violations.length}`);
    return violations;
  }

  /**
   * Determine the final status and severity based on violations
   */
  determineFinalStatus(interaction) {
    if (interaction.violations.length === 0) {
      interaction.status = 'approved';
      interaction.severity = 'low';
      return;
    }

    const maxSeverity = Math.max(...interaction.violations.map(v => v.severity));
    const criticalViolations = interaction.violations.filter(v => v.severity >= 9);
    const highViolations = interaction.violations.filter(v => v.severity >= 7);

    if (criticalViolations.length > 0) {
      interaction.status = 'blocked';
      interaction.severity = 'critical';
    } else if (highViolations.length > 0) {
      interaction.status = 'pending';
      interaction.severity = 'high';
    } else if (maxSeverity >= 5) {
      interaction.status = 'pending';
      interaction.severity = 'medium';
    } else {
      interaction.status = 'approved';
      interaction.severity = 'low';
    }
  }

  /**
   * Get current configuration status
   */
  getStatus() {
    return {
      usingInkeep: this.useInkeepAgents,
      inkeepAvailable: false,
      agentType: 'legacy'
    };
  }

  /**
   * Switch between agent types
   */
  async switchAgentType(useInkeep) {
    this.useInkeepAgents = useInkeep;
    console.log(`🔄 Switched to ${useInkeep ? 'Inkeep' : 'legacy'} agents`);
  }

  /**
   * Get governance insights
   */
  async getGovernanceInsights(timeframe = 'today') {
    return {
      totalInteractions: 0,
      blockedInteractions: 0,
      pendingInteractions: 0,
      approvedInteractions: 0,
      violationsByType: {},
      timeframe
    };
  }

  /**
   * Process feedback
   */
  async processFeedback(interactionId, feedback) {
    console.log(`📝 Feedback processed for ${interactionId}:`, feedback);
  }
}

// Export singleton instance
export const governanceService = new SimpleGovernanceService();
