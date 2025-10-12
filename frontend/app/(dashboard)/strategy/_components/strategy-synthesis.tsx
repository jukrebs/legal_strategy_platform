
"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressHeader } from '@/components/layout/progress-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  CheckCircle, 
  AlertTriangle, 
  BookOpen, 
  Quote,
  Loader2
} from 'lucide-react';

interface StrategyData {
  id: string;
  title: string;
  advantages: string[];
  considerations: string[];
  riskFlags: string[];
  supportingPrecedents: {
    caseName: string;
    application: string;
  }[];
  included: boolean;
}

export function StrategySynthesis() {
  const router = useRouter();
  const [strategies, setStrategies] = useState<StrategyData[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStrategies();
  }, []);

  const fetchStrategies = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get selected cases from localStorage
      const selectedCasesJson = localStorage.getItem('selectedCases');
      if (!selectedCasesJson) {
        setError('No cases selected. Please select cases first.');
        setIsLoading(false);
        return;
      }

      const selectedCases = JSON.parse(selectedCasesJson);
      
      // Call backend to generate strategies
      const response = await fetch('http://localhost:5000/api/generate-strategies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cases: selectedCases }),
      });

      const data = await response.json();
      
      if (data.success) {
        setStrategies(data.strategies.map((s: any) => ({
          ...s,
          included: true
        })));
      } else {
        setError(data.error || 'Failed to generate strategies');
      }
    } catch (err) {
      setError('Failed to connect to backend server');
      console.error('Error generating strategies:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStrategy = (strategyId: string) => {
    setSelectedStrategy(selectedStrategy === strategyId ? null : strategyId);
  };

  const toggleStrategyInclusion = (strategyId: string) => {
    setStrategies(prev => prev.map(strategy => 
      strategy?.id === strategyId 
        ? { ...strategy, included: !strategy.included }
        : strategy
    ));
  };

  if (isLoading) {
    return (
      <>
        <ProgressHeader 
          currentStep={3} 
          title="Generating Strategies" 
          description="AI is analyzing cases and developing defense strategies"
        />
        <div className="max-w-6xl mx-auto p-6">
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-black mx-auto mb-4" />
            <p className="text-gray-600">Analyzing precedents and formulating defense strategies...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <ProgressHeader 
          currentStep={3} 
          title="Error Generating Strategies" 
          description="Failed to generate defense strategies"
        />
        <div className="max-w-6xl mx-auto p-6">
          <Card className="legal-card legal-shadow">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={fetchStrategies}>Retry</Button>
                  <Button variant="outline" onClick={() => router.push('/cases')}>
                    Back to Cases
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <ProgressHeader 
        currentStep={3} 
        title="Strategy Synthesis" 
        description="AI-generated defense strategies tailored to your case"
      />
      
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Recommended Defense Strategies</h2>
            <p className="text-gray-600">Select strategies to include in your analysis. Click to expand details.</p>
          </div>
          <Button 
            onClick={() => {
              // Save selected strategies to localStorage
              const selectedStrategies = strategies.filter(s => s.included);
              localStorage.setItem('selectedStrategies', JSON.stringify(selectedStrategies));
              router.push('/twins');
            }}
            className="legal-gradient text-white"
          >
            Configure Digital Twins
          </Button>
        </div>

        {/* Strategy Cards */}
        <div className="space-y-4">
          {strategies?.map((strategy, index) => {
            const isExpanded = selectedStrategy === strategy?.id;
            
            return (
              <Card 
                key={strategy?.id}
                className={`strategy-card transition-all duration-300 ${
                  !strategy.included ? 'opacity-50 bg-gray-100' : 
                  isExpanded
                    ? 'ring-2 ring-black border-black bg-gray-50' 
                    : 'legal-card hover:shadow-lg'
                } legal-shadow`}
              >
                <CardHeader className="pb-4" onClick={() => toggleStrategy(strategy?.id ?? '')}>
                  <div className="flex items-start justify-between cursor-pointer">
                    <div className="flex items-start space-x-3 flex-1">
                      <Checkbox 
                        checked={strategy.included}
                        onCheckedChange={() => toggleStrategyInclusion(strategy?.id ?? '')}
                        className="mt-1"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1">
                        <CardTitle className="text-xl font-semibold text-gray-900 mb-1">
                          {strategy?.title}
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-600 mt-1">
                          Click to expand and view details
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-6">
                    {/* Pros and Cons */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <CheckCircle className="h-4 w-4 text-black mr-2" />
                        Advantages
                      </h4>
                      <ul className="space-y-2">
                        {strategy?.advantages?.map((advantage, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start">
                            <span className="inline-block w-1.5 h-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0"></span>
                              {advantage}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <AlertTriangle className="h-4 w-4 text-gray-600 mr-2" />
                        Considerations
                      </h4>
                      <ul className="space-y-2">
                        {strategy?.considerations?.map((consideration, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start">
                            <span className="inline-block w-1.5 h-1.5 bg-gray-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                              {consideration}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Risk Flags */}
                    {strategy?.riskFlags && strategy?.riskFlags?.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                          <AlertTriangle className="h-4 w-4 text-gray-700 mr-2" />
                          Risk Flags
                        </h4>
                        <div className="space-y-2">
                          {strategy?.riskFlags?.map((risk, idx) => (
                            <div key={idx} className="text-sm text-gray-800 p-2 bg-gray-100 border border-gray-300 rounded">
                              {risk}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Supporting Cases with Snippets */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <BookOpen className="h-4 w-4 text-black mr-2" />
                        Supporting Precedent & Strategy Applications
                      </h4>
                      <div className="space-y-3">
                        {strategy?.supportingPrecedents?.map((precedent, idx) => (
                          <div 
                            key={idx} 
                            className="p-4 border border-gray-300 rounded-lg bg-gray-50"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="font-medium text-gray-900 flex items-center">
                                {precedent?.caseName}
                                <BookOpen className="h-3 w-3 ml-2 text-black" />
                              </div>
                            </div>
                            
                            {/* Strategy Usage Snippet */}
                            <div className="bg-white border-l-4 border-black p-3 rounded">
                              <div className="flex items-start space-x-2">
                                <Quote className="h-4 w-4 text-black flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-xs font-medium text-black mb-1">Strategy Application:</p>
                                  <p className="text-sm text-gray-700 italic">
                                    "{precedent?.application}"
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Toggle Inclusion Button */}
                    <div className="flex justify-end pt-4 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStrategyInclusion(strategy?.id ?? '');
                        }}
                        className={strategy.included ? 'text-gray-600 hover:text-black' : 'text-black hover:text-gray-600'}
                      >
                        {strategy.included ? 'Remove from Analysis' : 'Include in Analysis'}
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
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
            {strategies.filter(s => s.included).length} of {strategies.length} strategies selected
          </div>
          <Button 
            onClick={() => {
              // Save selected strategies to localStorage
              const selectedStrategies = strategies.filter(s => s.included);
              localStorage.setItem('selectedStrategies', JSON.stringify(selectedStrategies));
              router.push('/twins');
            }}
            className="legal-gradient text-white"
          >
            Configure Digital Twins
          </Button>
        </div>
      </div>
    </>
  );
}
