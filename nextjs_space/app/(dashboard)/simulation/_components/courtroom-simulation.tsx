
"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressHeader } from '@/components/layout/progress-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { mockSimulationRounds, mockJudgeProfile, mockOpposingProfile } from '@/lib/mock-data';
import { SimulationRound } from '@/lib/types';
import { 
  MessageSquare, 
  Play, 
  Pause, 
  RotateCcw,
  TrendingUp,
  Scale,
  Target,
  Users,
  Zap,
  Brain,
  BarChart3
} from 'lucide-react';

export function CourtroomSimulation() {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [rounds, setRounds] = useState<SimulationRound[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [strategyScores, setStrategyScores] = useState([
    { name: 'Reasonable Consumer Defense', score: 0, rounds: 0 },
    { name: 'Causation Deficiency', score: 0, rounds: 0 },
    { name: 'Federal Preemption', score: 0, rounds: 0 }
  ]);

  useEffect(() => {
    // Load existing case data
    const caseData = localStorage.getItem('legalCase');
    if (!caseData) {
      router.push('/intake');
    }
  }, [router]);

  const generateSimulationRound = async (roundNumber: number) => {
    setIsGenerating(true);
    setProgress(10);

    try {
      const caseData = JSON.parse(localStorage.getItem('legalCase') || '{}');
      
      const response = await fetch('/api/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseContext: caseData.facts,
          strategy: 'Reasonable Consumer / Context Cures Defense',
          judgeProfile: mockJudgeProfile,
          opposingProfile: mockOpposingProfile,
          round: roundNumber
        }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let partialRead = '';

      while (true) {
        const { done, value } = await reader?.read() ?? { done: true, value: undefined };
        if (done) break;

        partialRead += decoder.decode(value, { stream: true });
        let lines = partialRead.split('\n');
        partialRead = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              return;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.status === 'processing') {
                setProgress(prev => Math.min(prev + 10, 90));
              } else if (parsed.status === 'completed') {
                const simulationResult = parsed.result;
                
                const newRound: SimulationRound = {
                  round: roundNumber,
                  defenseArgument: simulationResult.defenseArgument,
                  oppositionResponse: simulationResult.oppositionResponse,
                  judgeResponse: simulationResult.judgeResponse,
                  judgeScoring: simulationResult.judgeScoring
                };
                
                setRounds(prev => [...prev, newRound]);
                setProgress(100);
                
                // Update strategy scores
                setStrategyScores(prev => prev.map((strategy, index) => 
                  index === 0 ? {
                    ...strategy,
                    score: (strategy.score * strategy.rounds + simulationResult.judgeScoring.score) / (strategy.rounds + 1),
                    rounds: strategy.rounds + 1
                  } : strategy
                ));
                
                return;
              } else if (parsed.status === 'error') {
                throw new Error(parsed.message || 'Generation failed');
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Simulation error:', error);
      // Fallback to mock data
      const mockRound = mockSimulationRounds[roundNumber - 1];
      if (mockRound) {
        setRounds(prev => [...prev, { ...mockRound, round: roundNumber }]);
        setStrategyScores(prev => prev.map((strategy, index) => 
          index === 0 ? {
            ...strategy,
            score: (strategy.score * strategy.rounds + mockRound.judgeScoring.score) / (strategy.rounds + 1),
            rounds: strategy.rounds + 1
          } : strategy
        ));
      }
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const startSimulation = async () => {
    setIsRunning(true);
    setCurrentRound(1);
    setRounds([]);
    
    // Generate 3 rounds of simulation
    for (let i = 1; i <= 3; i++) {
      setCurrentRound(i);
      await generateSimulationRound(i);
      // Add delay between rounds for better UX
      if (i < 3) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    setIsRunning(false);
  };

  const resetSimulation = () => {
    setRounds([]);
    setCurrentRound(0);
    setIsRunning(false);
    setStrategyScores(prev => prev.map(s => ({ ...s, score: 0, rounds: 0 })));
  };

  const getScoreColor = (score: number) => {
    if (score >= 7) return 'text-green-600';
    if (score >= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBadgeColor = (score: number) => {
    if (score >= 7) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 5) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <>
      <ProgressHeader 
        currentStep={5} 
        title="Digital Courtroom Simulation" 
        description="AI-powered simulation of your motion to dismiss hearing"
      />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Control Panel */}
          <div className="lg:col-span-1">
            <Card className="legal-card legal-shadow sticky top-6">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Brain className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Simulation Control</CardTitle>
                    <CardDescription>
                      Run AI-powered courtroom scenarios
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Button
                    onClick={startSimulation}
                    disabled={isRunning || isGenerating}
                    className="w-full legal-gradient text-white"
                  >
                    {isRunning || isGenerating ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        <span>Simulating...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Play className="h-4 w-4" />
                        <span>Start Simulation</span>
                      </div>
                    )}
                  </Button>

                  <Button
                    onClick={resetSimulation}
                    variant="outline"
                    disabled={isRunning || isGenerating}
                    className="w-full"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>

                {(isGenerating || isRunning) && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Round {currentRound}/3</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                {/* Strategy Leaderboard */}
                <div className="pt-4 border-t">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <BarChart3 className="h-4 w-4 text-purple-600 mr-2" />
                    Strategy Performance
                  </h4>
                  <div className="space-y-2">
                    {strategyScores.map((strategy, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {strategy.name}
                        </div>
                        <div className={`text-sm font-bold ${getScoreColor(strategy.score)}`}>
                          {strategy.rounds > 0 ? strategy.score.toFixed(1) : '--'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Continue Button */}
                {rounds.length >= 3 && (
                  <div className="pt-4 border-t">
                    <Button 
                      onClick={() => router.push('/export')}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      Generate Strategy Report
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Simulation Transcript */}
          <div className="lg:col-span-3">
            <Card className="legal-card legal-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <MessageSquare className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Motion to Dismiss Hearing</CardTitle>
                      <CardDescription>
                        AI simulation of courtroom proceedings
                      </CardDescription>
                    </div>
                  </div>
                  {rounds.length > 0 && (
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      {rounds.length} Round{rounds.length !== 1 ? 's' : ''} Complete
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {rounds.length === 0 && !isRunning ? (
                  <div className="text-center py-12">
                    <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Scale className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Simulate</h3>
                    <p className="text-gray-600 mb-4">
                      Click "Start Simulation" to begin the AI-powered courtroom scenario
                    </p>
                    <div className="grid grid-cols-3 gap-4 text-sm text-gray-500">
                      <div className="text-center">
                        <Users className="h-6 w-6 mx-auto mb-1 text-blue-500" />
                        <p>Digital Twins</p>
                      </div>
                      <div className="text-center">
                        <Zap className="h-6 w-6 mx-auto mb-1 text-yellow-500" />
                        <p>Real-time Analysis</p>
                      </div>
                      <div className="text-center">
                        <Target className="h-6 w-6 mx-auto mb-1 text-green-500" />
                        <p>Strategy Scoring</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {rounds.map((round) => (
                      <div key={round.round} className="space-y-4">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="p-1 bg-gray-100 rounded-full">
                            <MessageSquare className="h-4 w-4 text-gray-600" />
                          </div>
                          <h3 className="font-semibold text-gray-900">Round {round.round}</h3>
                        </div>

                        {/* Defense Argument */}
                        <div className="transcript-message defense-message">
                          <div className="font-medium mb-2">Defense Counsel:</div>
                          <p className="text-sm leading-relaxed">{round.defenseArgument}</p>
                        </div>

                        {/* Opposition Response */}
                        <div className="transcript-message opposition-message">
                          <div className="font-medium mb-2">Opposing Counsel:</div>
                          <p className="text-sm leading-relaxed">{round.oppositionResponse}</p>
                        </div>

                        {/* Judge Response */}
                        <div className="transcript-message judge-message">
                          <div className="font-medium mb-2">Judge:</div>
                          <p className="text-sm leading-relaxed">{round.judgeResponse}</p>
                        </div>

                        {/* Scoring Panel */}
                        <Card className="bg-gray-50 border border-gray-200">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-gray-900 flex items-center">
                                <TrendingUp className="h-4 w-4 text-blue-600 mr-2" />
                                Round {round.round} Analysis
                              </h4>
                              <Badge className={getBadgeColor(round.judgeScoring.score)}>
                                Score: {round.judgeScoring.score}/10
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-gray-700 mb-3">{round.judgeScoring.rationale}</p>
                            
                            <div className="space-y-2">
                              <h5 className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                                Key Factors
                              </h5>
                              {round.judgeScoring.featureAttributions?.map((attr, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm">
                                  <span className="text-gray-700">{attr.factor}</span>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-xs text-gray-500">{attr.impact}</span>
                                    <div className={`text-xs px-1 py-0.5 rounded ${
                                      attr.weight > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                      {attr.weight > 0 ? '+' : ''}{(attr.weight * 100).toFixed(0)}%
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-6">
              <Button 
                variant="outline" 
                onClick={() => router.push('/twins')}
              >
                Back to Digital Twins
              </Button>
              <div className="text-sm text-gray-600">
                {rounds.length > 0 ? `Completed ${rounds.length}/3 rounds` : 'Simulation not started'}
              </div>
              <Button 
                onClick={() => router.push('/export')}
                className="legal-gradient text-white"
                disabled={rounds.length === 0}
              >
                Generate Report
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
