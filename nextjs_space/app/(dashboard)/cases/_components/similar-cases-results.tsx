
"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressHeader } from '@/components/layout/progress-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { mockSimilarCases } from '@/lib/mock-data';
import { SimilarCase } from '@/lib/types';
import { 
  Search, 
  Pin, 
  ThumbsUp, 
  ThumbsDown, 
  ExternalLink, 
  Target,
  Scale,
  Calendar,
  BookOpen,
  Filter
} from 'lucide-react';

export function SimilarCasesResults() {
  const router = useRouter();
  const [cases, setCases] = useState<SimilarCase[]>(mockSimilarCases);
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
                         case_?.issues?.some(issue => issue?.toLowerCase()?.includes(searchTerm?.toLowerCase() ?? '')) ||
                         case_?.keyQuote?.toLowerCase()?.includes(searchTerm?.toLowerCase() ?? '');
    const matchesOutcome = selectedOutcome === 'all' || case_?.outcome === selectedOutcome;
    return matchesSearch && matchesOutcome;
  });

  const handlePinCase = (caseId: string) => {
    setCases(prev => prev.map(case_ => 
      case_?.id === caseId 
        ? { ...case_, isPinned: !case_?.isPinned }
        : case_
    ));
  };

  const handleMarkHelpful = (caseId: string, helpful: boolean) => {
    setCases(prev => prev.map(case_ => 
      case_?.id === caseId 
        ? { ...case_, isHelpful: helpful }
        : case_
    ));
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'Granted': return 'bg-green-100 text-green-800 border-green-200';
      case 'Denied': return 'bg-red-100 text-red-800 border-red-200';
      case 'Mixed': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Dismissed': return 'bg-blue-100 text-blue-800 border-blue-200';
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
            <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
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
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Search className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Case Research Results</CardTitle>
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
                    placeholder="Search cases, issues, or quotes..."
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
                case_?.isPinned ? 'ring-2 ring-blue-500 bg-blue-50/30' : 'legal-card'
              } legal-shadow hover:shadow-lg`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {case_?.name}
                      </CardTitle>
                      <Badge className={getOutcomeColor(case_?.outcome ?? '')}>
                        {case_?.outcome}
                      </Badge>
                      <div className="flex items-center text-sm text-gray-500">
                        <Scale className="h-4 w-4 mr-1" />
                        {case_?.court}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {case_?.year}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mb-3">
                      <Target className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-600">
                        {case_?.confidenceScore}% Match
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePinCase(case_?.id ?? '')}
                      className={case_?.isPinned ? 'text-blue-600' : 'text-gray-400'}
                    >
                      <Pin className={`h-4 w-4 ${case_?.isPinned ? 'fill-current' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkHelpful(case_?.id ?? '', true)}
                      className={case_?.isHelpful === true ? 'text-green-600' : 'text-gray-400'}
                    >
                      <ThumbsUp className={`h-4 w-4 ${case_?.isHelpful === true ? 'fill-current' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkHelpful(case_?.id ?? '', false)}
                      className={case_?.isHelpful === false ? 'text-red-600' : 'text-gray-400'}
                    >
                      <ThumbsDown className={`h-4 w-4 ${case_?.isHelpful === false ? 'fill-current' : ''}`} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Citation */}
                <div className="text-sm text-gray-600 italic">
                  {case_?.citation}
                </div>

                {/* Key Quote */}
                <blockquote className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50/50 rounded-r-lg">
                  <p className="text-gray-700 italic">"{case_?.keyQuote}"</p>
                </blockquote>

                {/* Issues */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Key Issues:</h4>
                  <div className="flex flex-wrap gap-2">
                    {case_?.issues?.map((issue, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {issue}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Strategy Tags */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Strategy Tags:</h4>
                  <div className="flex flex-wrap gap-2">
                    {case_?.strategyTags?.map((tag, index) => (
                      <Badge key={index} className="bg-purple-100 text-purple-800 border-purple-200">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Why Similar */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Why This Case is Similar:</h4>
                  <p className="text-sm text-gray-700">{case_?.whySimilar}</p>
                </div>

                {/* Matched Facts */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Matched Facts:</h4>
                  <div className="flex flex-wrap gap-2">
                    {case_?.matchedFacts?.map((fact, index) => (
                      <Badge key={index} variant="secondary" className="text-xs bg-green-100 text-green-800">
                        {fact}
                      </Badge>
                    ))}
                  </div>
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
                    <span>Read Full Opinion</span>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                  <div className="text-xs text-gray-500">
                    Confidence: {case_?.confidenceScore}%
                  </div>
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
            Found {filteredCases?.length ?? 0} similar cases
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
