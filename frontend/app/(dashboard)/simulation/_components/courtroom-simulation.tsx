
"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressHeader } from '@/components/layout/progress-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { mockSimulationRounds, mockJudgeProfile, mockOpposingProfile } from '@/lib/mock-data';
import { SimulationRound } from '@/lib/types';
import { 
  MessageSquare, 
  Play, 
  RotateCcw,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Target,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// Progress circle component (1-10 scale)
function ProgressCircle({ score, size = 'md' }: { score: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { width: 60, radius: 22, strokeWidth: 3, fontSize: 'text-xs', subFontSize: 'text-[8px]' },
    md: { width: 80, radius: 30, strokeWidth: 4, fontSize: 'text-sm', subFontSize: 'text-[10px]' },
    lg: { width: 100, radius: 38, strokeWidth: 5, fontSize: 'text-base', subFontSize: 'text-xs' }
  };

  const { width, radius, strokeWidth, fontSize, subFontSize } = sizes[size];
  const circumference = 2 * Math.PI * radius;
  const fillPercent = (score / 10) * circumference;
  const viewBoxSize = width;

  const getColor = (s: number) => {
    if (s >= 8) return { stroke: '#000000', text: 'text-black' }; // Black for high scores
    if (s >= 6) return { stroke: '#404040', text: 'text-gray-700' }; // Dark gray
    if (s >= 4) return { stroke: '#808080', text: 'text-gray-600' }; // Medium gray
    return { stroke: '#a3a3a3', text: 'text-gray-500' }; // Light gray for low scores
  };

  const { stroke, text } = getColor(score);
  const center = viewBoxSize / 2;

  return (
    <div className="relative inline-flex" style={{ width, height: width }}>
      <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={`${fillPercent} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-bold leading-none ${fontSize} ${text}`}>{score.toFixed(1)}</span>
        <span className={`${subFontSize} text-gray-500 leading-none mt-0.5`}>/ 10</span>
      </div>
    </div>
  );
}

interface StrategyRun {
  runId: string;
  variation: string;
  rounds: SimulationRound[];
  averageScore: number;
}

export function CourtroomSimulation() {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Each strategy has multiple runs
  const [strategies] = useState([
    { 
      id: 'strategy-1', 
      name: 'Reasonable Consumer Defense',
      accepted: true,
      runs: [] as StrategyRun[]
    },
    { 
      id: 'strategy-2', 
      name: 'Causation Deficiency', 
      accepted: true,
      runs: [] as StrategyRun[]
    },
    { 
      id: 'strategy-3', 
      name: 'Federal Preemption', 
      accepted: true,
      runs: [] as StrategyRun[]
    }
  ]);

  const [strategyRuns, setStrategyRuns] = useState<Record<string, StrategyRun[]>>({});
  const [expandedStrategy, setExpandedStrategy] = useState<string | null>(null);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  useEffect(() => {
    // Load existing case data
    const caseData = localStorage.getItem('legalCase');
    if (!caseData) {
      router.push('/intake');
    }
  }, [router]);

  const generateSimulationRuns = async (strategyId: string, strategyIndex: number, totalStrategies: number) => {
    const baseProgress = (strategyIndex / totalStrategies) * 100;
    const strategyProgressRange = 100 / totalStrategies;

    // Simulate generating 3 runs for each strategy
    const runs: StrategyRun[] = [];
    
    for (let i = 0; i < 3; i++) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const runProgress = baseProgress + ((i + 1) / 3) * strategyProgressRange;
      setProgress(Math.round(runProgress));

      const variation = i === 0 ? 'Standard Approach' : 
                       i === 1 ? 'Aggressive Variant' : 
                       'Conservative Variant';
      
      // Use mock data with some variation
      const rounds = mockSimulationRounds.map((round, idx) => ({
        ...round,
        round: idx + 1,
        judgeScoring: {
          ...round.judgeScoring,
          score: Math.max(1, Math.min(10, round.judgeScoring.score + (Math.random() - 0.5) * 2))
        }
      }));

      const averageScore = rounds.reduce((sum, r) => sum + r.judgeScoring.score, 0) / rounds.length;

      runs.push({
        runId: `${strategyId}-run-${i + 1}`,
        variation,
        rounds,
        averageScore
      });
    }

    setStrategyRuns(prev => ({
      ...prev,
      [strategyId]: runs
    }));
  };

  const startAllSimulations = async () => {
    setIsRunning(true);
    setProgress(0);
    const acceptedStrategies = strategies.filter(s => s.accepted);
    
    for (let i = 0; i < acceptedStrategies.length; i++) {
      await generateSimulationRuns(acceptedStrategies[i].id, i, acceptedStrategies.length);
    }
    
    setProgress(100);
    setIsRunning(false);
  };

  const resetSimulation = () => {
    setStrategyRuns({});
    setProgress(0);
    setExpandedStrategy(null);
    setExpandedRun(null);
  };

  const getStrategyAverageScore = (strategyId: string) => {
    const runs = strategyRuns[strategyId] || [];
    if (runs.length === 0) return 0;
    return runs.reduce((sum, run) => sum + run.averageScore, 0) / runs.length;
  };

  const getBadgeColor = (score: number) => {
    if (score >= 7) return 'bg-black text-white border-black';
    if (score >= 5) return 'bg-gray-600 text-white border-gray-600';
    return 'bg-gray-400 text-white border-gray-400';
  };

  return (
    <>
      <ProgressHeader 
        currentStep={5} 
        title="Digital Courtroom Simulation" 
        description="AI-powered simulation of your motion to dismiss hearing"
      />
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Control Panel - TOP */}
        <Card className="legal-card legal-shadow mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-black">Simulation Control</CardTitle>
                <CardDescription>
                  Run multiple simulations for each accepted strategy
                </CardDescription>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={resetSimulation}
                  variant="outline"
                  disabled={isRunning}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button
                  onClick={startAllSimulations}
                  disabled={isRunning}
                  className="legal-gradient text-white"
                >
                  {isRunning ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      <span>Simulating...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Play className="h-4 w-4" />
                      <span>Run All Simulations</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          {isRunning && (
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Generating simulation runs...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          )}
        </Card>

        {/* Strategy Cards and Empty State */}
        <div className="space-y-4">
          {strategies.filter(s => s.accepted).map((strategy) => {
            const runs = strategyRuns[strategy.id] || [];
            const avgScore = getStrategyAverageScore(strategy.id);
            const isExpanded = expandedStrategy === strategy.id;

            return (
              <Card key={strategy.id} className="legal-card legal-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <ProgressCircle score={avgScore} size="md" />
                      <div>
                        <CardTitle className="text-lg">{strategy.name}</CardTitle>
                        <CardDescription>
                          {runs.length} simulation runs completed
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {runs.length > 0 && (
                        <Badge className={getBadgeColor(avgScore)}>
                          Average: {avgScore.toFixed(1)}/10
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedStrategy(isExpanded ? null : strategy.id)}
                      >
                        {isExpanded ? <ChevronUp /> : <ChevronDown />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && runs.length > 0 && (
                  <CardContent className="space-y-3">
                    {/* Stacked Run Cards */}
                    <div className="space-y-2">
                      {runs.map((run, idx) => {
                        const isRunExpanded = expandedRun === run.runId;
                        
                        return (
                        <Card 
                          key={run.runId} 
                          className={`border-2 transition-all ${
                            isRunExpanded ? 'border-black shadow-md' : 'border-gray-200'
                          }`}
                            style={{ marginLeft: `${idx * 8}px` }}
                          >
                            <Collapsible open={isRunExpanded} onOpenChange={() => setExpandedRun(isRunExpanded ? null : run.runId)}>
                              <CollapsibleTrigger asChild>
                                <CardHeader className="pb-3 cursor-pointer hover:bg-gray-50">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      <ProgressCircle score={run.averageScore} size="sm" />
                                      <div>
                                        <h4 className="font-semibold text-gray-900">Run #{idx + 1}: {run.variation}</h4>
                                        <p className="text-sm text-gray-600">{run.rounds.length} rounds simulated</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Badge className={getBadgeColor(run.averageScore)}>
                                        {run.averageScore.toFixed(1)}/10
                                      </Badge>
                                      {isRunExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                    </div>
                                  </div>
                                </CardHeader>
                              </CollapsibleTrigger>

                              <CollapsibleContent>
                                <CardContent className="space-y-6 pt-0">
                                  {run.rounds.map((round) => (
                                    <div key={round.round} className="space-y-4 pb-6 border-b last:border-b-0">
                                      <div className="flex items-center space-x-3 mb-4">
                                        <MessageSquare className="h-4 w-4 text-gray-600" />
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

                                      {/* Scoring Panel with Highlights */}
                                      <Card className="bg-gray-50 border border-gray-200">
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between mb-3">
                                              <h4 className="font-medium text-gray-900 flex items-center">
                                                <TrendingUp className="h-4 w-4 text-black mr-2" />
                                                Round {round.round} Analysis
                                              </h4>
                                            <div className="flex items-center space-x-2">
                                              <ProgressCircle score={round.judgeScoring.score} size="sm" />
                                            </div>
                                          </div>
                                          
                                          <p className="text-sm text-gray-700 mb-3">{round.judgeScoring.rationale}</p>
                                          
                                          {/* Highlighted Important Passages */}
                                          <div className="bg-gray-100 border-l-4 border-black p-3 mb-3">
                                            <div className="flex items-start space-x-2">
                                              <AlertCircle className="h-4 w-4 text-black mt-0.5" />
                                              <div>
                                                <p className="text-xs font-medium text-black mb-1">Key Moment:</p>
                                                <p className="text-sm text-gray-800">
                                                  {round.judgeScoring.score >= 7 
                                                    ? "Judge found the precedent cited particularly persuasive and noted strong factual alignment."
                                                    : round.judgeScoring.score >= 5
                                                    ? "Judge acknowledged the argument but expressed concerns about distinguishing prior cases."
                                                    : "Judge was skeptical of the argument and highlighted weaknesses in the legal reasoning."}
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                          
                                          <div className="space-y-2">
                                            <h5 className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                                              Scoring Factors
                                            </h5>
                                            {round.judgeScoring.featureAttributions?.map((attr, idx) => (
                                              <div key={idx} className="flex items-center justify-between text-sm p-2 bg-white rounded border">
                                                <span className="text-gray-700 flex items-center">
                                                  {attr.weight > 0 ? <CheckCircle className="h-3 w-3 text-black mr-2" /> : <AlertCircle className="h-3 w-3 text-gray-600 mr-2" />}
                                                  {attr.factor}
                                                </span>
                                                <div className="flex items-center space-x-2">
                                                  <span className="text-xs text-gray-500">{attr.impact}</span>
                                                  <div className={`text-xs px-2 py-0.5 rounded font-medium ${
                                                    attr.weight > 0 ? 'bg-black text-white' : 'bg-gray-600 text-white'
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
                                </CardContent>
                              </CollapsibleContent>
                            </Collapsible>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
          
          {/* Empty State */}
          {Object.keys(strategyRuns).length === 0 && !isRunning && (
            <Card className="legal-card legal-shadow">
              <CardContent className="text-center py-8">
                <Target className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <h3 className="text-base font-medium text-gray-900 mb-1">Ready to Simulate</h3>
                <p className="text-sm text-gray-600">
                  Click "Run All Simulations" to test your strategies
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <Button 
            variant="outline" 
            onClick={() => router.push('/twins')}
          >
            Back to Digital Twins
          </Button>
          <div className="text-sm text-gray-600">
            {Object.keys(strategyRuns).length > 0 
              ? `${Object.values(strategyRuns).flat().length} simulation runs completed` 
              : 'Simulation not started'}
          </div>
          {Object.keys(strategyRuns).length > 0 && !isRunning && (
            <Button 
              onClick={() => router.push('/export')}
              className="legal-gradient text-white"
            >
              Generate Report
            </Button>
          )}
        </div>
      </div>
    </>
  );
}
