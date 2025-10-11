
"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressHeader } from '@/components/layout/progress-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { mockStrategies } from '@/lib/mock-data';
import { Strategy } from '@/lib/types';
import { 
  Target, 
  CheckCircle, 
  AlertTriangle, 
  BookOpen, 
  Lightbulb,
  TrendingUp,
  Settings,
  Zap,
  Shield
} from 'lucide-react';

export function StrategySynthesis() {
  const router = useRouter();
  const [strategies, setStrategies] = useState<Strategy[]>(mockStrategies);
  const [selectedStrategy, setSelectedStrategy] = useState<string>('strategy-1');
  const [preferences, setPreferences] = useState({
    prioritizePrecedent: true,
    riskAversion: 50,
    timeToMarket: true,
    budgetConscious: false,
    novelArguments: false
  });

  const selectedStrategyData = strategies.find(s => s?.id === selectedStrategy);

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Low': return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'High': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <>
      <ProgressHeader 
        currentStep={3} 
        title="Strategy Synthesis" 
        description="AI-generated defense strategies tailored to your case"
      />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Strategy Preferences Sidebar */}
          <div className="lg:col-span-1">
            <Card className="legal-card legal-shadow sticky top-6">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Settings className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Strategy Preferences</CardTitle>
                    <CardDescription className="text-sm">
                      Adjust parameters to refine strategy generation
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="precedent" className="text-sm font-medium">
                      Prioritize Precedent
                    </Label>
                    <Switch 
                      id="precedent"
                      checked={preferences.prioritizePrecedent}
                      onCheckedChange={(checked) => 
                        setPreferences(prev => ({...prev, prioritizePrecedent: checked}))
                      }
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Risk Aversion: {preferences.riskAversion}%
                    </Label>
                    <Slider
                      value={[preferences.riskAversion]}
                      onValueChange={(value) => 
                        setPreferences(prev => ({...prev, riskAversion: value[0]}))
                      }
                      max={100}
                      step={10}
                      className="w-full"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="timeToMarket" className="text-sm font-medium">
                      Quick Resolution
                    </Label>
                    <Switch 
                      id="timeToMarket"
                      checked={preferences.timeToMarket}
                      onCheckedChange={(checked) => 
                        setPreferences(prev => ({...prev, timeToMarket: checked}))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="budget" className="text-sm font-medium">
                      Budget Conscious
                    </Label>
                    <Switch 
                      id="budget"
                      checked={preferences.budgetConscious}
                      onCheckedChange={(checked) => 
                        setPreferences(prev => ({...prev, budgetConscious: checked}))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="novel" className="text-sm font-medium">
                      Novel Arguments
                    </Label>
                    <Switch 
                      id="novel"
                      checked={preferences.novelArguments}
                      onCheckedChange={(checked) => 
                        setPreferences(prev => ({...prev, novelArguments: checked}))
                      }
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      // Simulate strategy regeneration
                      setStrategies(prev => prev.map(s => ({
                        ...s,
                        confidenceScore: Math.floor(Math.random() * 30) + 65
                      })));
                    }}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Regenerate Strategies
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Strategy Cards */}
          <div className="lg:col-span-3 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Recommended Defense Strategies</h2>
                <p className="text-gray-600">Click on a strategy to view detailed analysis</p>
              </div>
              <Button 
                onClick={() => router.push('/twins')}
                className="legal-gradient text-white"
              >
                Configure Digital Twins
              </Button>
            </div>

            {/* Strategy Cards */}
            <div className="space-y-4">
              {strategies?.map((strategy, index) => (
                <Card 
                  key={strategy?.id}
                  className={`strategy-card cursor-pointer transition-all duration-300 ${
                    selectedStrategy === strategy?.id 
                      ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/30' 
                      : 'legal-card hover:shadow-lg'
                  } legal-shadow`}
                  onClick={() => setSelectedStrategy(strategy?.id ?? '')}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className={`p-2 rounded-lg ${
                            index === 0 ? 'bg-blue-100' : index === 1 ? 'bg-green-100' : 'bg-purple-100'
                          }`}>
                            {index === 0 ? <Shield className="h-5 w-5 text-blue-600" /> :
                             index === 1 ? <Target className="h-5 w-5 text-green-600" /> :
                             <Lightbulb className="h-5 w-5 text-purple-600" />}
                          </div>
                          <div>
                            <CardTitle className="text-xl font-semibold text-gray-900">
                              {strategy?.name}
                            </CardTitle>
                            <CardDescription className="text-sm text-gray-600 mt-1">
                              {strategy?.summary}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={getComplexityColor(strategy?.complexity ?? '')}>
                          {strategy?.complexity} Complexity
                        </Badge>
                        <div className={`text-lg font-bold ${getConfidenceColor(strategy?.confidenceScore ?? 0)}`}>
                          {strategy?.confidenceScore}%
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  {selectedStrategy === strategy?.id && (
                    <CardContent className="space-y-6">
                      {/* Pros and Cons */}
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                            Advantages
                          </h4>
                          <ul className="space-y-2">
                            {strategy?.pros?.map((pro, idx) => (
                              <li key={idx} className="text-sm text-gray-700 flex items-start">
                                <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                {pro}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                            Considerations
                          </h4>
                          <ul className="space-y-2">
                            {strategy?.cons?.map((con, idx) => (
                              <li key={idx} className="text-sm text-gray-700 flex items-start">
                                <span className="inline-block w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                {con}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Required Elements */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                          <TrendingUp className="h-4 w-4 text-blue-600 mr-2" />
                          Required Elements
                        </h4>
                        <div className="grid sm:grid-cols-2 gap-2">
                          {strategy?.requiredElements?.map((element, idx) => (
                            <div key={idx} className="text-sm text-gray-700 p-2 bg-gray-50 rounded border">
                              {element}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Risk Flags */}
                      {strategy?.riskFlags && strategy?.riskFlags?.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                            <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                            Risk Flags
                          </h4>
                          <div className="space-y-2">
                            {strategy?.riskFlags?.map((risk, idx) => (
                              <div key={idx} className="text-sm text-red-700 p-2 bg-red-50 border border-red-200 rounded">
                                {risk}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Supporting Cases */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                          <BookOpen className="h-4 w-4 text-purple-600 mr-2" />
                          Supporting Precedent
                        </h4>
                        <div className="space-y-3">
                          {strategy?.supportingCases?.map((case_, idx) => (
                            <div key={idx} className="p-3 border border-gray-200 rounded-lg bg-white">
                              <div className="font-medium text-gray-900">{case_?.name}</div>
                              <div className="text-sm text-gray-600 italic mb-1">{case_?.citation}</div>
                              <div className="text-sm text-gray-700">{case_?.relevance}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <Button 
                variant="outline" 
                onClick={() => router.push('/cases')}
              >
                Back to Similar Cases
              </Button>
              <div className="text-sm text-gray-600">
                {selectedStrategyData ? `Selected: ${selectedStrategyData?.name}` : 'Select a strategy to continue'}
              </div>
              <Button 
                onClick={() => router.push('/twins')}
                className="legal-gradient text-white"
                disabled={!selectedStrategy}
              >
                Configure Digital Twins
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
