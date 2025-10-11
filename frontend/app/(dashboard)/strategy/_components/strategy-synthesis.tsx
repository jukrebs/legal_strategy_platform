
"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressHeader } from '@/components/layout/progress-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { mockStrategies, mockSimilarCases } from '@/lib/mock-data';
import { Strategy, SimilarCase } from '@/lib/types';
import { 
  CheckCircle, 
  AlertTriangle, 
  BookOpen, 
  Quote,
  Scale,
  Calendar
} from 'lucide-react';

export function StrategySynthesis() {
  const router = useRouter();
  const [strategies, setStrategies] = useState<(Strategy & { included: boolean })[]>(
    mockStrategies.map(s => ({ ...s, included: true }))
  );
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null); // null by default
  const [selectedCase, setSelectedCase] = useState<SimilarCase | null>(null);
  const [showCaseDialog, setShowCaseDialog] = useState(false);

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

  const handleCaseClick = (caseName: string) => {
    const caseData = mockSimilarCases.find(c => c.name.includes(caseName.split(' ')[0]));
    if (caseData) {
      setSelectedCase(caseData);
      setShowCaseDialog(true);
    }
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'Granted': return 'bg-black text-white border-black';
      case 'Denied': return 'bg-gray-600 text-white border-gray-600';
      case 'Mixed': return 'bg-gray-400 text-white border-gray-400';
      case 'Dismissed': return 'bg-gray-200 text-black border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

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
            onClick={() => router.push('/twins')}
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
                          {strategy?.name}
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-600 mt-1">
                          {strategy?.summary}
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
                        {strategy?.pros?.map((pro, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start">
                            <span className="inline-block w-1.5 h-1.5 bg-black rounded-full mt-2 mr-3 flex-shrink-0"></span>
                              {pro}
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
                        {strategy?.cons?.map((con, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start">
                            <span className="inline-block w-1.5 h-1.5 bg-gray-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                              {con}
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
                        {strategy?.supportingCases?.map((case_, idx) => (
                          <div 
                            key={idx} 
                            className="p-4 border border-gray-300 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCaseClick(case_?.name ?? '');
                            }}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="font-medium text-gray-900 flex items-center">
                                  {case_?.name}
                                  <BookOpen className="h-3 w-3 ml-2 text-black" />
                                </div>
                                <div className="text-sm text-gray-600 italic">{case_?.citation}</div>
                              </div>
                            </div>
                            <div className="text-sm text-gray-700 mb-3">{case_?.relevance}</div>
                            
                            {/* Strategy Usage Snippet */}
                            <div className="bg-white border-l-4 border-black p-3 rounded">
                              <div className="flex items-start space-x-2">
                                <Quote className="h-4 w-4 text-black flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-xs font-medium text-black mb-1">Strategy Applied:</p>
                                  <p className="text-sm text-gray-700 italic">
                                    "{strategy?.name === 'Reasonable Consumer / Context Cures Defense'
                                      ? 'The court held that the reasonable consumer considers all product information, including back-panel disclosures, when evaluating advertising claims.'
                                      : strategy?.name === 'Causation Deficiency Defense'
                                      ? 'The plaintiff failed to establish that they relied on the challenged statement or suffered economic harm as a direct result.'
                                      : 'Federal regulations governing product labeling preempt state-law consumer protection claims, particularly where compliance with federal standards is demonstrated.'}"
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
            onClick={() => router.push('/twins')}
            className="legal-gradient text-white"
          >
            Configure Digital Twins
          </Button>
        </div>
      </div>

      {/* Case Detail Dialog */}
      <Dialog open={showCaseDialog} onOpenChange={setShowCaseDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center space-x-3">
              <Scale className="h-5 w-5 text-black" />
              <span>{selectedCase?.name}</span>
            </DialogTitle>
            <DialogDescription>
              <div className="flex items-center space-x-4 mt-2">
                <Badge className={getOutcomeColor(selectedCase?.outcome ?? '')}>
                  {selectedCase?.outcome}
                </Badge>
                <span className="text-sm text-gray-500">{selectedCase?.court}</span>
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-3 w-3 mr-1" />
                  {selectedCase?.year}
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          
          {selectedCase && (
            <div className="space-y-4 mt-4">
              <div className="text-sm text-gray-600 italic">
                {selectedCase.citation}
              </div>

              <blockquote className="border-l-4 border-black pl-4 py-2 bg-gray-50 rounded-r-lg">
                <p className="text-gray-700 italic">"{selectedCase.keyQuote}"</p>
              </blockquote>

              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Case Summary:</h4>
                <p className="text-sm text-gray-700">{selectedCase.whySimilar}</p>
              </div>

              <div className="flex justify-end">
                <Button 
                  variant="outline"
                  onClick={() => window.open(selectedCase.fullOpinionUrl, '_blank')}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  View Full Opinion
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
