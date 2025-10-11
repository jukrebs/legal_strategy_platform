
"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressHeader } from '@/components/layout/progress-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { mockStrategies, mockSimilarCases } from '@/lib/mock-data';
import { ExportData } from '@/lib/types';
import { 
  Download, 
  FileText, 
  Eye,
  Copy,
  CheckCircle,
  Scale,
  BookOpen,
  Target,
  AlertTriangle,
  Share2
} from 'lucide-react';
// No dynamic import needed for jsPDF in client components

export function ExportReport() {
  const router = useRouter();
  const [exportData, setExportData] = useState<ExportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [customNotes, setCustomNotes] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Generate export data based on simulation results
    const caseData = JSON.parse(localStorage.getItem('legalCase') || '{}');
    const recommendedStrategy = mockStrategies[0]; // Use first strategy as recommended
    
    const data: ExportData = {
      caseSummary: `Motion to Dismiss for Consumer False Advertising Case in ${caseData.jurisdiction || 'EDNY/SDNY'}. 
      
      Case Facts: ${caseData.facts || 'Product labeling case involving front-label claims and back-panel disclosures.'}
      
      Posture: ${caseData.posture || 'Motion to Dismiss (MTD)'}
      
      Opposing Counsel: ${caseData.opposingCounsel || 'Miller & Associates LLP'}`,
      
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
      // Dynamic import to avoid SSR issues
      const { jsPDF } = await import('jspdf');
      
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const lineHeight = 7;
      let yPosition = 30;

      // Helper function to add text with word wrapping
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

      // Case Summary Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('I. CASE SUMMARY', margin, yPosition);
      yPosition += 10;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      yPosition += addText(exportData?.caseSummary || '', margin, yPosition, pageWidth - 2 * margin);
      yPosition += 10;

      // Recommended Strategy Section
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

      // Supporting Arguments Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('III. SUPPORTING ARGUMENTS', margin, yPosition);
      yPosition += 10;

      exportData?.supportingArguments?.forEach((arg, index) => {
        if (yPosition > 250) { // Add new page if needed
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

      // Risk Analysis Section
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

      // Custom Notes Section
      if (customNotes.trim()) {
        if (yPosition > 220) {
          doc.addPage();
          yPosition = 30;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('V. ADDITIONAL NOTES', margin, yPosition);
        yPosition += 10;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        yPosition += addText(customNotes, margin, yPosition, pageWidth - 2 * margin);
      }

      // Footer
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Generated by Legal Strategy Platform - Page ${i} of ${totalPages}`, 
          pageWidth / 2, 
          280, 
          { align: 'center' }
        );
      }

      // Save the PDF
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

${customNotes.trim() ? `V. ADDITIONAL NOTES\n${customNotes}` : ''}

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
      // Fallback to copy URL
      await navigator.clipboard.writeText(window.location.href);
      alert('URL copied to clipboard!');
    }
  };

  if (!exportData) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
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
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Strategy Memorandum</CardTitle>
                      <CardDescription>
                        Comprehensive legal strategy based on AI analysis
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800 border-green-200">
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

                  {customNotes.trim() && (
                    <>
                      <h2>V. Additional Notes</h2>
                      <p className="mb-6">{customNotes}</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Key Precedents */}
            <Card className="legal-card legal-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-purple-600" />
                  Key Precedents Referenced
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {exportData.keyPrecedents?.map((case_, index) => (
                    <div key={index} className="p-3 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="font-medium text-gray-900">{case_?.name}</div>
                      <div className="text-sm text-gray-600 italic">{case_?.citation}</div>
                      <div className="text-sm text-gray-700 mt-1">{case_?.whySimilar}</div>
                    </div>
                  ))}
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
                  <CardTitle className="text-lg flex items-center">
                    <Download className="h-5 w-5 mr-2 text-green-600" />
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
                        <CheckCircle className="h-4 w-4 text-green-600" />
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

              {/* Custom Notes */}
              <Card className="legal-card legal-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">Additional Notes</CardTitle>
                  <CardDescription>
                    Add custom notes to include in the final report
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Label htmlFor="notes">Custom Notes</Label>
                    <Textarea
                      id="notes"
                      value={customNotes}
                      onChange={(e) => setCustomNotes(e.target.value)}
                      placeholder="Add any additional observations, client-specific considerations, or next steps..."
                      rows={6}
                      className="text-sm"
                    />
                    <p className="text-xs text-gray-600">
                      These notes will be included in Section V of your exported document.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Report Statistics */}
              <Card className="legal-card legal-shadow">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Target className="h-5 w-5 mr-2 text-blue-600" />
                    Report Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Strategies Analyzed:</span>
                    <span className="font-medium">3</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Cases Reviewed:</span>
                    <span className="font-medium">5</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Simulation Rounds:</span>
                    <span className="font-medium">3</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Success Probability:</span>
                    <span className="font-medium text-green-600">75%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Risk Level:</span>
                    <span className="font-medium text-yellow-600">Moderate</span>
                  </div>
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
