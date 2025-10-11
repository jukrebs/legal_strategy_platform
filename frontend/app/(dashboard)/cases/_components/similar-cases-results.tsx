
"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressHeader } from '@/components/layout/progress-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { mockSimilarCases } from '@/lib/mock-data';
import { SimilarCase } from '@/lib/types';
import { 
  Search, 
  ExternalLink, 
  Scale,
  Calendar,
  BookOpen,
  Filter,
  XCircle
} from 'lucide-react';

// Relevancy circle component - Black & White theme
function RelevancyCircle({ relevancy }: { relevancy: number }) {
  const getShade = (score: number) => {
    // Higher score = darker/more filled
    if (score >= 8) return 'rgb(0, 0, 0)'; // Black for high relevancy
    if (score >= 6) return 'rgb(64, 64, 64)'; // Dark gray
    if (score >= 4) return 'rgb(128, 128, 128)'; // Medium gray
    return 'rgb(163, 163, 163)'; // Light gray for low relevancy
  };

  const color = getShade(relevancy);
  const circumference = 2 * Math.PI * 18;
  const fillPercent = (relevancy / 10) * circumference;

  return (
    <div className="relative w-14 h-14">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 40 40">
        <circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="3"
        />
        <circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={`${fillPercent} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold" style={{ color }}>{relevancy}</span>
      </div>
    </div>
  );
}

export function SimilarCasesResults() {
  const router = useRouter();
  const [cases, setCases] = useState<(SimilarCase & { relevancy: number; included: boolean })[]>(
    mockSimilarCases.map(c => ({
      ...c,
      relevancy: Math.floor(Math.random() * 4) + 7, // 7-10 for relevant cases
      included: true
    }))
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOutcome, setSelectedOutcome] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const filteredCases = cases.filter(case_ => {
    const matchesSearch = case_?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase() ?? '') ||
                         case_?.keyQuote?.toLowerCase()?.includes(searchTerm?.toLowerCase() ?? '');
    const matchesOutcome = selectedOutcome === 'all' || case_?.outcome === selectedOutcome;
    return matchesSearch && matchesOutcome;
  });

  const toggleCaseInclusion = (caseId: string) => {
    setCases(prev => prev.map(case_ => 
      case_?.id === caseId 
        ? { ...case_, included: !case_.included }
        : case_
    ));
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

  if (isLoading) {
    return (
      <>
        <ProgressHeader 
          currentStep={2} 
          title="Finding Similar Cases" 
          description="Analyzing precedents and identifying strategic opportunities"
        />
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center py-12">
            <div className="animate-spin h-12 w-12 border-4 border-black border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Searching legal databases and analyzing precedents...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ProgressHeader 
        currentStep={2} 
        title="Similar Cases Found" 
        description={`Found ${filteredCases?.length ?? 0} relevant precedents for your case`}
      />
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Search and Filter Section */}
        <Card className="legal-card legal-shadow mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Search className="h-6 w-6 text-black" />
                </div>
                <div>
                  <CardTitle className="text-xl text-black">Case Research Results</CardTitle>
                  <CardDescription>
                    Review similar cases and precedents relevant to your matter
                  </CardDescription>
                </div>
              </div>
              <Button 
                onClick={() => router.push('/strategy')}
                className="legal-gradient text-white"
              >
                Continue to Strategy Development
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search cases or quotes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={selectedOutcome}
                  onChange={(e) => setSelectedOutcome(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Outcomes</option>
                  <option value="Granted">Granted</option>
                  <option value="Denied">Denied</option>
                  <option value="Mixed">Mixed</option>
                  <option value="Dismissed">Dismissed</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cases Grid */}
        <div className="grid gap-6">
          {filteredCases?.map((case_) => (
            <Card 
              key={case_?.id} 
              className={`case-card transition-all duration-300 ${
                !case_.included ? 'opacity-50 bg-gray-100' : 'legal-card'
              } legal-shadow hover:shadow-lg relative`}
            >
              {/* Relevancy Circle - Top Right */}
              <div className="absolute top-4 right-4 z-10">
                <RelevancyCircle relevancy={case_.relevancy} />
              </div>

              <CardHeader className="pb-4 pr-20">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Checkbox 
                        checked={case_.included}
                        onCheckedChange={() => toggleCaseInclusion(case_?.id ?? '')}
                        className="mt-1"
                      />
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {case_?.name}
                      </CardTitle>
                      <Badge className={getOutcomeColor(case_?.outcome ?? '')}>
                        {case_?.outcome}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 ml-8">
                      <div className="flex items-center text-sm text-gray-500">
                        <Scale className="h-4 w-4 mr-1" />
                        {case_?.court}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {case_?.year}
                      </div>
                    </div>
                  </div>
                  {!case_.included && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCaseInclusion(case_?.id ?? '')}
                      className="text-gray-600 hover:text-black hover:bg-gray-100"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Excluded
                    </Button>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Citation */}
                <div className="text-sm text-gray-600 italic">
                  {case_?.citation}
                </div>

                {/* Key Quote */}
                <blockquote className="border-l-4 border-black pl-4 py-2 bg-gray-50 rounded-r-lg">
                  <p className="text-gray-700 italic">"{case_?.keyQuote}"</p>
                </blockquote>

                {/* Why Similar */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Why This Case is Similar:</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {case_?.whySimilar?.substring(0, 250)}...
                  </p>
                </div>

                {/* Case Result Highlight */}
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-black mb-1">Case Result</h4>
                  <p className="text-sm text-gray-700">
                    The court <strong>{case_?.outcome?.toLowerCase()}</strong> the motion because{' '}
                    {case_?.outcome === 'Granted' 
                      ? 'the defendant successfully demonstrated that the reasonable consumer standard requires consideration of full product labeling, including back-panel disclosures.'
                      : case_?.outcome === 'Denied'
                      ? 'the plaintiff provided sufficient evidence that front-label claims could mislead consumers despite back-panel corrections.'
                      : 'certain claims warranted dismissal while others required further factual development at discovery.'}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center space-x-2"
                    onClick={() => window.open(case_?.fullOpinionUrl, '_blank')}
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>Show Source</span>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCaseInclusion(case_?.id ?? '')}
                    className={case_.included ? 'text-gray-600 hover:text-black' : 'text-black hover:text-gray-600'}
                  >
                    {case_.included ? 'Remove from Analysis' : 'Include in Analysis'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <Button 
            variant="outline" 
            onClick={() => router.push('/intake')}
          >
            Back to Case Intake
          </Button>
          <div className="text-sm text-gray-600">
            {filteredCases.filter(c => c.included).length} of {filteredCases?.length ?? 0} cases selected
          </div>
          <Button 
            onClick={() => router.push('/strategy')}
            className="legal-gradient text-white"
          >
            Develop Strategy
          </Button>
        </div>
      </div>
    </>
  );
}
