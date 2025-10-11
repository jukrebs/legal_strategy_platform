
export interface CaseIntake {
  jurisdiction: string;
  judge: string;
  caseType: string;
  posture: string;
  opposingCounsel: string;
  facts: string;
  preferences: {
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    briefStyle: 'concise' | 'detailed' | 'comprehensive';
    settlementPosture: 'early' | 'trial-ready' | 'mixed';
  };
}

export interface SimilarCase {
  id: string;
  name: string;
  court: string;
  outcome: 'Granted' | 'Dismissed' | 'Denied' | 'Mixed';
  issues: string[];
  keyQuote: string;
  whySimilar: string;
  confidenceScore: number;
  strategyTags: string[];
  citation: string;
  year: number;
  isPinned?: boolean;
  isHelpful?: boolean;
  fullOpinionUrl: string;
  matchedFacts: string[];
}

export interface Strategy {
  id: string;
  name: string;
  summary: string;
  pros: string[];
  cons: string[];
  requiredElements: string[];
  riskFlags: string[];
  supportingCases: Array<{
    name: string;
    citation: string;
    relevance: string;
  }>;
  confidenceScore: number;
  complexity: 'Low' | 'Medium' | 'High';
}

export interface JudgeProfile {
  name: string;
  characteristics: {
    pleadingStrictness: number; // 1-10 scale
    precedentWeight: number;
    policyReceptivity: number;
    plaintiffFriendly: number;
  };
  evidenceSnippets: {
    [key: string]: string[];
  };
  notes: string;
}

export interface OpposingCounselProfile {
  name: string;
  likelyMoves: string[];
  aggressivenessScore: number;
  typicalArguments: string[];
  weaknesses: string[];
}

export interface SimulationRound {
  round: number;
  defenseArgument: string;
  oppositionResponse: string;
  judgeResponse: string;
  judgeScoring: {
    score: number;
    rationale: string;
    featureAttributions: Array<{
      factor: string;
      weight: number;
      impact: string;
    }>;
  };
}

export interface ExportData {
  caseSummary: string;
  recommendedStrategy: Strategy;
  supportingArguments: Array<{
    point: string;
    citations: string[];
    analysis: string;
  }>;
  riskAnalysis: string;
  keyPrecedents: SimilarCase[];
}
