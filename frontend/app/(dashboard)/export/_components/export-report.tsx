
"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressHeader } from '@/components/layout/progress-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockStrategies, mockSimilarCases } from '@/lib/mock-data';
import { ExportData } from '@/lib/types';
import { 
  Download, 
  FileText, 
  Copy,
  CheckCircle,
  Scale,
  BookOpen,
  AlertCircle,
  Share2,
  FileCheck,
  GitBranch,
  Quote
} from 'lucide-react';
import { LegalLoading } from '@/components/ui/legal-loading';

export function ExportReport() {
  const router = useRouter();
  const [exportData, setExportData] = useState<ExportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [memorandum, setMemorandum] = useState<string>('');
  const [isLoadingMemo, setIsLoadingMemo] = useState(true);
  const [bestStrategy, setBestStrategy] = useState<any>(null);

  useEffect(() => {
    generateMemorandum();
  }, []);

  const generateMemorandum = async () => {
    try {
      setIsLoadingMemo(true);
      
      // Load data from localStorage
      const caseData = JSON.parse(localStorage.getItem('legalCase') || '{}');
      const simulationResults = JSON.parse(localStorage.getItem('simulationResults') || '[]');
      
      if (simulationResults.length === 0) {
        // No simulation results, redirect back
        router.push('/simulation');
        return;
      }
      
      // Call backend to generate memorandum
      const response = await fetch('http://localhost:5000/api/generate-memorandum', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          simulationResults: simulationResults,
          caseFacts: caseData.facts || ''
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMemorandum(result.memorandum);
        setBestStrategy(result.bestStrategy);
        
        // Parse memorandum into structured data for backward compatibility
        const data: ExportData = {
          caseSummary: caseData.facts || 'Case facts not available',
          recommendedStrategy: {
            name: result.bestStrategy.title,
            summary: `This strategy achieved an average score of ${result.bestStrategy.averageScore.toFixed(1)}/10 across ${result.bestStrategy.totalRuns} simulations, winning ${result.bestStrategy.winsCount} times.`
          },
          supportingArguments: [],
          riskAnalysis: `Based on ${result.bestStrategy.totalRuns} AI simulations, this strategy has a ${((result.bestStrategy.winsCount / result.bestStrategy.totalRuns) * 100).toFixed(0)}% success rate.`,
          keyPrecedents: []
        };
        
        setExportData(data);
      } else {
        alert(`Failed to generate memorandum: ${result.error}`);
        router.push('/simulation');
      }
    } catch (error) {
      console.error('Error generating memorandum:', error);
      alert('Failed to generate memorandum. Please try again.');
      router.push('/simulation');
    } finally {
      setIsLoadingMemo(false);
    }
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      const { jsPDF } = await import('jspdf');
      
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const lineHeight = 7;
      let yPosition = 30;

      const addText = (text: string, x: number, y: number, maxWidth: number, fontSize = 11) => {
        doc.setFontSize(fontSize);
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y);
        return lines.length * lineHeight;
      };

      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('LEGAL STRATEGY MEMORANDUM', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Add AI-generated memorandum content
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      const memorandumLines = memorandum.split('\n');
      
      for (const line of memorandumLines) {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 30;
        }
        
        // Check if line is a heading (starts with number or all caps)
        if (line.match(/^(I{1,3}V?|VI{0,3}|\d+\.)\s/) || line === line.toUpperCase() && line.length < 50 && line.length > 0) {
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          yPosition += addText(line, margin, yPosition, pageWidth - 2 * margin, 12);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(11);
        } else if (line.trim().length > 0) {
          yPosition += addText(line, margin, yPosition, pageWidth - 2 * margin);
        } else {
          yPosition += lineHeight;
        }
      }
      
      // Add simulation summary
      if (bestStrategy) {
        if (yPosition > 240) {
          doc.addPage();
          yPosition = 30;
        }
        
        yPosition += 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('SIMULATION RESULTS SUMMARY', margin, yPosition);
        yPosition += 10;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        yPosition += addText(`Best Strategy: ${bestStrategy.title}`, margin, yPosition, pageWidth - 2 * margin, 10);
        yPosition += addText(`Average Score: ${bestStrategy.averageScore.toFixed(1)}/10`, margin, yPosition, pageWidth - 2 * margin, 10);
        yPosition += addText(`Defense Wins: ${bestStrategy.winsCount}/${bestStrategy.totalRuns} (${((bestStrategy.winsCount / bestStrategy.totalRuns) * 100).toFixed(0)}%)`, margin, yPosition, pageWidth - 2 * margin, 10);
      }

      // Footer
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.text(
          `Generated by Legal Strategy Platform - Page ${i} of ${totalPages}`, 
          pageWidth / 2, 
          280, 
          { align: 'center' }
        );
      }

      doc.save('legal-strategy-memo.pdf');
    } catch (error) {
      console.error('PDF generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!memorandum) return;

    let textContent = `LEGAL STRATEGY MEMORANDUM\n\n${memorandum}`;
    
    if (bestStrategy) {
      textContent += `\n\n\nSIMULATION RESULTS SUMMARY\n`;
      textContent += `Best Strategy: ${bestStrategy.title}\n`;
      textContent += `Average Score: ${bestStrategy.averageScore.toFixed(1)}/10\n`;
      textContent += `Defense Wins: ${bestStrategy.winsCount}/${bestStrategy.totalRuns} (${((bestStrategy.winsCount / bestStrategy.totalRuns) * 100).toFixed(0)}%)\n`;
    }
    
    textContent += '\n\nGenerated by Legal Strategy Platform';

    await navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReport = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Legal Strategy Report',
          text: 'Generated strategy memorandum for motion to dismiss',
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert('URL copied to clipboard!');
    }
  };

  const loadingMessages = [
    "Analyzing simulation outcomes…",
    "Synthesizing legal recommendations…",
    "Drafting strategy memorandum…",
    "Compiling precedent analysis…",
    "Finalizing comprehensive report…"
  ];

  if (isLoadingMemo || !exportData) {
    return (
      <>
        <ProgressHeader 
          currentStep={6} 
          title="Export Strategy Report" 
          description="Generating AI-powered legal strategy memorandum"
        />
        <div className="max-w-4xl mx-auto p-6">
          <LegalLoading messages={loadingMessages} duration={12500} />
        </div>
      </>
    );
  }

  return (
    <>
      <ProgressHeader 
        currentStep={6} 
        title="Export Strategy Report" 
        description="Generate and download your comprehensive legal strategy memorandum"
      />
      
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Report Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Document Preview */}
            <Card className="legal-card legal-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <FileText className="h-6 w-6 text-black" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-black">Strategy Memorandum</CardTitle>
                      <CardDescription>
                        Comprehensive legal strategy based on AI analysis
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-black text-white border-black">
                    Ready for Export
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="pdf-preview legal-document p-6 bg-white border rounded-lg max-h-96 overflow-y-auto">
                  <h1 className="text-center mb-8">Legal Strategy Memorandum</h1>
                  
                  {/* Display AI-generated memorandum */}
                  <div className="memorandum-content whitespace-pre-wrap">
                    {memorandum}
                  </div>
                  
                  {/* Best Strategy Info */}
                  {bestStrategy && (
                    <div className="mt-8 p-4 bg-gray-50 border rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">Simulation Results Summary</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Best Strategy:</span>
                          <p className="font-medium">{bestStrategy.title}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Average Score:</span>
                          <p className="font-medium">{bestStrategy.averageScore.toFixed(1)}/10</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Defense Wins:</span>
                          <p className="font-medium">{bestStrategy.winsCount}/{bestStrategy.totalRuns}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Success Rate:</span>
                          <p className="font-medium">{((bestStrategy.winsCount / bestStrategy.totalRuns) * 100).toFixed(0)}%</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Strategy Outline Explanations */}
            <Card className="legal-card legal-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center text-black">
                  <BookOpen className="h-5 w-5 mr-2 text-black" />
                  Detailed Strategy Explanation
                </CardTitle>
                <CardDescription>
                  Each argument supported by case law and evidence
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {exportData.supportingArguments?.map((arg, index) => (
                  <div key={index} className="p-4 border border-gray-300 rounded-lg bg-gray-50">
                    <h4 className="font-semibold text-gray-900 mb-3">{index + 1}. {arg.point}</h4>
                    
                    <div className="space-y-3">
                      {/* Case Support */}
                      <div className="bg-white border-l-4 border-black p-3 rounded">
                        <div className="flex items-start space-x-2">
                          <Scale className="h-4 w-4 text-black flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-black mb-1">Case Support:</p>
                            <p className="text-sm text-gray-700">
                              <span className="font-medium italic">{arg.citations[0]}</span> establishes that {arg.analysis}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Evidence Support */}
                      <div className="bg-white border-l-4 border-gray-600 p-3 rounded">
                        <div className="flex items-start space-x-2">
                          <FileCheck className="h-4 w-4 text-gray-700 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-gray-900 mb-1">Evidence Required:</p>
                            <p className="text-sm text-gray-700">
                              {index === 0 
                                ? 'Product packaging, ingredient lists, and marketing materials demonstrating back-panel disclosures'
                                : index === 1
                                ? 'Complete product labeling showing context that cures any ambiguity'
                                : 'Pricing analysis showing no premium charged for challenged claims'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Highlighted Snippet */}
                      <div className="bg-gray-100 border-l-4 border-black p-3 rounded">
                        <div className="flex items-start space-x-2">
                          <Quote className="h-4 w-4 text-black flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-medium text-black mb-1">Key Passage:</p>
                            <p className="text-sm text-gray-700 italic">
                              "{index === 0 
                                ? 'A reasonable consumer does not view a product label in isolation, but rather considers the product as a whole, including all available information.'
                                : index === 1
                                ? 'Context provided by other parts of the label can cure any misleading impression created by isolated statements.'
                                : 'Without evidence of a price premium, plaintiffs cannot establish they suffered economic harm from the alleged misrepresentation.'}"
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Further Actions */}
            <Card className="legal-card legal-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center text-black">
                  <FileCheck className="h-5 w-5 mr-2 text-black" />
                  Further Actions Required
                </CardTitle>
                <CardDescription>
                  Documents and steps needed for next phases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded border border-gray-300">
                    <CheckCircle className="h-5 w-5 text-black flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Motion to Dismiss Brief</h4>
                      <p className="text-sm text-gray-700">Draft and file comprehensive MTD brief incorporating strategy arguments (Due: 21 days before hearing)</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded border border-gray-300">
                    <CheckCircle className="h-5 w-5 text-black flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Declaration of Counsel</h4>
                      <p className="text-sm text-gray-700">Prepare declaration with exhibits showing product labeling and packaging materials</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded border border-gray-300">
                    <CheckCircle className="h-5 w-5 text-black flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Oral Argument Outline</h4>
                      <p className="text-sm text-gray-700">Create detailed outline for oral argument incorporating judge's preferences from digital twin analysis</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-gray-100 rounded border border-gray-400">
                    <AlertCircle className="h-5 w-5 text-gray-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Contingency: Discovery Plan</h4>
                      <p className="text-sm text-gray-700">If MTD is denied, prepare discovery requests focused on plaintiff's reliance and damages (to be filed within 30 days of ruling)</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-3 bg-gray-100 rounded border border-gray-400">
                    <AlertCircle className="h-5 w-5 text-gray-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Expert Appraisal</h4>
                      <p className="text-sm text-gray-700">If case proceeds, retain consumer survey expert to rebut plaintiff's reliance claims</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Export Controls */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Export Actions */}
              <Card className="legal-card legal-shadow sticky top-6">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center text-black">
                    <Download className="h-5 w-5 mr-2 text-black" />
                    Export Options
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={generatePDF}
                    disabled={isGenerating}
                    className="w-full legal-gradient text-white"
                  >
                    {isGenerating ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        <span>Generating PDF...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Download className="h-4 w-4" />
                        <span>Download PDF</span>
                      </div>
                    )}
                  </Button>

                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    className="w-full"
                  >
                    {copied ? (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-black" />
                        <span>Copied!</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Copy className="h-4 w-4" />
                        <span>Copy Text</span>
                      </div>
                    )}
                  </Button>

                  <Button
                    onClick={shareReport}
                    variant="outline"
                    className="w-full"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <Button 
            variant="outline" 
            onClick={() => router.push('/simulation')}
          >
            Back to Simulation
          </Button>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Scale className="h-4 w-4" />
            <span>Strategy analysis complete</span>
          </div>
          <Button 
            onClick={() => router.push('/intake')}
            variant="outline"
          >
            Start New Case
          </Button>
        </div>
      </div>
    </>
  );
}
