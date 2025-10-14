import { LLMInteraction, AgentAction, Violation } from '../types';

export class PolicyEnforcerAgent {
  name = 'PolicyEnforcerAgent';
  type = 'policy' as const;
  enabled = true;

  async process(interaction: LLMInteraction): Promise<AgentAction[]> {
    const violations = await this.detectViolations(interaction);
    const actions: AgentAction[] = [];

    if (violations.length > 0) {
      // Update the interaction's violations array
      interaction.violations.push(...violations);
      
      const frameworks = [...new Set(violations.map(v => v.regulatoryFramework).filter(Boolean))];
      
      actions.push({
        agentName: this.name,
        action: 'block',
        description: `Policy violations detected: ${violations.length} violation(s) across ${frameworks.length} regulatory framework(s): ${frameworks.join(', ')}`,
        severity: Math.max(...violations.map(v => v.severity)),
        confidence: violations.reduce((sum, v) => sum + v.confidence, 0) / violations.length,
        details: `Detected ${violations.length} violation(s) across ${frameworks.length} regulatory framework(s): ${frameworks.join(', ')}`,
        timestamp: new Date(),
        complianceLevel: violations.some(v => v.complianceLevel === 'critical') ? 'critical' : 'high',
        remediationSteps: [
          'Review content for policy compliance',
          'Implement additional safeguards',
          'Document processing activities',
          ...violations.flatMap(v => v.remediationSteps || [])
        ]
      });
    } else {
      actions.push({
        agentName: this.name,
        action: 'approve',
        description: 'No policy violations detected',
        severity: 0,
        confidence: 0.95,
        details: 'Content passed all policy checks',
        timestamp: new Date(),
        complianceLevel: 'low',
        remediationSteps: [
          'Continue monitoring for policy compliance',
          'Document processing activities'
        ]
      });
    }

    return actions;
  }

  private async detectViolations(interaction: LLMInteraction): Promise<Violation[]> {
    const violations: Violation[] = [];
    const inputText = interaction.input.toLowerCase();
    const outputText = interaction.output.toLowerCase();
    const combinedText = `${inputText} ${outputText}`;

    // Regulatory Framework Compliance Checks
    violations.push(...this.checkGDPRCompliance(combinedText));
    violations.push(...this.checkFISMACompliance(combinedText));
    violations.push(...this.checkEUAIActCompliance(inputText, outputText));
    violations.push(...this.checkDSACompliance(combinedText));
    violations.push(...this.checkNIS2Compliance(combinedText));
    violations.push(...this.checkISO42001Compliance(combinedText));
    violations.push(...this.checkIEEEEthicsCompliance(combinedText));

    // Legacy violation checks (enhanced)
    const illegalViolation = this.detectIllegalActivities(inputText, outputText);
    if (illegalViolation) violations.push(illegalViolation);

    const misinformationViolation = this.detectMisinformation(inputText, outputText);
    if (misinformationViolation) violations.push(misinformationViolation);

    const hallucinationViolation = this.detectHallucination(outputText);
    if (hallucinationViolation) violations.push(hallucinationViolation);

    const biasViolation = this.detectBias(combinedText);
    if (biasViolation) violations.push(biasViolation);

    const hateSpeechViolation = this.detectHateSpeech(combinedText);
    if (hateSpeechViolation) violations.push(hateSpeechViolation);

    const selfHarmViolation = this.detectSelfHarm(combinedText);
    if (selfHarmViolation) violations.push(selfHarmViolation);

    const violenceViolation = this.detectViolence(combinedText);
    if (violenceViolation) violations.push(violenceViolation);

    return violations.filter(v => v !== null);
  }

  // GDPR Data Sensitivity Levels Compliance
  private checkGDPRCompliance(text: string): Violation[] {
    const violations: Violation[] = [];

    // Enhanced personal information request patterns
    const personalInfoRequestPatterns = [
      { 
        pattern: /(give\s+me|tell\s+me|what\s+is|find|get|provide).*?(phone\s+number|telephone\s+number|mobile\s+number|cell\s+phone)/i, 
        type: 'phone number request',
        severity: 8.5
      },
      { 
        pattern: /(give\s+me|tell\s+me|what\s+is|find|get|provide).*?(address|home\s+address|residential\s+address|street\s+address|mailing\s+address)/i, 
        type: 'address request',
        severity: 8.5
      },
      { 
        pattern: /(give\s+me|tell\s+me|what\s+is|find|get|provide).*?(email\s+address|email|e-mail)/i, 
        type: 'email address request',
        severity: 8.0
      },
      { 
        pattern: /(give\s+me|tell\s+me|what\s+is|find|get|provide).*?(social\s+security\s+number|ssn|social\s+security)/i, 
        type: 'SSN request',
        severity: 9.5
      },
      { 
        pattern: /(give\s+me|tell\s+me|what\s+is|find|get|provide).*?(credit\s+card|bank\s+account|financial\s+information)/i, 
        type: 'financial information request',
        severity: 9.0
      },
      { 
        pattern: /(give\s+me|tell\s+me|what\s+is|find|get|provide).*?(personal\s+information|private\s+information|contact\s+information)/i, 
        type: 'personal information request',
        severity: 8.0
      },
      // Celebrity/public figure specific patterns
      { 
        pattern: /(taylor\s+swift|elon\s+musk|jeff\s+bezos|mark\s+zuckerberg|bill\s+gates).*(phone\s+number|address|home\s+address|personal\s+contact)/i, 
        type: 'celebrity personal information request',
        severity: 9.0
      },
      // Location tracking patterns
      { 
        pattern: /(where\s+does|where\s+is|location\s+of).*(live|lives|residing|home|house)/i, 
        type: 'location request',
        severity: 8.5
      }
    ];

    personalInfoRequestPatterns.forEach(({ pattern, type, severity }) => {
      if (pattern.test(text)) {
        violations.push({
          type: 'gdpr',
          description: `GDPR violation: Request for ${type}`,
          severity,
          confidence: 0.9,
          reason: `Request for personal information violates GDPR data protection principles and privacy rights`,
          regulatoryFramework: 'GDPR Article 6 & 7',
          complianceLevel: severity >= 9.0 ? 'critical' : 'high',
          remediationSteps: [
            'Block request for personal information',
            'Educate on privacy rights and data protection',
            'Implement stronger content filtering',
            'Report potential privacy violations',
            'Provide information on proper data request procedures'
          ]
        });
      }
    });

    // Article 9 - Special Categories of Personal Data
    const specialCategoryPatterns = [
      { pattern: /racial.*origin|ethnic.*origin/i, category: 'racial/ethnic origin' },
      { pattern: /political.*opinion|political.*view/i, category: 'political opinions' },
      { pattern: /religious.*belief|philosophical.*belief/i, category: 'religious/philosophical beliefs' },
      { pattern: /trade.*union.*membership/i, category: 'trade union membership' },
      { pattern: /genetic.*data|dna.*profile/i, category: 'genetic data' },
      { pattern: /biometric.*data.*identification/i, category: 'biometric data' },
      { pattern: /health.*data|medical.*record|patient.*data/i, category: 'health data' },
      { pattern: /sex.*life|sexual.*orientation/i, category: 'sex life/sexual orientation' }
    ];

    specialCategoryPatterns.forEach(({ pattern, category }) => {
      if (pattern.test(text)) {
        violations.push({
          type: 'gdpr',
          description: `GDPR Article 9 violation: Special category data (${category})`,
          severity: 9.0,
          confidence: 0.9,
          reason: `Processing of special category personal data requires explicit consent and additional safeguards`,
          regulatoryFramework: 'GDPR Article 9',
          complianceLevel: 'critical',
          remediationSteps: [
            'Obtain explicit consent for processing',
            'Implement additional technical safeguards',
            'Conduct Data Protection Impact Assessment (DPIA)',
            'Ensure lawful basis for processing'
          ]
        });
      }
    });

    // Standard PII under GDPR
    const piiPatterns = [
      { pattern: /\b[\w\.-]+@[\w\.-]+\.\w+\b/, type: 'email address' },
      { pattern: /\b\d{3}-\d{2}-\d{4}\b/, type: 'social security number' },
      { pattern: /\b\d{3}-\d{3}-\d{4}\b/, type: 'phone number' },
      { pattern: /\b\d{16}\b/, type: 'credit card number' },
      { pattern: /ip\s+address.*\d+\.\d+\.\d+\.\d+/i, type: 'IP address' }
    ];

    piiPatterns.forEach(({ pattern, type }) => {
      if (pattern.test(text)) {
        violations.push({
          type: 'gdpr',
          description: `GDPR personal data detected: ${type}`,
          severity: 7.5,
          confidence: 0.85,
          reason: `Personal data processing must comply with GDPR principles`,
          regulatoryFramework: 'GDPR Article 6',
          complianceLevel: 'high',
          remediationSteps: [
            'Verify lawful basis for processing',
            'Implement data minimization',
            'Ensure data subject rights are respected',
            'Document processing activities'
          ]
        });
      }
    });

    return violations;
  }

  // FISMA Security Controls Compliance
  private checkFISMACompliance(text: string): Violation[] {
    const violations: Violation[] = [];

    const fismaPatterns = [
      { 
        pattern: /classified.*information|top.*secret|confidential.*data/i, 
        control: 'AC-2 (Account Management)',
        severity: 9.5
      },
      { 
        pattern: /system.*administrator.*password|root.*access|privileged.*account/i, 
        control: 'AC-6 (Least Privilege)',
        severity: 8.5
      },
      { 
        pattern: /security.*incident|data.*breach|unauthorized.*access/i, 
        control: 'IR-4 (Incident Handling)',
        severity: 8.0
      },
      { 
        pattern: /backup.*system|disaster.*recovery|business.*continuity/i, 
        control: 'CP-2 (Contingency Plan)',
        severity: 7.0
      },
      { 
        pattern: /audit.*log|system.*monitoring|security.*event/i, 
        control: 'AU-2 (Audit Events)',
        severity: 6.5
      }
    ];

    fismaPatterns.forEach(({ pattern, control, severity }) => {
      if (pattern.test(text)) {
        violations.push({
          type: 'fisma',
          description: `FISMA security control concern: ${control}`,
          severity,
          confidence: 0.8,
          reason: `Content may involve federal information systems requiring FISMA compliance`,
          regulatoryFramework: `FISMA ${control}`,
          complianceLevel: severity >= 8.5 ? 'critical' : severity >= 7.5 ? 'high' : 'medium',
          remediationSteps: [
            'Review FISMA security controls',
            'Implement appropriate safeguards',
            'Conduct security assessment',
            'Document compliance measures'
          ]
        });
      }
    });

    return violations;
  }

  // EU AI Act Risk Categories Compliance
  private checkEUAIActCompliance(input: string, output: string): Violation[] {
    const violations: Violation[] = [];

    // Prohibited AI Practices (Article 5)
    const prohibitedPatterns = [
      { 
        pattern: /subliminal.*technique|manipulate.*behavior.*unconscious/i, 
        risk: 'Subliminal techniques',
        article: 'Article 5(1)(a)'
      },
      { 
        pattern: /exploit.*vulnerability.*age.*disability/i, 
        risk: 'Exploitation of vulnerabilities',
        article: 'Article 5(1)(b)'
      },
      { 
        pattern: /social.*scoring.*government|citizen.*scoring.*system/i, 
        risk: 'Social scoring by public authorities',
        article: 'Article 5(1)(c)'
      },
      { 
        pattern: /real.*time.*identification.*biometric|facial.*recognition.*public/i, 
        risk: 'Real-time biometric identification',
        article: 'Article 5(1)(d)'
      }
    ];

    prohibitedPatterns.forEach(({ pattern, risk, article }) => {
      if (pattern.test(input) || pattern.test(output)) {
        violations.push({
          type: 'eu_ai_act',
          description: `EU AI Act prohibited practice: ${risk}`,
          severity: 10.0,
          confidence: 0.9,
          reason: `AI system involves prohibited practices under EU AI Act`,
          regulatoryFramework: `EU AI Act ${article}`,
          complianceLevel: 'critical',
          remediationSteps: [
            'Immediately cease prohibited AI practice',
            'Redesign AI system to comply',
            'Conduct conformity assessment',
            'Implement risk management system'
          ]
        });
      }
    });

    // High-Risk AI Systems (Annex III)
    const highRiskPatterns = [
      { pattern: /recruitment.*ai|hiring.*algorithm|cv.*screening/i, domain: 'Employment' },
      { pattern: /credit.*scoring|loan.*approval|financial.*assessment/i, domain: 'Credit scoring' },
      { pattern: /medical.*diagnosis|healthcare.*ai|patient.*treatment/i, domain: 'Healthcare' },
      { pattern: /educational.*assessment|student.*evaluation/i, domain: 'Education' },
      { pattern: /law.*enforcement.*ai|predictive.*policing/i, domain: 'Law enforcement' }
    ];

    highRiskPatterns.forEach(({ pattern, domain }) => {
      if (pattern.test(input) || pattern.test(output)) {
        violations.push({
          type: 'eu_ai_act',
          description: `EU AI Act high-risk system: ${domain}`,
          severity: 8.5,
          confidence: 0.85,
          reason: `AI system classified as high-risk requires strict compliance measures`,
          regulatoryFramework: 'EU AI Act Annex III',
          complianceLevel: 'high',
          remediationSteps: [
            'Implement risk management system',
            'Ensure data governance and quality',
            'Maintain detailed documentation',
            'Enable human oversight',
            'Ensure accuracy and robustness'
          ]
        });
      }
    });

    return violations;
  }

  // Digital Services Act Compliance
  private checkDSACompliance(text: string): Violation[] {
    const violations: Violation[] = [];

    const dsaPatterns = [
      { 
        pattern: /illegal.*content|terrorist.*content|hate.*speech/i, 
        category: 'Illegal content',
        severity: 9.0
      },
      { 
        pattern: /child.*abuse|child.*exploitation|csam/i, 
        category: 'Child sexual abuse material',
        severity: 10.0
      },
      { 
        pattern: /disinformation|fake.*news|manipulated.*media/i, 
        category: 'Disinformation',
        severity: 7.5
      },
      { 
        pattern: /dark.*pattern|deceptive.*design|manipulative.*interface/i, 
        category: 'Dark patterns',
        severity: 8.0
      }
    ];

    dsaPatterns.forEach(({ pattern, category, severity }) => {
      if (pattern.test(text)) {
        violations.push({
          type: 'dsa',
          description: `DSA violation: ${category}`,
          severity,
          confidence: 0.8,
          reason: `Content may violate Digital Services Act requirements`,
          regulatoryFramework: 'Digital Services Act',
          complianceLevel: severity >= 9.0 ? 'critical' : 'high',
          remediationSteps: [
            'Implement content moderation',
            'Establish notice and action mechanisms',
            'Provide transparency reporting',
            'Enable user appeals process'
          ]
        });
      }
    });

    return violations;
  }

  // NIS2 Directive Compliance
  private checkNIS2Compliance(text: string): Violation[] {
    const violations: Violation[] = [];

    const nis2Patterns = [
      { 
        pattern: /cyber.*attack|security.*incident|ransomware/i, 
        category: 'Cybersecurity incident',
        severity: 8.5
      },
      { 
        pattern: /critical.*infrastructure|essential.*service/i, 
        category: 'Critical infrastructure',
        severity: 9.0
      },
      { 
        pattern: /supply.*chain.*security|third.*party.*risk/i, 
        category: 'Supply chain security',
        severity: 7.5
      }
    ];

    nis2Patterns.forEach(({ pattern, category, severity }) => {
      if (pattern.test(text)) {
        violations.push({
          type: 'nis2',
          description: `NIS2 Directive concern: ${category}`,
          severity,
          confidence: 0.75,
          reason: `Content involves cybersecurity aspects covered by NIS2 Directive`,
          regulatoryFramework: 'NIS2 Directive',
          complianceLevel: severity >= 8.5 ? 'high' : 'medium',
          remediationSteps: [
            'Implement cybersecurity measures',
            'Establish incident reporting',
            'Conduct risk assessments',
            'Ensure supply chain security'
          ]
        });
      }
    });

    return violations;
  }

  // ISO/IEC 42001 AI Management System Compliance
  private checkISO42001Compliance(text: string): Violation[] {
    const violations: Violation[] = [];

    const iso42001Patterns = [
      { 
        pattern: /ai.*governance|ai.*management.*system/i, 
        category: 'AI governance',
        severity: 6.0
      },
      { 
        pattern: /ai.*risk.*management|algorithmic.*risk/i, 
        category: 'AI risk management',
        severity: 7.0
      },
      { 
        pattern: /ai.*lifecycle|model.*development.*process/i, 
        category: 'AI lifecycle management',
        severity: 6.5
      },
      { 
        pattern: /ai.*performance.*monitoring|model.*drift/i, 
        category: 'AI performance monitoring',
        severity: 7.5
      }
    ];

    iso42001Patterns.forEach(({ pattern, category, severity }) => {
      if (pattern.test(text)) {
        violations.push({
          type: 'iso_42001',
          description: `ISO/IEC 42001 consideration: ${category}`,
          severity,
          confidence: 0.7,
          reason: `Content involves AI management aspects covered by ISO/IEC 42001`,
          regulatoryFramework: 'ISO/IEC 42001',
          complianceLevel: 'medium',
          remediationSteps: [
            'Establish AI management system',
            'Implement AI governance framework',
            'Conduct regular AI risk assessments',
            'Monitor AI system performance'
          ]
        });
      }
    });

    return violations;
  }

  // IEEE Ethics Guidelines Compliance
  private checkIEEEEthicsCompliance(text: string): Violation[] {
    const violations: Violation[] = [];

    const ieeeEthicsPatterns = [
      { 
        pattern: /algorithmic.*bias|unfair.*algorithm|discriminatory.*ai/i, 
        principle: 'Fairness and non-discrimination',
        severity: 8.0
      },
      { 
        pattern: /ai.*transparency|explainable.*ai|black.*box/i, 
        principle: 'Transparency and explainability',
        severity: 7.0
      },
      { 
        pattern: /human.*autonomy|human.*agency|ai.*decision.*making/i, 
        principle: 'Human autonomy',
        severity: 7.5
      },
      { 
        pattern: /ai.*accountability|responsible.*ai|ethical.*ai/i, 
        principle: 'Accountability',
        severity: 6.5
      },
      { 
        pattern: /privacy.*preserving.*ai|data.*protection.*ai/i, 
        principle: 'Privacy and data protection',
        severity: 8.5
      }
    ];

    ieeeEthicsPatterns.forEach(({ pattern, principle, severity }) => {
      if (pattern.test(text)) {
        violations.push({
          type: 'ieee_ethics',
          description: `IEEE Ethics consideration: ${principle}`,
          severity,
          confidence: 0.7,
          reason: `Content involves ethical AI aspects covered by IEEE guidelines`,
          regulatoryFramework: 'IEEE Ethically Aligned Design',
          complianceLevel: severity >= 8.0 ? 'high' : 'medium',
          remediationSteps: [
            'Implement ethical AI principles',
            'Conduct ethical impact assessment',
            'Ensure human-centered design',
            'Establish ethical review processes'
          ]
        });
      }
    });

    return violations;
  }

  // Enhanced legacy detection methods
  private detectIllegalActivities(input: string, output: string): Violation | null {
    const illegalPatterns = [
      // WiFi hacking patterns (MUST BE FIRST for priority matching)
      { pattern: /hack\s+into\s+someone.*wi[-\s]?fi|hack\s+into.*wi[-\s]?fi/i, type: 'wifi_hacking' },
      { pattern: /break\s+into.*wi[-\s]?fi.*without.*knowing/i, type: 'wifi_hacking' },
      { pattern: /crack.*wi[-\s]?fi.*password|bypass.*wi[-\s]?fi.*security/i, type: 'wifi_hacking' },
      { pattern: /steal.*wi[-\s]?fi.*password|unauthorized.*wi[-\s]?fi.*access/i, type: 'wifi_hacking' },
      { pattern: /how\s+(do|can|to)\s+i.*hack.*wi[-\s]?fi/i, type: 'wifi_hacking' },
      // General hacking patterns
      { pattern: /hack\s+into|hacking\s+into|break\s+into|crack.*password|bypass.*security/i, type: 'cybercrime' },
      { pattern: /ddos|denial\s+of\s+service|botnet|malware|ransomware/i, type: 'cybercrime' },
      { pattern: /how\s+to\s+make.*drugs|synthesize.*cocaine|manufacture.*methamphetamine/i, type: 'drug_manufacturing' },
      { pattern: /credit\s+card\s+fraud|identity\s+theft|money\s+laundering/i, type: 'financial_crime' },
      { pattern: /make.*bomb|build.*explosive|create.*weapon/i, type: 'weapons' },
      { pattern: /human\s+trafficking|sex\s+trafficking|forced\s+labor/i, type: 'trafficking' },
      // Social media and privacy violations
      { pattern: /hack.*social\s+media|break\s+into.*facebook|instagram.*hack/i, type: 'social_media_hacking' },
      { pattern: /stalk|stalking|follow\s+someone\s+secretly|track\s+someone.*location/i, type: 'stalking' },
      { pattern: /spy\s+on|surveillance.*without.*consent|monitor.*secretly/i, type: 'unauthorized_surveillance' }
    ];

    for (const { pattern, type } of illegalPatterns) {
      if (pattern.test(input) || pattern.test(output)) {
        return {
          type: 'compliance',
          description: `Illegal activity detected: ${type}`,
          severity: type === 'wifi_hacking' || type === 'stalking' ? 9.0 : 9.5,
          confidence: 0.9,
          reason: `Content involves potentially illegal activities related to ${type}`,
          regulatoryFramework: 'Legal Compliance',
          complianceLevel: 'critical',
          remediationSteps: [
            'Block content immediately',
            'Report to appropriate authorities if required',
            'Review content moderation policies',
            'Implement additional safeguards',
            ...(type.includes('hacking') ? ['Educate on cybersecurity laws', 'Promote ethical technology use'] : []),
            ...(type === 'stalking' ? ['Provide resources for reporting harassment', 'Emphasize consent and privacy rights'] : [])
          ]
        };
      }
    }
    return null;
  }

  private detectMisinformation(input: string, output: string): Violation | null {
    const misinformationPatterns = [
      { pattern: /elon\s+musk.*nobel\s+peace\s+prize/i, fact: 'Elon Musk has never won a Nobel Peace Prize' },
      { pattern: /taylor\s+swift.*nobel\s+peace\s+prize/i, fact: 'Taylor Swift has never won a Nobel Peace Prize' },
      { pattern: /jeff\s+bezos.*nobel\s+peace\s+prize/i, fact: 'Jeff Bezos has never won a Nobel Peace Prize' },
      { pattern: /mark\s+zuckerberg.*nobel\s+peace\s+prize/i, fact: 'Mark Zuckerberg has never won a Nobel Peace Prize' },
      { pattern: /vaccines.*cause.*autism/i, fact: 'Vaccines do not cause autism - this has been thoroughly debunked' },
      { pattern: /covid.*5g|5g.*causes.*covid/i, fact: '5G does not cause COVID-19' },
      { pattern: /earth.*flat|flat.*earth/i, fact: 'The Earth is not flat - it is an oblate spheroid' },
      { pattern: /climate\s+change.*hoax|global\s+warming.*fake/i, fact: 'Climate change is scientifically established' },
      // Historical misinformation
      { pattern: /moon\s+landing.*fake|moon\s+landing.*hoax/i, fact: 'The moon landing was real and well-documented' },
      { pattern: /holocaust.*didn.*happen|holocaust.*hoax/i, fact: 'The Holocaust is a well-documented historical fact' },
      // Health misinformation
      { pattern: /drinking\s+bleach.*cure|bleach.*covid.*cure/i, fact: 'Drinking bleach is extremely dangerous and not a cure for anything' }
    ];

    for (const { pattern, fact } of misinformationPatterns) {
      if (pattern.test(input) || pattern.test(output)) {
        return {
          type: 'misinformation',
          description: 'Potential misinformation detected',
          severity: pattern.source.includes('holocaust') || pattern.source.includes('bleach') ? 9.5 : 8.0,
          confidence: 0.85,
          reason: `Content may contain false information. Fact: ${fact}`,
          regulatoryFramework: 'Content Accuracy Standards',
          complianceLevel: pattern.source.includes('holocaust') || pattern.source.includes('bleach') ? 'critical' : 'high',
          remediationSteps: [
            'Fact-check content against reliable sources',
            'Add disclaimer or correction',
            'Implement verification processes',
            'Train on accurate information',
            ...(pattern.source.includes('holocaust') ? ['Provide educational resources on historical facts'] : []),
            ...(pattern.source.includes('bleach') ? ['Include health safety warnings', 'Direct to medical professionals'] : [])
          ]
        };
      }
    }
    return null;
  }

  private detectHallucination(text: string): Violation | null {
    const hallucinationIndicators = [
      'according to my knowledge', 'i believe', 'it seems like', 'probably',
      'based on what i know', 'i think', 'as far as i know', 'i recall'
    ];

    const foundIndicators = hallucinationIndicators.filter(indicator => text.includes(indicator));

    if (foundIndicators.length > 0) {
      return {
        type: 'hallucination',
        description: 'Potential hallucination detected',
        severity: 6.5,
        confidence: 0.72,
        reason: `Response contains uncertain language patterns: ${foundIndicators.join(', ')}`,
        regulatoryFramework: 'AI Accuracy Standards',
        complianceLevel: 'medium'
      };
    }
    return null;
  }

  private detectBias(text: string): Violation | null {
    const biasPatterns = [
      { pattern: /obviously/i, type: 'assumption' },
      { pattern: /everyone knows/i, type: 'assumption' },
      { pattern: /all\s+(women|men|people)\s+are/i, type: 'generalization' },
      { pattern: /(women|men)\s+are\s+better\s+at/i, type: 'gender_bias' }
    ];

    for (const { pattern, type } of biasPatterns) {
      if (pattern.test(text)) {
        return {
          type: 'bias',
          description: `Biased language detected: ${type}`,
          severity: 5.8,
          confidence: 0.75,
          reason: `Response contains language that may reflect unfair bias (${type})`,
          regulatoryFramework: 'AI Fairness Standards',
          complianceLevel: 'medium'
        };
      }
    }
    return null;
  }

  private detectHateSpeech(text: string): Violation | null {
    const hateSpeechPatterns = [
      { pattern: /\b(stupid|idiot|moron)\b/i, severity: 4.0 },
      { pattern: /\b(inferior|superior)\s+(race|gender|group)/i, severity: 8.5 },
      { pattern: /(kill|murder|eliminate)\s+all\s+\w+/i, severity: 9.5 }
    ];

    for (const { pattern, severity } of hateSpeechPatterns) {
      if (pattern.test(text)) {
        return {
          type: 'hate_speech',
          description: 'Potentially harmful language detected',
          severity,
          confidence: 0.85,
          reason: 'Response contains language that could be considered offensive or discriminatory',
          regulatoryFramework: 'Content Moderation Standards',
          complianceLevel: severity >= 8.5 ? 'critical' : 'high'
        };
      }
    }
    return null;
  }

  private detectSelfHarm(text: string): Violation | null {
    const selfHarmPatterns = [
      /how\s+to\s+(kill|hurt)\s+myself/i,
      /suicide\s+methods/i,
      /ways\s+to\s+end\s+my\s+life/i
    ];

    for (const pattern of selfHarmPatterns) {
      if (pattern.test(text)) {
        return {
          type: 'compliance',
          description: 'Self-harm content detected',
          severity: 9.0,
          confidence: 0.9,
          reason: 'Content involves self-harm which requires immediate attention',
          regulatoryFramework: 'Safety Standards',
          complianceLevel: 'critical'
        };
      }
    }
    return null;
  }

  private detectViolence(text: string): Violation | null {
    const violencePatterns = [
      // Original patterns
      { pattern: /how\s+to\s+hurt\s+someone/i, severity: 8.5, type: 'harm_instructions' },
      { pattern: /torture\s+methods/i, severity: 9.0, type: 'torture_methods' },
      { pattern: /violent\s+revenge/i, severity: 8.0, type: 'revenge_violence' },
      
      // Enhanced violence patterns - CRITICAL
      { pattern: /how\s+to\s+kill\s+(my|someone|a|the)\s+(father|mother|parent|family|person)/i, severity: 9.8, type: 'murder_instructions' },
      { pattern: /step\s*-?\s*by\s*-?\s*step\s+(tutorial|guide|instructions).*kill/i, severity: 9.9, type: 'detailed_murder_guide' },
      { pattern: /how\s+to\s+(murder|assassinate|eliminate)\s+(someone|a\s+person)/i, severity: 9.7, type: 'murder_instructions' },
      { pattern: /ways\s+to\s+kill\s+(someone|a\s+person|people)/i, severity: 9.6, type: 'killing_methods' },
      
      // Weapon-related violence
      { pattern: /how\s+to\s+make\s+(poison|deadly\s+weapon|lethal)/i, severity: 9.5, type: 'weapon_creation' },
      { pattern: /best\s+way\s+to\s+(stab|shoot|strangle)/i, severity: 9.4, type: 'attack_methods' },
      { pattern: /how\s+to\s+use\s+(knife|gun|weapon)\s+to\s+kill/i, severity: 9.3, type: 'weapon_usage' },
      
      // Domestic violence
      { pattern: /how\s+to\s+(beat|abuse|harm)\s+(wife|husband|spouse|partner)/i, severity: 9.2, type: 'domestic_violence' },
      { pattern: /ways\s+to\s+hurt\s+(family|relatives|loved\s+ones)/i, severity: 9.1, type: 'family_violence' },
      
      // Mass violence
      { pattern: /how\s+to\s+(massacre|mass\s+shooting|terrorist\s+attack)/i, severity: 10.0, type: 'mass_violence' },
      { pattern: /plan\s+(school\s+shooting|workplace\s+violence)/i, severity: 10.0, type: 'planned_mass_violence' },
      
      // General violence patterns
      { pattern: /how\s+to\s+(attack|assault|beat\s+up)\s+someone/i, severity: 8.7, type: 'assault_instructions' },
      { pattern: /violent\s+(methods|techniques|ways)\s+to/i, severity: 8.3, type: 'violence_methods' },
      { pattern: /cause\s+(physical\s+harm|bodily\s+injury|pain)\s+to/i, severity: 8.1, type: 'harm_causing' }
    ];

    for (const { pattern, severity, type } of violencePatterns) {
      if (pattern.test(text)) {
        return {
          type: 'violence',
          description: `Violent content detected: ${type}`,
          severity,
          confidence: 0.95,
          reason: `Content contains explicit instructions or requests for violence (${type})`,
          regulatoryFramework: 'Safety Standards, Criminal Law',
          complianceLevel: severity >= 9.5 ? 'critical' : 'high',
          remediationSteps: [
            'Block content immediately',
            'Log security incident',
            'Consider law enforcement notification',
            'Provide mental health resources',
            'Implement additional content filtering',
            'Review and strengthen safety policies'
          ]
        };
      }
    }
    return null;
  }
}
