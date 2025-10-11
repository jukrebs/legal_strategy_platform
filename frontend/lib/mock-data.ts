
import { CaseIntake, SimilarCase, Strategy, JudgeProfile, OpposingCounselProfile, SimulationRound } from './types';

export const demoCase: CaseIntake = {
  jurisdiction: 'EDNY/SDNY',
  judge: 'Hon. Sarah Mitchell',
  caseType: 'Consumer false advertising (NY GBL §349/§350)',
  posture: 'Motion to Dismiss (MTD)',
  opposingCounsel: 'Miller & Associates LLP',
  facts: ``,
  preferences: {
    riskTolerance: 'moderate',
    briefStyle: 'detailed',
    settlementPosture: 'trial-ready'
  }
};

export const mockSimilarCases: SimilarCase[] = [
  {
    id: '1',
    name: 'Mantikas v. Kellogg Co.',
    court: 'SDNY',
    outcome: 'Granted',
    issues: ['Front-label misleading', 'Reasonable consumer standard', 'Context cures'],
    keyQuote: 'A reasonable consumer would not be misled when the back panel clearly discloses the true nature of the ingredients.',
    whySimilar: 'Same front-label vs. back-panel disclosure issue with food labeling under NY GBL',
    confidenceScore: 95,
    strategyTags: ['Context Cures', 'Reasonable Consumer', 'Disclosure Defense'],
    citation: '832 F. Supp. 2d 304 (S.D.N.Y. 2011)',
    year: 2011,
    fullOpinionUrl: '/cases/mantikas-v-kellogg',
    matchedFacts: ['Front-label claim', 'Back-panel clarification', 'NY GBL §349']
  },
  {
    id: '2',
    name: 'Fink v. Time Warner Cable',
    court: 'SDNY',
    outcome: 'Mixed',
    issues: ['Causation deficiency', 'Price premium theory', 'Economic injury'],
    keyQuote: 'Plaintiff must show they paid a premium due to the alleged misrepresentation.',
    whySimilar: 'Addresses causation and economic injury requirements under NY GBL',
    confidenceScore: 88,
    strategyTags: ['Causation', 'Price Premium', 'Economic Injury'],
    citation: '714 F.3d 738 (2d Cir. 2013)',
    year: 2013,
    fullOpinionUrl: '/cases/fink-v-time-warner',
    matchedFacts: ['Economic injury claim', 'Causation deficiency', 'NY GBL']
  },
  {
    id: '3',
    name: 'Orlander v. Staples Inc.',
    court: 'EDNY',
    outcome: 'Dismissed',
    issues: ['Preemption defense', 'Federal labeling standards', 'Primary jurisdiction'],
    keyQuote: 'State law claims are preempted where federal agencies have comprehensive regulatory schemes.',
    whySimilar: 'Product labeling with potential federal preemption issues',
    confidenceScore: 82,
    strategyTags: ['Preemption', 'Federal Standards', 'Primary Jurisdiction'],
    citation: '18 F. Supp. 3d 253 (E.D.N.Y. 2014)',
    year: 2014,
    fullOpinionUrl: '/cases/orlander-v-staples',
    matchedFacts: ['Federal labeling standards', 'Preemption defense']
  },
  {
    id: '4',
    name: 'Jessani v. Monini North America',
    court: 'SDNY',
    outcome: 'Granted',
    issues: ['Truffle oil labeling', 'Natural vs artificial', 'Consumer expectations'],
    keyQuote: 'The reasonable consumer standard requires consideration of the full context of the product labeling.',
    whySimilar: 'Food product labeling case with natural ingredient claims',
    confidenceScore: 79,
    strategyTags: ['Food Labeling', 'Natural Claims', 'Consumer Expectations'],
    citation: '110 F. Supp. 3d 522 (S.D.N.Y. 2015)',
    year: 2015,
    fullOpinionUrl: '/cases/jessani-v-monini',
    matchedFacts: ['Natural ingredient claims', 'Product labeling']
  },
  {
    id: '5',
    name: 'Williams v. Gerber Products Co.',
    court: 'SDNY',
    outcome: 'Denied',
    issues: ['Nutritional claims', 'FDA standards', 'Reasonable consumer'],
    keyQuote: 'Courts must consider whether a reasonable consumer would be misled by the labeling in context.',
    whySimilar: 'Nutritional labeling claims with regulatory compliance issues',
    confidenceScore: 76,
    strategyTags: ['Nutritional Claims', 'FDA Standards', 'Regulatory Compliance'],
    citation: '552 F.3d 934 (S.D.N.Y. 2016)',
    year: 2016,
    fullOpinionUrl: '/cases/williams-v-gerber',
    matchedFacts: ['Nutritional claims', 'FDA compliance']
  }
];

export const mockStrategies: Strategy[] = [
  {
    id: 'strategy-1',
    name: 'Reasonable Consumer / Context Cures Defense',
    summary: 'Argue that a reasonable consumer would not be misled when considering the full context of product labeling, including back-panel disclosures.',
    pros: [
      'Strong precedent support from Mantikas v. Kellogg',
      'Aligns with Second Circuit reasonable consumer standard',
      'Back-panel disclosures provide complete information',
      'Cost-effective motion to dismiss strategy'
    ],
    cons: [
      'Requires detailed factual analysis of labeling',
      'May face discovery on consumer survey evidence',
      'Plaintiff-friendly jurisdiction considerations',
      'Judge\'s moderate stance on context defenses'
    ],
    requiredElements: [
      'Clear back-panel disclosures',
      'Prominent ingredient listing',
      'No contradictory front-label claims',
      'Industry standard compliance'
    ],
    riskFlags: [
      'Front-label prominence may overcome context defense',
      'Consumer survey evidence could contradict position',
      'Judge\'s receptivity to consumer perception data'
    ],
    supportingCases: [
      {
        name: 'Mantikas v. Kellogg Co.',
        citation: '832 F. Supp. 2d 304 (S.D.N.Y. 2011)',
        relevance: 'Granted MTD on context cures theory for food labeling'
      },
      {
        name: 'Jessani v. Monini North America',
        citation: '110 F. Supp. 3d 522 (S.D.N.Y. 2015)',
        relevance: 'Applied reasonable consumer standard with full labeling context'
      }
    ],
    confidenceScore: 78,
    complexity: 'Medium'
  },
  {
    id: 'strategy-2',
    name: 'Causation / Price Premium Deficiency',
    summary: 'Challenge plaintiff\'s ability to demonstrate economic injury by showing lack of price premium attributable to alleged misrepresentation.',
    pros: [
      'Strong Circuit precedent from Fink v. Time Warner',
      'Shifts burden to plaintiff on economic injury',
      'Difficult for plaintiffs to prove price premium',
      'Effective even if labeling found misleading'
    ],
    cons: [
      'May require market analysis and expert testimony',
      'Discovery-intensive defense strategy',
      'Factual issues may preclude MTD resolution',
      'Alternative product pricing complexities'
    ],
    requiredElements: [
      'Comparative product pricing analysis',
      'Market positioning evidence',
      'Consumer purchasing behavior data',
      'Economic expert testimony preparation'
    ],
    riskFlags: [
      'Strong price premium evidence could undermine defense',
      'Class certification implications',
      'May extend litigation timeline significantly'
    ],
    supportingCases: [
      {
        name: 'Fink v. Time Warner Cable',
        citation: '714 F.3d 738 (2d Cir. 2013)',
        relevance: 'Established price premium requirement for NY GBL claims'
      }
    ],
    confidenceScore: 71,
    complexity: 'High'
  },
  {
    id: 'strategy-3',
    name: 'Federal Preemption / Primary Jurisdiction',
    summary: 'Assert that federal food labeling regulations preempt state law claims or that primary jurisdiction lies with FDA.',
    pros: [
      'Complete defense if successful',
      'Precedent support from Orlander v. Staples',
      'Avoids substantive merits litigation',
      'Strong policy arguments for uniform standards'
    ],
    cons: [
      'Narrow application to specific regulatory areas',
      'May face primary jurisdiction referral delays',
      'Limited precedent in food labeling context',
      'Judge\'s policy receptivity uncertain'
    ],
    requiredElements: [
      'Comprehensive federal regulatory framework analysis',
      'FDA standards and guidance review',
      'Conflict preemption or field preemption theory',
      'Administrative exhaustion considerations'
    ],
    riskFlags: [
      'State law may operate in concurrent jurisdiction',
      'FDA enforcement discretion arguments',
      'Limited Circuit precedent on food labeling preemption'
    ],
    supportingCases: [
      {
        name: 'Orlander v. Staples Inc.',
        citation: '18 F. Supp. 3d 253 (E.D.N.Y. 2014)',
        relevance: 'Granted MTD on federal preemption grounds for labeling claims'
      }
    ],
    confidenceScore: 64,
    complexity: 'High'
  }
];

export const mockJudgeProfile: JudgeProfile = {
  name: 'Hon. Sarah Mitchell',
  characteristics: {
    pleadingStrictness: 6,
    precedentWeight: 8,
    policyReceptivity: 5,
    plaintiffFriendly: 4
  },
  evidenceSnippets: {
    pleadingStrictness: [
      'Requires detailed factual allegations in consumer protection cases',
      'Generally applies Iqbal/Twombly standards rigorously'
    ],
    precedentWeight: [
      'Strong adherence to Circuit precedent',
      'Values consumer perception surveys when available',
      'Frequently cites Mantikas and Fink in similar cases'
    ],
    policyReceptivity: [
      'Moderate on context defenses in labeling cases',
      'Balances consumer protection with business interests'
    ],
    plaintiffFriendly: [
      'Slightly defense-leaning in commercial litigation',
      'Grants MTD more frequently than district average'
    ]
  },
  notes: 'Appointed 2019. Former commercial litigator with expertise in consumer protection law. Known for thorough legal analysis and preference for early case resolution.'
};

export const mockOpposingProfile: OpposingCounselProfile = {
  name: 'Miller & Associates LLP',
  aggressivenessScore: 7,
  likelyMoves: [
    'File comprehensive opposition with consumer survey evidence',
    'Argue front-label dominance theory',
    'Request jurisdictional discovery on FDA compliance',
    'Seek class certification early in litigation'
  ],
  typicalArguments: [
    'Front-label claims cannot be cured by back-panel disclosures',
    'Reasonable consumer focuses on prominent front labeling',
    'Mantikas reasoning does not apply to this case context',
    'Economic injury presumed from deceptive labeling'
  ],
  weaknesses: [
    'Limited success with price premium arguments',
    'Tendency to over-litigate discovery disputes',
    'Weak on federal preemption defenses'
  ]
};

export const mockSimulationRounds: SimulationRound[] = [
  {
    round: 1,
    defenseArgument: 'Your Honor, under Mantikas v. Kellogg, a reasonable consumer would not be misled by the front-label "Whole Grain" claim because the back panel clearly discloses the complete ingredient list and nutritional information, providing full context that cures any potential ambiguity.',
    oppositionResponse: 'Your Honor, Mantikas is distinguishable. Here, the front-label prominence of "Whole Grain" creates the dominant consumer impression, and back-panel disclosures cannot cure front-label deception under established Second Circuit precedent. The reasonable consumer shops based on front-label representations.',
    judgeResponse: 'Counsel, I\'m familiar with Mantikas, but I need to understand how the specific labeling context here compares. The back-panel disclosure seems comprehensive, but plaintiff argues the front-label prominence creates the misleading impression. How do you address the front-label dominance concern?',
    judgeScoring: {
      score: 6,
      rationale: 'Defense makes solid precedent argument, but opposition raises valid distinguishing factors about front-label prominence.',
      featureAttributions: [
        { factor: 'Precedent Citation', weight: 0.3, impact: 'Strong Mantikas reference' },
        { factor: 'Context Defense', weight: 0.25, impact: 'Good back-panel argument' },
        { factor: 'Opposition Distinguishing', weight: -0.2, impact: 'Effective Mantikas distinction' },
        { factor: 'Judge Precedent Preference', weight: 0.15, impact: 'Values detailed precedent analysis' }
      ]
    }
  },
  {
    round: 2,
    defenseArgument: 'The front-label prominence argument fails because, as this Court noted in similar cases, context includes the entire product presentation. The ingredient panel is immediately adjacent and equally visible. Moreover, plaintiff has failed to allege they actually relied on the front label or paid any price premium, as required under Fink v. Time Warner.',
    oppositionResponse: 'Your Honor, requiring specific reliance and price premium allegations would improperly heighten pleading standards beyond Iqbal/Twombly. The deceptive labeling itself constitutes injury under NY GBL §349, and economic injury can be presumed from the deceptive practice.',
    judgeResponse: 'The causation issue is important here. Plaintiff needs to show some connection between the alleged misrepresentation and injury. But I\'m not convinced we need specific price premium allegations at the pleading stage. Let\'s focus on whether the labeling is actually misleading in context.',
    judgeScoring: {
      score: 7,
      rationale: 'Defense effectively combines context and causation arguments. Judge shows receptivity to requiring some causation showing.',
      featureAttributions: [
        { factor: 'Multi-Strategy Approach', weight: 0.25, impact: 'Combines context and causation effectively' },
        { factor: 'Causation Argument', weight: 0.3, impact: 'Strong Fink precedent application' },
        { factor: 'Judge Pleading Standards', weight: 0.2, impact: 'Aligns with moderate strictness approach' },
        { factor: 'Opposition Pleading Response', weight: -0.15, impact: 'Reasonable Iqbal/Twombly argument' }
      ]
    }
  },
  {
    round: 3,
    defenseArgument: 'Your Honor, even accepting plaintiff\'s allegations as true, the labeling here complies with FDA standards and industry practices. Federal food labeling law provides comprehensive regulation, and allowing state law claims to proceed would create a patchwork of conflicting standards, undermining Congress\'s intent for uniform national food labeling.',
    oppositionResponse: 'Your Honor, there\'s no conflict between FDA standards and NY GBL requirements. FDA sets minimum standards, while state law can provide additional consumer protection. Defendant cites no case law supporting preemption for general food labeling, and Orlander involved specific federal certification programs not present here.',
    judgeResponse: 'The preemption argument is interesting, but I\'m not seeing a direct conflict between federal and state law here. FDA standards seem to set floors, not ceilings, for labeling requirements. Unless there\'s specific federal guidance prohibiting state law enforcement, I\'m inclined to allow the state law claims to proceed.',
    judgeScoring: {
      score: 5,
      rationale: 'Preemption argument is creative but lacks strong precedential support in this specific context. Judge shows limited receptivity to broad preemption theories.',
      featureAttributions: [
        { factor: 'Preemption Strategy', weight: 0.2, impact: 'Creative but weak precedent support' },
        { factor: 'Federal Standards Argument', weight: 0.15, impact: 'Good policy argument but limited legal basis' },
        { factor: 'Judge Policy Receptivity', weight: -0.25, impact: 'Moderate receptivity to policy arguments' },
        { factor: 'Opposition Federal Law Response', weight: -0.2, impact: 'Strong distinction of Orlander case' }
      ]
    }
  }
];
