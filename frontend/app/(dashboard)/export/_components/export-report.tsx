"use client"

import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import { useRouter } from 'next/navigation';
import { ProgressHeader } from '@/components/layout/progress-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CaseIntake, ExportData } from '@/lib/types';
import { 
  Download, 
  FileText, 
  Copy,
  CheckCircle,
  Scale,
  BookOpen,
  AlertTriangle,
  Share2,
  Quote,
  Layers,
  Sparkles,
  Target,
  TrendingUp
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { LegalLoading } from '@/components/ui/legal-loading';

type StoredStrategyRun = {
  score?: number;
  variation?: string;
  defenseArgument?: string;
  judgmentSummary?: string;
  evaluation?: {
    rationale?: string;
    strengths?: string[];
    weaknesses?: string[];
  };
};

type StoredStrategy = {
  strategyId?: string;
  strategyTitle?: string;
  runs?: StoredStrategyRun[];
  averageScore?: number;
  winsCount?: number;
};

type StrategySummary = {
  id: string;
  title: string;
  averageScore: number;
  winsCount: number;
  totalRuns: number;
  successRate: number;
  bestRun: StoredStrategyRun | null;
  strengths: string[];
  weaknesses: string[];
  keyInsight: string;
};

type StatCard = {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
};

const truncate = (value: string, limit = 220) => {
  if (!value) {
    return '';
  }
  if (value.length <= limit) {
    return value;
  }
  return `${value.slice(0, limit - 1)}…`;
};

const buildStrategySummaries = (strategies: StoredStrategy[]): StrategySummary[] => {
  return strategies
    .map<StrategySummary | null>((strategy, index) => {
      if (!strategy || typeof strategy !== 'object') {
        return null;
      }

      const runs = Array.isArray(strategy.runs)
        ? strategy.runs.filter((run) => run && typeof run === 'object')
        : [];

      const sortedRuns = runs
        .slice()
        .sort((a, b) => ((b?.score ?? 0) - (a?.score ?? 0)));

      const bestRun = sortedRuns[0] ?? null;
      const totalRuns = runs.length;
      const winsCount = typeof strategy.winsCount === 'number'
        ? strategy.winsCount
        : runs.filter((run) => (run?.score ?? 0) >= 7).length;
      const averageScore = typeof strategy.averageScore === 'number'
        ? strategy.averageScore
        : (runs.reduce((sum, run) => sum + (run?.score ?? 0), 0) / (totalRuns || 1));

      const strengths = (bestRun?.evaluation?.strengths || [])
        .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        .slice(0, 3);

      const weaknesses = (bestRun?.evaluation?.weaknesses || [])
        .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        .slice(0, 3);

      const rationale = (bestRun?.evaluation?.rationale || '').trim();
      const defenseLine = (bestRun?.defenseArgument || '')
        .split('\n')
        .map((line) => line.trim())
        .find((line) => line.length > 0) || '';
      const judgmentLine = (bestRun?.judgmentSummary || '')
        .split('\n')
        .map((line) => line.trim())
        .find((line) => line.length > 0) || '';

      const keyInsight = truncate(rationale || defenseLine || judgmentLine);

      return {
        id: strategy.strategyId ?? strategy.strategyTitle ?? `strategy-${index}`,
        title: strategy.strategyTitle ?? 'Unnamed Strategy',
        averageScore,
        winsCount,
        totalRuns,
        successRate: totalRuns > 0 ? winsCount / totalRuns : 0,
        bestRun,
        strengths,
        weaknesses,
        keyInsight,
      };
    })
    .filter((summary): summary is StrategySummary => Boolean(summary))
    .sort((a, b) => {
      if (b.averageScore !== a.averageScore) {
        return b.averageScore - a.averageScore;
      }
      return b.successRate - a.successRate;
    });
};

export function ExportReport() {
  const router = useRouter();
  const [exportData, setExportData] = useState<ExportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [memorandum, setMemorandum] = useState<string>('');
  const [isLoadingMemo, setIsLoadingMemo] = useState(true);
  const [bestStrategy, setBestStrategy] = useState<any>(null);
  const [strategySummaries, setStrategySummaries] = useState<StrategySummary[]>([]);
  const [caseDetails, setCaseDetails] = useState<Partial<CaseIntake> | null>(null);
  const pdfContentRef = useRef<HTMLDivElement>(null);

  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date()),
    []
  );

  const memoSubject = useMemo(() => {
    if (!caseDetails) {
      return 'Strategic Litigation Memorandum';
    }

    const descriptorParts = [
      caseDetails.caseType,
      caseDetails.posture ? `${caseDetails.posture} posture` : null,
    ]
      .filter(Boolean)
      .map((part) => String(part));

    if (descriptorParts.length === 0) {
      return 'Strategic Litigation Memorandum';
    }

    return `${descriptorParts.join(' — ')} Strategy Memorandum`;
  }, [caseDetails]);

  const bestStrategySnapshot = strategySummaries[0] ?? null;
  const alternativeStrategies = useMemo(
    () => strategySummaries.slice(1, 3),
    [strategySummaries]
  );
  const totalRuns = useMemo(
    () => strategySummaries.reduce((sum, strategy) => sum + strategy.totalRuns, 0),
    [strategySummaries]
  );

  const stats = useMemo<StatCard[]>(() => {
    if (!bestStrategySnapshot) {
      return [
        {
          label: 'Strategies Evaluated',
          value: '0',
          helper: 'No simulations recorded',
          icon: Layers,
        },
      ];
    }

    const topScore = bestStrategySnapshot.bestRun?.score ?? bestStrategySnapshot.averageScore;

    return [
      {
        label: 'Top Score',
        value: `${topScore.toFixed(1)}/10`,
        helper: bestStrategySnapshot.title,
        icon: Sparkles,
      },
      {
        label: 'Success Rate',
        value: `${Math.round(bestStrategySnapshot.successRate * 100)}%`,
        helper: `${bestStrategySnapshot.winsCount} of ${bestStrategySnapshot.totalRuns} runs`,
        icon: Target,
      },
      {
        label: 'Runs Analyzed',
        value: String(totalRuns),
        helper: `${strategySummaries.length} strategy${strategySummaries.length === 1 ? '' : 'ies'}`,
        icon: Layers,
      },
    ];
  }, [bestStrategySnapshot, strategySummaries.length, totalRuns]);

  const caseSnapshot = useMemo(() => {
    if (!caseDetails) {
      return [];
    }

    return [
      { label: 'Case Type', value: caseDetails.caseType },
      { label: 'Jurisdiction', value: caseDetails.jurisdiction },
      { label: 'Judge', value: caseDetails.judge },
      { label: 'Posture', value: caseDetails.posture },
    ].filter((item) => item.value && String(item.value).trim().length > 0);
  }, [caseDetails]);

  const strengthsList: string[] = Array.isArray(bestStrategy?.strengths) ? bestStrategy.strengths : [];
  const weaknessesList: string[] = Array.isArray(bestStrategy?.weaknesses) ? bestStrategy.weaknesses : [];
  const keyInsight = bestStrategySnapshot?.keyInsight || '';

  const markdownComponents = useMemo<Components>(
    () => ({
      a: (props) => (
        <a
          {...props}
          target="_blank"
          rel="noopener noreferrer"
        />
      ),
    }),
    []
  );

  const sanitizeMemorandum = useMemo<(content: string) => string>(() => {
    const removeExactMatches = new Set([
      'strategic memorandum',
      'legal strategy memorandum',
    ]);

    const removePrefixes = ['to:', 'from:', 'date:', 're:'];

    return (content: string) => {
      if (!content) return content;

      const normalized = content.replace(/\r\n/g, '\n').replace(/\u00a0/g, ' ').trimStart();
      const executiveMatch = normalized.match(/(^|\n)(#{1,6}\s*)?Executive Summary\b/i);

      let working = normalized;

      if (executiveMatch && executiveMatch.index !== undefined) {
        working = normalized.slice(executiveMatch.index).replace(/^\s+/, '');
      }

      const lines = working.split('\n');
      const cleanedLines: string[] = [];

      for (const rawLine of lines) {
        const line = rawLine;
        const strippedHeading = line.replace(/^#{1,6}\s*/, '');
        const plain = strippedHeading.replace(/[*_`~]/g, '').replace(/\[|\]/g, '').trim();
        const lower = plain.toLowerCase();

        if (!plain) {
          if (cleanedLines.length === 0 || cleanedLines[cleanedLines.length - 1].trim() === '') {
            continue;
          }
          cleanedLines.push('');
          continue;
        }

        if (removeExactMatches.has(lower)) {
          continue;
        }

        if (removePrefixes.some((prefix) => lower.startsWith(prefix))) {
          continue;
        }

        cleanedLines.push(line);
      }

      const finalText = cleanedLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
      return finalText || working;
    };
  }, []);

  const LegalMemorandumContent = () => (
    <div className="legal-document">
      <header className="legal-document__header">
        <div className="legal-document__letterhead">
          <div>
            <p className="legal-letterhead-title">Kanon Report</p>
            <p className="legal-letterhead-subtitle">Strategic Litigation Intelligence Unit</p>
          </div>
          <div className="legal-letterhead-meta">
            <p><span className="legal-label">Date:</span> {formattedDate}</p>
            {caseDetails?.jurisdiction && (
              <p><span className="legal-label">Jurisdiction:</span> {caseDetails.jurisdiction}</p>
            )}
            {caseDetails?.judge && (
              <p><span className="legal-label">Judge:</span> {caseDetails.judge}</p>
            )}
          </div>
        </div>
        <hr className="legal-divider" />
        <div className="legal-metadata">
          <p><span className="legal-label">To:</span> Litigation Team</p>
          <p><span className="legal-label">From:</span> Kanon</p>
          <p><span className="legal-label">Re:</span> {memoSubject}</p>
          {caseDetails?.opposingCounsel && (
            <p><span className="legal-label">Opposing Counsel:</span> {caseDetails.opposingCounsel}</p>
          )}
        </div>
      </header>

      <section className="legal-section">
        <h2>Strategic Memorandum</h2>
        <div className="legal-body">
          <ReactMarkdown components={markdownComponents}>
            {memorandum || '_The memorandum has not been generated._'}
          </ReactMarkdown>
        </div>
      </section>

      {bestStrategy && (
        <section className="legal-section">
          <h2>Simulation Results Summary</h2>
          <div className="legal-summary-grid">
            <div>
              <span className="legal-label">Best Strategy</span>
              <p>{bestStrategy.title}</p>
            </div>
            <div>
              <span className="legal-label">Average Score</span>
              <p>{bestStrategy.averageScore.toFixed(1)}/10</p>
            </div>
            <div>
              <span className="legal-label">Defense Wins</span>
              <p>{bestStrategy.winsCount}/{bestStrategy.totalRuns}</p>
            </div>
            <div>
              <span className="legal-label">Success Rate</span>
              <p>{((bestStrategy.winsCount / bestStrategy.totalRuns) * 100).toFixed(0)}%</p>
            </div>
          </div>
        </section>
      )}

      <footer className="legal-footer">
        <p className="legal-footer-note">
          This memorandum is privileged and confidential. It synthesizes AI-assisted strategy insights with legal analysis tailored to the provided case profile.
        </p>
        <p className="legal-footer-signoff">Prepared by Kanon</p>
      </footer>
    </div>
  );

  useEffect(() => {
    generateMemorandum();
  }, []);

  const generateMemorandum = async () => {
    try {
      setIsLoadingMemo(true);
      
      // Load data from localStorage
      const caseData = JSON.parse(localStorage.getItem('legalCase') || '{}');
      setCaseDetails(caseData);
      const simulationResults = JSON.parse(localStorage.getItem('simulationResults') || '[]');
      if (Array.isArray(simulationResults)) {
        setStrategySummaries(buildStrategySummaries(simulationResults as StoredStrategy[]));
      } else {
        setStrategySummaries([]);
      }
      
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
        const strategyWithInsights = simulationResults.find(
          (s: any) => s.strategyTitle === result.bestStrategy.title
        ) || simulationResults[0];
        
        const runWithInsights = strategyWithInsights?.runs?.find(
          (r: any) => {
            const variationMatch = r.variation === result.bestRun.variation;
            const scoreMatch = typeof result.bestRun.score === 'number'
              ? Math.abs((r.score || 0) - result.bestRun.score) < 0.01
              : true;
            return variationMatch && scoreMatch;
          }
        ) || strategyWithInsights?.runs?.[0];
        
        const evaluation = runWithInsights?.evaluation || {};
        const strengths: string[] = Array.isArray(evaluation?.strengths) ? evaluation.strengths : [];
        const weaknesses: string[] = Array.isArray(evaluation?.weaknesses) ? evaluation.weaknesses : [];
        const rationale = (evaluation?.rationale || '').trim() || (runWithInsights?.judgmentSummary || '');
        const defenseSnippet = (() => {
          const raw = (runWithInsights?.defenseArgument || '').split('\n').map((line: string) => line.trim()).filter(Boolean);
          return raw[0] || '';
        })();
        
        const supportingArguments = strengths.map((strength, idx) => ({
          point: strength,
          citations: [
            strategyWithInsights?.strategyTitle
              ? `${strategyWithInsights.strategyTitle} — ${runWithInsights?.variation || 'AI Simulation'}`
              : `Simulation Insight ${idx + 1}`
          ],
          analysis: defenseSnippet ? `${defenseSnippet}` : strength
        }));
        
        const riskBullet = weaknesses.length
          ? `Key vulnerabilities flagged: ${weaknesses.join('; ')}.`
          : '';
        const riskAnalysis = [
          `Based on ${result.bestStrategy.totalRuns} AI simulations, this strategy has a ${((result.bestStrategy.winsCount / result.bestStrategy.totalRuns) * 100).toFixed(0)}% success rate.`,
          riskBullet
        ].filter(Boolean).join(' ');
        
        setMemorandum(sanitizeMemorandum(result.memorandum));
        setBestStrategy({
          ...result.bestStrategy,
          rationale,
          strengths,
          weaknesses,
          variation: result.bestRun.variation
        });
        
        // Parse memorandum into structured data for backward compatibility
        const data: ExportData = {
          caseSummary: caseData.facts || 'Case facts not available',
          recommendedStrategy: {
            name: result.bestStrategy.title,
            summary: [
              `This strategy achieved an average score of ${result.bestStrategy.averageScore.toFixed(1)}/10 across ${result.bestStrategy.totalRuns} simulations, winning ${result.bestStrategy.winsCount} times.`,
              rationale ? `Evaluator highlight: ${rationale}` : ''
            ].filter(Boolean).join(' ')
          },
          supportingArguments,
          riskAnalysis,
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
    const content = pdfContentRef.current;

    if (!content) {
      console.error('PDF content reference not found');
      return;
    }

    setIsGenerating(true);
    
    try {
      const [{ jsPDF }, html2canvasModule] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ]);
      const html2canvas = html2canvasModule.default;

      const canvas = await html2canvas(content, {
        scale: 2,
        useCORS: true,
      });

      const imageData = canvas.toDataURL('image/png');

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'letter',
      });
      doc.setFont('times', 'normal');
      doc.setProperties({
        title: 'Kanon Legal Strategy Memorandum',
        subject: 'Comprehensive legal strategy generated by Kanon',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marginX = 56;
      const marginY = 64;
      const printableWidth = pageWidth - marginX * 2;
      const printableHeight = pageHeight - marginY * 2;

      const imgWidth = printableWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = marginY;

      doc.addImage(imageData, 'PNG', marginX, position, imgWidth, imgHeight);
      heightLeft -= printableHeight;

      while (heightLeft > 0) {
        doc.addPage();
        position = marginY - (imgHeight - heightLeft);
        doc.addImage(imageData, 'PNG', marginX, position, imgWidth, imgHeight);
        heightLeft -= printableHeight;
      }

      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i += 1) {
        doc.setPage(i);
        doc.setFont('times', 'italic');
        doc.setFontSize(9);
        doc.setTextColor(110);
        doc.text(
          `Confidential — Generated by Kanon · Page ${i} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 36,
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
    
    textContent += '\n\nGenerated by Kanon';

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
      
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="legal-card legal-shadow">
                <CardHeader className="pb-3">
                  <CardDescription className="uppercase tracking-wide text-xs text-gray-500">
                    {stat.label}
                  </CardDescription>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-semibold text-black">{stat.value}</span>
                    <Icon className="h-5 w-5 text-black" />
                  </div>
                  <p className="text-xs text-gray-600">{stat.helper}</p>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {caseSnapshot.length > 0 && (
          <Card className="legal-card legal-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-black">Case Snapshot</CardTitle>
              <CardDescription>Context pulled from your intake</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2">
                {caseSnapshot.map((item) => (
                  <div key={item.label} className="flex flex-col">
                    <span className="text-xs uppercase text-gray-500">{item.label}</span>
                    <span className="text-sm text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6 items-stretch">
          <Card className="legal-card legal-shadow lg:col-span-2 h-full flex flex-col">
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
            
            <CardContent className="flex-1 space-y-6">
              <div className="pdf-preview bg-white border rounded-lg max-h-96 overflow-y-auto">
                <div className="legal-document-container legal-document-preview">
                  <LegalMemorandumContent />
                </div>
              </div>

              <div
                aria-hidden="true"
                ref={pdfContentRef}
                className="legal-document-container legal-document--pdf"
                style={{
                  position: 'fixed',
                  left: '-10000px',
                  top: '-10000px',
                  width: '768px',
                  padding: 0,
                }}
              >
                <LegalMemorandumContent />
              </div>
            </CardContent>
          </Card>

          <Card className="legal-card legal-shadow h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg flex items-center text-black">
                <Download className="h-5 w-5 mr-2 text-black" />
                Export Options
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4">
              <Button onClick={generatePDF} disabled={isGenerating} className="w-full legal-gradient text-white">
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

              <Button onClick={copyToClipboard} variant="outline" className="w-full">
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

              <div className="mt-auto">
                <Button onClick={shareReport} variant="outline" className="w-full">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Report Content */}
          {bestStrategySnapshot && (
            <Card className="legal-card legal-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl text-black">{bestStrategySnapshot.title}</CardTitle>
                    <CardDescription>Top performer across the latest simulation batch</CardDescription>
                  </div>
                  <Badge className="bg-black text-white border-black">Primary pick</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase text-gray-500">Average Score</p>
                    <p className="text-2xl font-semibold text-black">
                      {bestStrategySnapshot.averageScore.toFixed(1)}
                      <span className="text-sm text-gray-500"> /10</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500">Success Rate</p>
                    <p className="text-2xl font-semibold text-black">
                      {Math.round(bestStrategySnapshot.successRate * 100)}%
                    </p>
                    <p className="text-xs text-gray-500">
                      {bestStrategySnapshot.winsCount} wins of {bestStrategySnapshot.totalRuns} runs
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase text-gray-500">Standout Run</p>
                    <p className="text-2xl font-semibold text-black">
                      {(bestStrategySnapshot.bestRun?.score ?? bestStrategySnapshot.averageScore).toFixed(1)}
                    </p>
                    {bestStrategySnapshot.bestRun?.variation && (
                      <p className="text-xs text-gray-500">{bestStrategySnapshot.bestRun.variation}</p>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-black">
                    <TrendingUp className="h-4 w-4" />
                    Key insight from the winning run
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {keyInsight || 'No qualitative insight captured for this run.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="legal-card legal-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-black">What Worked</CardTitle>
                <CardDescription>Signals that moved the judge</CardDescription>
              </CardHeader>
              <CardContent>
                {strengthsList.length > 0 ? (
                  <ul className="space-y-2 text-sm text-gray-700">
                    {strengthsList.map((item, index) => (
                      <li key={index} className="flex gap-2">
                        <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0 text-black" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No standout strengths captured.</p>
                )}
              </CardContent>
            </Card>

            <Card className="legal-card legal-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-black">Risks to Watch</CardTitle>
                <CardDescription>Where the argument lost traction</CardDescription>
              </CardHeader>
              <CardContent>
                {weaknessesList.length > 0 ? (
                  <ul className="space-y-2 text-sm text-gray-700">
                    {weaknessesList.map((item, index) => (
                      <li key={index} className="flex gap-2">
                        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-700" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No critical weaknesses detected.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recommended Strategy - Performance Analysis */}
          {bestStrategySnapshot && bestStrategySnapshot.totalRuns > 0 && (
            <Card className="legal-card legal-shadow border-2 border-black">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center text-black">
                      <Scale className="h-5 w-5 mr-2 text-black" />
                      Recommended Strategy: {bestStrategySnapshot.title}
                    </CardTitle>
                    <CardDescription>
                      Comparative analysis of three tactical approaches
                    </CardDescription>
                  </div>
                  <Badge className="bg-black text-white border-black">Primary Recommendation</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {strategySummaries[0]?.bestRun && (() => {
                  const strategy = strategySummaries[0];
                  const allRuns = JSON.parse(localStorage.getItem('simulationResults') || '[]')
                    .find((s: any) => s.strategyTitle === strategy.title)?.runs || [];
                  
                  // Sort runs by score descending
                  const sortedRuns = [...allRuns].sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
                  
                  return sortedRuns.map((run: any, index: number) => {
                    const variationName = run.variation || `Approach ${index + 1}`;
                    const score = run.score || 0;
                    const isWinner = score >= 7;
                    const defensePreview = (run.defenseArgument || '')
                      .split('\n')
                      .filter((line: string) => line.trim().length > 0)
                      .slice(0, 2)
                      .join(' ')
                      .substring(0, 180);
                    
                    const judgmentPreview = (run.judgmentSummary || '')
                      .split('\n')
                      .filter((line: string) => line.trim().length > 0)
                      .slice(0, 1)
                      .join(' ')
                      .substring(0, 130);

                    return (
                      <div 
                        key={index} 
                        className={`rounded-lg p-4 transition-all ${
                          isWinner 
                            ? 'bg-gradient-to-r from-gray-50 to-blue-50 border-2 border-blue-200' 
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                              isWinner ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-900">{variationName}</span>
                                {isWinner && (
                                  <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                                    Winner
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">Score: {score.toFixed(1)}/10</p>
                            </div>
                          </div>
                          {isWinner && <Sparkles className="h-5 w-5 text-black flex-shrink-0" />}
                        </div>
                        
                        {defensePreview && (
                          <div className="mb-2 pl-11">
                            <p className="text-xs font-medium text-gray-700 mb-1">Defense Argument:</p>
                            <p className="text-xs text-gray-600 leading-relaxed">
                              "{defensePreview}{defensePreview.length >= 180 ? '...' : ''}"
                            </p>
                          </div>
                        )}
                        
                        {judgmentPreview && (
                          <div className="pl-11 pt-2 border-t border-gray-200">
                            <p className="text-xs font-medium text-gray-700 mb-1">Judge's Ruling:</p>
                            <p className="text-xs text-gray-600 italic leading-relaxed">
                              {judgmentPreview}{judgmentPreview.length >= 130 ? '...' : ''}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
                <div className="mt-4 p-3 bg-gray-900 text-white rounded-lg">
                  <p className="text-xs leading-relaxed">
                    <strong>Strategic Guidance:</strong> The {(() => {
                      const allRuns = JSON.parse(localStorage.getItem('simulationResults') || '[]')
                        .find((s: any) => s.strategyTitle === strategySummaries[0]?.title)?.runs || [];
                      const bestRun = [...allRuns].sort((a: any, b: any) => (b.score || 0) - (a.score || 0))[0];
                      return bestRun?.variation || 'top-scoring';
                    })()} approach demonstrated superior effectiveness in simulation. Adopt this tactical stance for optimal results.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {alternativeStrategies.length > 0 && (
            <Card className="legal-card legal-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg text-black flex items-center">
                      <Target className="h-5 w-5 mr-2 text-gray-600" />
                      Alternative Strategies Considered
                    </CardTitle>
                    <CardDescription>Other defense approaches tested but ranked lower</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs">Backup Options</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {alternativeStrategies.map((strategy, idx) => (
                  <div
                    key={strategy.id}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-4 hover:bg-white transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-gray-500">Option {idx + 2}</span>
                          <h4 className="text-sm font-semibold text-gray-900">{strategy.title}</h4>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <span>Avg Score: <strong className="text-gray-900">{strategy.averageScore.toFixed(1)}/10</strong></span>
                          <span>Success Rate: <strong className="text-gray-900">{Math.round(strategy.successRate * 100)}%</strong></span>
                          <span className="text-gray-500">({strategy.winsCount}/{strategy.totalRuns} wins)</span>
                        </div>
                      </div>
                    </div>
                    {strategy.keyInsight && (
                      <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                        {strategy.keyInsight.substring(0, 150)}{strategy.keyInsight.length > 150 ? '...' : ''}
                      </p>
                    )}
                  </div>
                ))}
                <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <p className="text-xs text-blue-900">
                    <strong>Note:</strong> These strategies scored lower overall but may be valuable as secondary arguments or if case circumstances change.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6 border-t">
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
