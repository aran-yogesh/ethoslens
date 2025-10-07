import { LLMInteraction } from '../types';
import { agents } from '../agents';

/**
 * Governance service for processing AI interactions
 * Uses a multi-agent system for comprehensive governance
 */
export class GovernanceService {
  private static instance: GovernanceService;

  constructor() {
    console.log('🛡️ Governance service initialized');
  }

  static getInstance(): GovernanceService {
    if (!GovernanceService.instance) {
      GovernanceService.instance = new GovernanceService();
    }
    return GovernanceService.instance;
  }

  /**
   * Process an AI interaction through the governance system
   */
  async processInteraction(input: string, output: string): Promise<LLMInteraction> {
    const interactionId = `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🛡️ Processing interaction ${interactionId}`);

    const interaction: LLMInteraction = {
      id: interactionId,
      input,
      output,
      timestamp: new Date(),
      status: 'pending',
      severity: 'low',
      violations: [],
      agentActions: []
    };

    try {
      await this.processWithAgents(interaction);
    } catch (error) {
      console.error('Error in governance processing:', error);
      throw error;
    }

    // Determine final status and severity
    this.determineFinalStatus(interaction);

    return interaction;
  }

  /**
   * Process user feedback on governance decisions
   */
  async processFeedback(interactionId: string, feedback: {
    rating: 'positive' | 'negative' | 'report';
    comment?: string;
  }): Promise<void> {
    try {
      console.log(`📝 Feedback processed for ${interactionId}:`, feedback);
    } catch (error) {
      console.error('Error processing feedback:', error);
    }
  }

  /**
   * Get governance insights and analytics
   */
  async getGovernanceInsights(timeframe: string = 'today'): Promise<any> {
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
   * Process interaction using agents
   */
  private async processWithAgents(interaction: LLMInteraction): Promise<void> {
    try {
      // Process with each legacy agent
      const policyActions = await agents.policyEnforcer.process(interaction);
      interaction.agentActions.push(...policyActions);

      const verifierActions = await agents.verifier.process(interaction);
      interaction.agentActions.push(...verifierActions);

      const responseActions = await agents.responseAgent.process(interaction);
      interaction.agentActions.push(...responseActions);

      const auditActions = await agents.auditLogger.process(interaction);
      interaction.agentActions.push(...auditActions);

      const feedbackActions = await agents.feedbackAgent.process(interaction);
      interaction.agentActions.push(...feedbackActions);

      console.log(`✅ Processing complete: ${interaction.violations.length} violations detected`);
    } catch (error) {
      console.error('Error processing with agents:', error);
      throw error;
    }
  }

  /**
   * Determine the final status and severity based on violations
   */
  private determineFinalStatus(interaction: LLMInteraction): void {
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

}

export const governanceService = GovernanceService.getInstance();
