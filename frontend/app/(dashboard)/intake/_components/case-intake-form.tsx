
"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressHeader } from '@/components/layout/progress-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { demoCase } from '@/lib/mock-data';
import { CaseIntake } from '@/lib/types';
import { FileText, Scale, AlertCircle } from 'lucide-react';

export function CaseIntakeForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<CaseIntake>(demoCase);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof CaseIntake, value: any) => {
    if (field === 'preferences') {
      setFormData(prev => ({
        ...prev,
        preferences: { ...prev.preferences, ...value }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Store case data in localStorage for demo purposes
    localStorage.setItem('legalCase', JSON.stringify(formData));
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSubmitting(false);
    router.push('/cases');
  };

  return (
    <>
      <ProgressHeader 
        currentStep={1} 
        title="Case Intake" 
        description="Enter your case details to begin strategy development"
      />
      
      <div className="max-w-4xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header Section */}
          <Card className="legal-card legal-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Case Information</CardTitle>
                  <CardDescription>
                    Provide the core details of your legal matter
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="jurisdiction">Jurisdiction *</Label>
                  <Select 
                    value={formData.jurisdiction} 
                    onValueChange={(value) => handleInputChange('jurisdiction', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select jurisdiction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EDNY/SDNY">EDNY/SDNY</SelectItem>
                      <SelectItem value="CDCA">CDCA</SelectItem>
                      <SelectItem value="NDIL">NDIL</SelectItem>
                      <SelectItem value="SDFL">SDFL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="judge">Judge Name</Label>
                  <Input
                    id="judge"
                    value={formData.judge}
                    onChange={(e) => handleInputChange('judge', e.target.value)}
                    placeholder="Enter judge name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="caseType">Case Type *</Label>
                  <Select 
                    value={formData.caseType} 
                    onValueChange={(value) => handleInputChange('caseType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select case type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Consumer false advertising (NY GBL §349/§350)">
                        Consumer False Advertising (NY GBL)
                      </SelectItem>
                      <SelectItem value="Product liability">Product Liability</SelectItem>
                      <SelectItem value="Employment discrimination">Employment Discrimination</SelectItem>
                      <SelectItem value="Contract dispute">Contract Dispute</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="posture">Case Posture *</Label>
                  <Select 
                    value={formData.posture} 
                    onValueChange={(value) => handleInputChange('posture', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select posture" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Motion to Dismiss (MTD)">Motion to Dismiss (MTD)</SelectItem>
                      <SelectItem value="Summary Judgment">Summary Judgment</SelectItem>
                      <SelectItem value="Discovery Motion">Discovery Motion</SelectItem>
                      <SelectItem value="Trial Preparation">Trial Preparation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="opposingCounsel">Opposing Counsel</Label>
                <Input
                  id="opposingCounsel"
                  value={formData.opposingCounsel}
                  onChange={(e) => handleInputChange('opposingCounsel', e.target.value)}
                  placeholder="Enter opposing counsel firm name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="facts">Case Facts *</Label>
                <Textarea
                  id="facts"
                  value={formData.facts}
                  onChange={(e) => handleInputChange('facts', e.target.value)}
                  placeholder="Describe the key facts of your case..."
                  rows={4}
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Preferences Section */}
          <Card className="legal-card legal-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Scale className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Strategy Preferences</CardTitle>
                  <CardDescription>
                    Configure how you want your strategy developed
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-medium">Risk Tolerance</Label>
                <RadioGroup 
                  value={formData.preferences.riskTolerance} 
                  onValueChange={(value) => handleInputChange('preferences', { riskTolerance: value })}
                  className="grid grid-cols-3 gap-4"
                >
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value="conservative" id="conservative" />
                    <Label htmlFor="conservative" className="cursor-pointer">
                      <div>
                        <div className="font-medium">Conservative</div>
                        <div className="text-sm text-gray-600">Lower risk, proven strategies</div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value="moderate" id="moderate" />
                    <Label htmlFor="moderate" className="cursor-pointer">
                      <div>
                        <div className="font-medium">Moderate</div>
                        <div className="text-sm text-gray-600">Balanced approach</div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value="aggressive" id="aggressive" />
                    <Label htmlFor="aggressive" className="cursor-pointer">
                      <div>
                        <div className="font-medium">Aggressive</div>
                        <div className="text-sm text-gray-600">Novel arguments, higher risk</div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">Brief Style</Label>
                <RadioGroup 
                  value={formData.preferences.briefStyle} 
                  onValueChange={(value) => handleInputChange('preferences', { briefStyle: value })}
                  className="grid grid-cols-3 gap-4"
                >
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value="concise" id="concise" />
                    <Label htmlFor="concise" className="cursor-pointer">
                      <div>
                        <div className="font-medium">Concise</div>
                        <div className="text-sm text-gray-600">Brief and to the point</div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value="detailed" id="detailed" />
                    <Label htmlFor="detailed" className="cursor-pointer">
                      <div>
                        <div className="font-medium">Detailed</div>
                        <div className="text-sm text-gray-600">Thorough analysis</div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value="comprehensive" id="comprehensive" />
                    <Label htmlFor="comprehensive" className="cursor-pointer">
                      <div>
                        <div className="font-medium">Comprehensive</div>
                        <div className="text-sm text-gray-600">Exhaustive coverage</div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-medium">Settlement Posture</Label>
                <RadioGroup 
                  value={formData.preferences.settlementPosture} 
                  onValueChange={(value) => handleInputChange('preferences', { settlementPosture: value })}
                  className="grid grid-cols-3 gap-4"
                >
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value="early" id="early" />
                    <Label htmlFor="early" className="cursor-pointer">
                      <div>
                        <div className="font-medium">Early Settlement</div>
                        <div className="text-sm text-gray-600">Prefer quick resolution</div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value="mixed" id="mixed" />
                    <Label htmlFor="mixed" className="cursor-pointer">
                      <div>
                        <div className="font-medium">Mixed Strategy</div>
                        <div className="text-sm text-gray-600">Flexible approach</div>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value="trial-ready" id="trial-ready" />
                    <Label htmlFor="trial-ready" className="cursor-pointer">
                      <div>
                        <div className="font-medium">Trial Ready</div>
                        <div className="text-sm text-gray-600">Prepare for litigation</div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Submit Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <AlertCircle className="h-4 w-4" />
              <span>All case information is processed locally and securely</span>
            </div>
            <Button 
              type="submit" 
              size="lg" 
              disabled={isSubmitting}
              className="legal-gradient text-white px-8 py-3 text-base font-medium"
            >
              {isSubmitting ? 'Processing...' : 'Analyze Case & Find Similar Cases'}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
