
"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressHeader } from '@/components/layout/progress-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Search, 
  ExternalLink, 
  Scale,
  Calendar,
  BookOpen,
  Filter,
  XCircle,
  User,
  Target
} from 'lucide-react';
import { LegalLoading } from '@/components/ui/legal-loading';

interface CaseData {
  id: string;
  caseName: string;
  date: string;
  judge: string;
  syllabus: string;
  court: string;
  url: string;
  included: boolean;
  distance?: number;
  certainty?: number;
}

export function SimilarCasesResults() {
  const router = useRouter();
  const [cases, setCases] = useState<CaseData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      setIsLoading(true);
      
      // First try to load from localStorage (from PDF upload)
      const storedCases = localStorage.getItem('similarCases');
      if (storedCases) {
        const parsedCases = JSON.parse(storedCases);
        console.log('Loaded cases from localStorage:', parsedCases);
        
        // Map Weaviate response format to CaseData format
        const formattedCases = parsedCases.map((c: any) => {
          const caseUrl = c.absolute_url || c.url || '';
          console.log('Case URL for', c.title || c.caseName, ':', caseUrl);
          
          return {
            id: c.case_id || c.id,
            caseName: c.title || c.caseName || 'Untitled Case',
            date: c.metadata?.dateFiled || c.date || 'Unknown Date',
            judge: c.judge || 'Unknown Judge',
            syllabus: c.body || c.syllabus || 'No description available',
            court: c.metadata?.court || c.court || 'Unknown Court',
            url: caseUrl,
            included: true,
            distance: c.distance,
            certainty: c.certainty
          };
        });
        
        console.log('Formatted cases:', formattedCases);
        setCases(formattedCases);
        setIsLoading(false);
        return;
      }
      
      // Fall back to API call if no localStorage data
      const response = await fetch('http://localhost:5000/api/similar-cases');
      const data = await response.json();
      
      if (data.success) {
        setCases(data.cases.map((c: any) => ({
          id: c.id,
          caseName: c.caseName,
          date: c.date,
          judge: c.judge,
          syllabus: c.syllabus,
          court: c.court,
          url: c.url,
          included: true
        })));
      } else {
        setError(data.error || 'Failed to fetch cases');
      }
    } catch (err) {
      setError('Failed to connect to backend server');
      console.error('Error fetching cases:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCases = cases.filter(case_ => {
    const matchesSearch = case_?.caseName?.toLowerCase()?.includes(searchTerm?.toLowerCase() ?? '') ||
                         case_?.syllabus?.toLowerCase()?.includes(searchTerm?.toLowerCase() ?? '') ||
                         case_?.judge?.toLowerCase()?.includes(searchTerm?.toLowerCase() ?? '');
    return matchesSearch;
  });

  const toggleCaseInclusion = (caseId: string) => {
    setCases(prev => prev.map(case_ => 
      case_?.id === caseId 
        ? { ...case_, included: !case_.included }
        : case_
    ));
  };

  const handleContinueToStrategy = () => {
    // Store selected cases in localStorage
    const selectedCases = cases.filter(c => c.included);
    localStorage.setItem('selectedCases', JSON.stringify(selectedCases));
    
    // Navigate immediately - strategy page will handle loading
    router.push('/strategy');
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
          <LegalLoading messages={["Searching legal databases and analyzing precedents..."]} duration={12500} />
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <ProgressHeader 
          currentStep={2} 
          title="Error Loading Cases" 
          description="Failed to retrieve similar cases"
        />
        <div className="max-w-7xl mx-auto p-6">
          <Card className="legal-card legal-shadow">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <Button onClick={fetchCases}>Retry</Button>
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
                onClick={handleContinueToStrategy}
                className="legal-gradient text-white"
                disabled={cases.filter(c => c.included).length === 0}
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
                    placeholder="Search cases, judges, or descriptions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
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
              } legal-shadow hover:shadow-lg`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Checkbox 
                        checked={case_.included}
                        onCheckedChange={() => toggleCaseInclusion(case_?.id ?? '')}
                        className="mt-1"
                      />
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {case_?.caseName}
                      </CardTitle>
                    </div>
                    <div className="flex items-center space-x-4 ml-8 flex-wrap gap-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <Scale className="h-4 w-4 mr-1" />
                        {case_?.court}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {case_?.date}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <User className="h-4 w-4 mr-1" />
                        Judge {case_?.judge}
                      </div>
                      {case_?.certainty !== undefined && (
                        <div className="flex items-center text-sm font-medium text-green-700 bg-green-50 px-2 py-1 rounded">
                          <Target className="h-4 w-4 mr-1" />
                          Match: {(case_.certainty * 100).toFixed(1)}%
                        </div>
                      )}
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
                {/* Case Description / Syllabus */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Case Summary:</h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {case_?.syllabus}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center space-x-2"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      console.log('Button clicked for case:', case_?.caseName);
                      console.log('Case URL:', case_?.url);
                      
                      const caseUrl = case_?.url;
                      
                      if (!caseUrl || caseUrl === '') {
                        console.error('No URL available for this case');
                        alert('No URL available for this case');
                        return;
                      }
                      
                      // Construct the full URL
                      let fullUrl: string;
                      if (caseUrl.startsWith('http://') || caseUrl.startsWith('https://')) {
                        fullUrl = caseUrl;
                      } else {
                        // Remove leading slash if present to avoid double slashes
                        const cleanPath = caseUrl.startsWith('/') ? caseUrl : `/${caseUrl}`;
                        fullUrl = `https://www.courtlistener.com${cleanPath}`;
                      }
                      
                      console.log('Opening URL:', fullUrl);
                      window.open(fullUrl, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    <BookOpen className="h-4 w-4" />
                    <span>View Full Case</span>
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
            {cases.filter(c => c.included).length} of {cases?.length ?? 0} cases selected
          </div>
          <Button 
            onClick={handleContinueToStrategy}
            className="legal-gradient text-white"
            disabled={cases.filter(c => c.included).length === 0}
          >
            Develop Strategy
          </Button>
        </div>
      </div>
    </>
  );
}
