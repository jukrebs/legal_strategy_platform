
"use client"

import React from 'react';
import { useRouter } from 'next/navigation';
import { ProgressHeader } from '@/components/layout/progress-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { mockJudgeProfile, mockOpposingProfile } from '@/lib/mock-data';
import { 
  Gavel,
  Briefcase,
  Target,
  Brain,
  Shield,
  Zap,
  TrendingUp,
  AlertCircle,
  Award,
  Scale
} from 'lucide-react';

// Simulated backend data
const judgeCharacterData = {
  ...mockJudgeProfile,
  emotionalProfile: {
    temperament: 'Analytical and Reserved',
    patience: 75,
    opennessToNovelArguments: 45,
    sympathy: {
      plaintiff: 35,
      defendant: 65
    }
  },
  strictnessAreas: [
    { area: 'Pleading Standards', level: 8, note: 'Expects detailed factual allegations' },
    { area: 'Precedent Adherence', level: 9, note: 'Strongly follows circuit precedent' },
    { area: 'Procedural Rules', level: 7, note: 'Moderate on procedural compliance' },
    { area: 'Evidentiary Standards', level: 6, note: 'Relatively flexible' }
  ],
  lenientAreas: [
    { area: 'Discovery Requests', level: 8, note: 'Grants broad discovery' },
    { area: 'Amendment of Pleadings', level: 7, note: 'Often allows amendments' },
    { area: 'Extension Motions', level: 6, note: 'Reasonable with deadlines' }
  ],
  statistics: {
    motionsToDismissGranted: 42,
    summaryJudgmentGranted: 38,
    totalCases: 156,
    averageTrialLength: '8.5 days'
  }
};

const opposingPartyData = {
  ...mockOpposingProfile,
  name: 'State of New York - AG Office',
  attorney: 'James Anderson',
  emotionalProfile: {
    aggressiveness: 85,
    negotiationWillingness: 30,
    bluffingTendency: 60
  },
  personalPreferences: {
    communicationStyle: 'Formal and adversarial',
    responsiveness: 'Typically responds within 3-5 business days',
    settlementHistory: 'Rarely settles before discovery'
  },
  specializations: [
    'Consumer Protection Law',
    'False Advertising Claims',
    'State GBL §349/350 Actions',
    'Class Action Defense'
  ],
  statistics: {
    casesWon: 34,
    casesLost: 18,
    settledCases: 12,
    winRate: 65
  },
  tacticalTendencies: [
    { tendency: 'Early Aggressive Discovery', frequency: 90 },
    { tendency: 'Motion Practice Focus', frequency: 85 },
    { tendency: 'Expert Witness Heavy', frequency: 70 },
    { tendency: 'Settlement Negotiations', frequency: 25 }
  ]
};

function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-700">{label}</span>
        <span className="font-medium text-gray-900">{value}/10</span>
      </div>
      <Progress value={value * 10} className="h-2 bg-black" />
    </div>
  );
}

export function DigitalTwins() {
  const router = useRouter();

  return (
    <>
      <ProgressHeader 
        currentStep={4} 
        title="Digital Twins Configuration" 
        description="AI-generated profiles for judge and opposing party based on historical data"
      />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-black">Character Profiles</h2>
          <p className="text-gray-600">
            These profiles are generated from historical case data, rulings, and behavioral patterns
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Judge Profile Card */}
          <Card className="legal-card legal-shadow">
            <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16 border-4 border-white shadow-md">
                  <AvatarFallback className="text-xl font-bold bg-gray-200 text-black">
                    {judgeCharacterData.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Gavel className="h-5 w-5 text-black" />
                    <CardTitle className="text-xl text-black">{judgeCharacterData.name}</CardTitle>
                  </div>
                  <CardDescription className="mt-1">
                    Federal District Judge • {judgeCharacterData.court}
                  </CardDescription>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="outline" className="text-xs border-black">
                      <Brain className="h-3 w-3 mr-1" />
                      {judgeCharacterData.emotionalProfile.temperament}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6 pt-6">
              {/* Emotional Characteristics */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Brain className="h-4 w-4 mr-2 text-black" />
                  Emotional Characteristics
                </h4>
                <div className="space-y-3">
                  <StatBar label="Patience Level" value={judgeCharacterData.emotionalProfile.patience / 10} />
                  <StatBar label="Openness to Novel Arguments" value={judgeCharacterData.emotionalProfile.opennessToNovelArguments / 10} />
                  
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="p-3 bg-gray-50 rounded border border-gray-300">
                      <div className="text-xs text-gray-600 font-medium mb-1">Plaintiff Sympathy</div>
                      <div className="text-2xl font-bold text-black">{judgeCharacterData.emotionalProfile.sympathy.plaintiff}%</div>
                    </div>
                    <div className="p-3 bg-gray-100 rounded border border-gray-400">
                      <div className="text-xs text-gray-700 font-medium mb-1">Defendant Sympathy</div>
                      <div className="text-2xl font-bold text-black">{judgeCharacterData.emotionalProfile.sympathy.defendant}%</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Strictness Areas */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Scale className="h-4 w-4 mr-2 text-black" />
                  Areas of Strictness
                </h4>
                <div className="space-y-2">
                  {judgeCharacterData.strictnessAreas.map((area, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{area.area}</div>
                        <div className="text-xs text-gray-600">{area.note}</div>
                      </div>
                      <Badge className="bg-gray-50 text-gray-900 border border-gray-300">
                        {area.level}/10
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lenient Areas */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2 text-black" />
                  Areas of Flexibility
                </h4>
                <div className="space-y-2">
                  {judgeCharacterData.lenientAreas.map((area, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{area.area}</div>
                        <div className="text-xs text-gray-600">{area.note}</div>
                      </div>
                      <Badge className="bg-gray-50 text-gray-900 border border-gray-300">
                        {area.level}/10
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Statistics */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Award className="h-4 w-4 mr-2 text-black" />
                  Judicial Statistics
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded border">
                    <div className="text-xs text-gray-600 mb-1">MTD Grant Rate</div>
                    <div className="text-lg font-bold text-gray-900">{judgeCharacterData.statistics.motionsToDismissGranted}%</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded border">
                    <div className="text-xs text-gray-600 mb-1">SJ Grant Rate</div>
                    <div className="text-lg font-bold text-gray-900">{judgeCharacterData.statistics.summaryJudgmentGranted}%</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded border">
                    <div className="text-xs text-gray-600 mb-1">Total Cases</div>
                    <div className="text-lg font-bold text-gray-900">{judgeCharacterData.statistics.totalCases}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded border">
                    <div className="text-xs text-gray-600 mb-1">Avg Trial Length</div>
                    <div className="text-lg font-bold text-gray-900">{judgeCharacterData.statistics.averageTrialLength}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Opposing Party Profile Card */}
          <Card className="legal-card legal-shadow">
            <CardHeader className="pb-4 bg-gradient-to-r from-gray-100 to-gray-200">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16 border-4 border-white shadow-md">
                  <AvatarFallback className="text-xl font-bold bg-gray-300 text-black">
                    {opposingPartyData.attorney.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Briefcase className="h-5 w-5 text-black" />
                    <CardTitle className="text-xl text-black">{opposingPartyData.name}</CardTitle>
                  </div>
                  <CardDescription className="mt-1">
                    {opposingPartyData.attorney}
                  </CardDescription>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="outline" className="text-xs bg-gray-50 border-black">
                      <Target className="h-3 w-3 mr-1" />
                      Win Rate: {opposingPartyData.statistics.winRate}%
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6 pt-6">
              {/* Emotional Profile */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2 text-gray-700" />
                  Behavioral Profile
                </h4>
                <div className="space-y-3">
                  <StatBar label="Aggressiveness" value={opposingPartyData.emotionalProfile.aggressiveness / 10} />
                  <StatBar label="Negotiation Willingness" value={opposingPartyData.emotionalProfile.negotiationWillingness / 10} />
                  <StatBar label="Bluffing Tendency" value={opposingPartyData.emotionalProfile.bluffingTendency / 10} />
                </div>
              </div>

              {/* Personal Preferences */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Brain className="h-4 w-4 mr-2 text-black" />
                  Personal Preferences
                </h4>
                <div className="space-y-2">
                  <div className="p-2 bg-gray-50 rounded border">
                    <div className="text-sm font-medium text-gray-900">Communication Style</div>
                    <div className="text-xs text-gray-600">{opposingPartyData.personalPreferences.communicationStyle}</div>
                  </div>
                  <div className="p-2 bg-gray-50 rounded border">
                    <div className="text-sm font-medium text-gray-900">Responsiveness</div>
                    <div className="text-xs text-gray-600">{opposingPartyData.personalPreferences.responsiveness}</div>
                  </div>
                  <div className="p-2 bg-gray-50 rounded border">
                    <div className="text-sm font-medium text-gray-900">Settlement History</div>
                    <div className="text-xs text-gray-600">{opposingPartyData.personalPreferences.settlementHistory}</div>
                  </div>
                </div>
              </div>

              {/* Specializations */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Award className="h-4 w-4 mr-2 text-black" />
                  Areas of Specialization
                </h4>
                <div className="flex flex-wrap gap-2">
                  {opposingPartyData.specializations.map((spec, idx) => (
                    <Badge key={idx} className="bg-gray-200 text-black border-gray-300 pointer-events-none">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Tactical Tendencies */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Target className="h-4 w-4 mr-2 text-gray-700" />
                  Tactical Tendencies
                </h4>
                <div className="space-y-2">
                  {opposingPartyData.tacticalTendencies.map((tactic, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                      <span className="text-sm text-gray-900">{tactic.tendency}</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={tactic.frequency} className="w-20 h-2" />
                        <span className="text-xs font-medium text-gray-600 w-10">{tactic.frequency}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Statistics */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2 text-black" />
                  Track Record
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 rounded border">
                    <div className="text-xs text-gray-600 mb-1">Cases Won</div>
                    <div className="text-lg font-bold text-gray-900">{opposingPartyData.statistics.casesWon}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded border">
                    <div className="text-xs text-gray-600 mb-1">Cases Lost</div>
                    <div className="text-lg font-bold text-gray-900">{opposingPartyData.statistics.casesLost}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded border">
                    <div className="text-xs text-gray-600 mb-1">Settled Cases</div>
                    <div className="text-lg font-bold text-gray-900">{opposingPartyData.statistics.settledCases}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded border">
                    <div className="text-xs text-gray-600 mb-1">Win Rate</div>
                    <div className="text-lg font-bold text-gray-900">{opposingPartyData.statistics.winRate}%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <Button 
            variant="outline" 
            onClick={() => router.push('/strategy')}
          >
            Back to Strategy
          </Button>
          
          <div className="text-sm text-gray-600">
            <Shield className="h-4 w-4 inline mr-2" />
            Profiles generated from {judgeCharacterData.statistics.totalCases + opposingPartyData.statistics.casesWon + opposingPartyData.statistics.casesLost + opposingPartyData.statistics.settledCases} historical cases
          </div>
          
          <Button 
            onClick={() => router.push('/simulation')}
            className="legal-gradient text-white flex items-center space-x-2"
          >
            <Zap className="h-4 w-4" />
            <span>Run Courtroom Simulation</span>
          </Button>
        </div>
      </div>
    </>
  );
}
