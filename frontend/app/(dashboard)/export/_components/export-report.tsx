
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

export function ExportReport() {
  const router = useRouter();
  const [exportData, setExportData] = useState<ExportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Generate export data based on simulation results
    const caseData = JSON.parse(localStorage.getItem('legalCase') || '{}');
    const recommendedStrategy = mockStrategies[0];
    
    const data: ExportData = {
      caseSummary: `Motion to Dismiss for Consumer False Advertising Case in ${caseData.jurisdiction || 'EDNY/SDNY'}. 
      
      Case Facts: ${caseData.facts || 'Product labeling case involving front-label claims and back-panel disclosures.'}
      
      Posture: ${caseData.posture || 'Motion to Dismiss (MTD)'}
      
      Opposing Party: ${caseData.opposingCounsel || 'State Attorney General'}`,
      
      recommendedStrategy: recommendedStrategy,
      
      supportingArguments: [
        {
          point: 'Reasonable Consumer Standard Application',
          citations: ['Mantikas v. Kellogg Co., 832 F. Supp. 2d 304 (S.D.N.Y. 2011)'],
          analysis: 'Under the reasonable consumer standard established in Mantikas, courts must consider the full context of product labeling, including back-panel disclosures that provide complete ingredient information.'
        },
        {
          point: 'Context Cures Misleading Labeling',
          citations: ['Jessani v. Monini North America, 110 F. Supp. 3d 522 (S.D.N.Y. 2015)'],
          analysis: 'The back-panel ingredient listing and nutritional information cure any potential ambiguity from front-label claims, as the reasonable consumer would consider all available product information.'
        },
        {
          point: 'Lack of Economic Injury',
          citations: ['Fink v. Time Warner Cable, 714 F.3d 738 (2d Cir. 2013)'],
          analysis: 'Plaintiff must demonstrate they paid a price premium attributable to the alleged misrepresentation. Without evidence of premium pricing, economic injury cannot be established.'
        }
      ],
      
      riskAnalysis: 'Moderate risk strategy with strong precedential support. Primary risk factors include potential consumer survey evidence and judge\'s receptivity to context defenses. Simulation results suggest 70-80% success probability based on digital twin analysis.',
      
      keyPrecedents: mockSimilarCases.slice(0, 3)
    };
    
    setExportData(data);
  }, []);

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      const { jsPDF } = await import('jspdf');
      
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const lineHeight = 7;
      let yPosition = 30;

      const addText = (text: string, x: number, y: number, maxWidth: number, fontSize = 12) => {
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

      // Case Summary
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('I. CASE SUMMARY', margin, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      yPosition += addText(exportData?.caseSummary || '', margin, yPosition, pageWidth - 2 * margin);
      yPosition += 10;

      // Strategy Outline
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('II. RECOMMENDED STRATEGY', margin, yPosition);
      yPosition += 10;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(exportData?.recommendedStrategy?.name || '', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      yPosition += addText(exportData?.recommendedStrategy?.summary || '', margin, yPosition, pageWidth - 2 * margin);
      yPosition += 10;

      // Supporting Arguments
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('III. SUPPORTING ARGUMENTS', margin, yPosition);
      yPosition += 10;

      exportData?.supportingArguments?.forEach((arg, index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 30;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${arg.point}`, margin, yPosition);
        yPosition += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        yPosition += addText(`Citations: ${arg.citations.join('; ')}`, margin + 5, yPosition, pageWidth - 2 * margin - 5);
        yPosition += 5;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        yPosition += addText(arg.analysis, margin + 5, yPosition, pageWidth - 2 * margin - 5);
        yPosition += 8;
      });

      // Risk Analysis
      if (yPosition > 220) {
        doc.addPage();
        yPosition = 30;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('IV. RISK ANALYSIS', margin, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      yPosition += addText(exportData?.riskAnalysis || '', margin, yPosition, pageWidth - 2 * margin);
      yPosition += 10;

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
    if (!exportData) return;

    const textContent = `
LEGAL STRATEGY MEMORANDUM

I. CASE SUMMARY
${exportData.caseSummary}

II. RECOMMENDED STRATEGY
${exportData.recommendedStrategy?.name}
${exportData.recommendedStrategy?.summary}

III. SUPPORTING ARGUMENTS
${exportData.supportingArguments?.map((arg, index) => 
  `${index + 1}. ${arg.point}
  Citations: ${arg.citations.join('; ')}
  Analysis: ${arg.analysis}`
).join('\n\n')}

IV. RISK ANALYSIS
${exportData.riskAnalysis}

Generated by Legal Strategy Platform
    `.trim();

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

  if (!exportData) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin h-12 w-12 border-4 border-black border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Preparing your strategy report...</p>
        </div>
      </div>
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

                  <h2>I. Case Summary</h2>
                  <p className="mb-6">{exportData.caseSummary}</p>

                  <h2>II. Recommended Strategy</h2>
                  <h3 className="font-semibold mb-2">{exportData.recommendedStrategy?.name}</h3>
                  <p className="mb-6">{exportData.recommendedStrategy?.summary}</p>

                  <h2>III. Supporting Arguments</h2>
                  <div className="space-y-4 mb-6">
                    {exportData.supportingArguments?.map((arg, index) => (
                      <div key={index}>
                        <h3 className="font-semibold">{index + 1}. {arg.point}</h3>
                        <p className="citation text-sm mb-2">Citations: {arg.citations.join('; ')}</p>
                        <p>{arg.analysis}</p>
                      </div>
                    ))}
                  </div>

                  <h2>IV. Risk Analysis</h2>
                  <p className="mb-6">{exportData.riskAnalysis}</p>
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
