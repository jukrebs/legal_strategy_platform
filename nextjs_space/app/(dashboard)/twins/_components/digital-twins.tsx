
"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProgressHeader } from '@/components/layout/progress-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { mockJudgeProfile, mockOpposingProfile } from '@/lib/mock-data';
import { JudgeProfile, OpposingCounselProfile } from '@/lib/types';
import { 
  User, 
  Users, 
  Settings, 
  Gavel,
  Briefcase,
  Target,
  Brain,
  Shield,
  Zap
} from 'lucide-react';

export function DigitalTwins() {
  const router = useRouter();
  const [judgeProfile, setJudgeProfile] = useState<JudgeProfile>(mockJudgeProfile);
  const [opposingProfile, setOpposingProfile] = useState<OpposingCounselProfile>(mockOpposingProfile);
  const [userPreferences, setUserPreferences] = useState({
    aggressiveness: 60,
    thoroughness: 80,
    riskTolerance: 50,
    timeConstraints: 40
  });

  const handleJudgeCharacteristicChange = (characteristic: keyof JudgeProfile['characteristics'], value: number[]) => {
    setJudgeProfile(prev => ({
      ...prev,
      characteristics: {
        ...prev.characteristics,
        [characteristic]: value[0]
      }
    }));
  };

  const handleOpposingArgumentsChange = (value: string) => {
    setOpposingProfile(prev => ({
      ...prev,
      typicalArguments: value.split('\n').filter(arg => arg.trim().length > 0)
    }));
  };

  const getSliderColor = (value: number) => {
    if (value >= 7) return 'text-red-600';
    if (value >= 4) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getAggressivenessColor = (score: number) => {
    if (score >= 7) return 'bg-red-100 text-red-800 border-red-200';
    if (score >= 4) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  return (
    <>
      <ProgressHeader 
        currentStep={4} 
        title="Digital Twins Configuration" 
        description="Set up AI profiles for judge, opposing counsel, and your approach"
      />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Judge Profile */}
          <Card className="legal-card legal-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Gavel className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Judge Profile</CardTitle>
                  <CardDescription>
                    {judgeProfile?.name}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Pleading Strictness: {judgeProfile?.characteristics?.pleadingStrictness}/10
                  </Label>
                  <Slider
                    value={[judgeProfile?.characteristics?.pleadingStrictness ?? 5]}
                    onValueChange={(value) => handleJudgeCharacteristicChange('pleadingStrictness', value)}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-600 mt-1">
                    {judgeProfile?.evidenceSnippets?.pleadingStrictness?.[0]}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Precedent Weight: {judgeProfile?.characteristics?.precedentWeight}/10
                  </Label>
                  <Slider
                    value={[judgeProfile?.characteristics?.precedentWeight ?? 5]}
                    onValueChange={(value) => handleJudgeCharacteristicChange('precedentWeight', value)}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-600 mt-1">
                    {judgeProfile?.evidenceSnippets?.precedentWeight?.[0]}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Policy Receptivity: {judgeProfile?.characteristics?.policyReceptivity}/10
                  </Label>
                  <Slider
                    value={[judgeProfile?.characteristics?.policyReceptivity ?? 5]}
                    onValueChange={(value) => handleJudgeCharacteristicChange('policyReceptivity', value)}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-600 mt-1">
                    {judgeProfile?.evidenceSnippets?.policyReceptivity?.[0]}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Plaintiff Friendly: {judgeProfile?.characteristics?.plaintiffFriendly}/10
                  </Label>
                  <Slider
                    value={[judgeProfile?.characteristics?.plaintiffFriendly ?? 5]}
                    onValueChange={(value) => handleJudgeCharacteristicChange('plaintiffFriendly', value)}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-600 mt-1">
                    {judgeProfile?.evidenceSnippets?.plaintiffFriendly?.[0]}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Label className="text-sm font-medium mb-2 block">Judge Notes</Label>
                <div className="text-sm text-gray-700 p-3 bg-purple-50 rounded border">
                  {judgeProfile?.notes}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Opposing Counsel Profile */}
          <Card className="legal-card legal-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Briefcase className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Opposing Counsel</CardTitle>
                  <CardDescription>
                    {opposingProfile?.name}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Aggressiveness Score</Label>
                <Badge className={getAggressivenessColor(opposingProfile?.aggressivenessScore ?? 5)}>
                  {opposingProfile?.aggressivenessScore}/10
                </Badge>
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">Likely Moves</Label>
                <div className="space-y-2">
                  {opposingProfile?.likelyMoves?.map((move, index) => (
                    <div key={index} className="text-sm text-gray-700 p-2 bg-gray-50 rounded border flex items-start">
                      <Target className="h-3 w-3 text-red-500 mt-1 mr-2 flex-shrink-0" />
                      {move}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Typical Arguments (editable)
                </Label>
                <Textarea
                  value={opposingProfile?.typicalArguments?.join('\n') ?? ''}
                  onChange={(e) => handleOpposingArgumentsChange(e.target.value)}
                  placeholder="Enter typical arguments, one per line..."
                  rows={4}
                  className="text-sm"
                />
              </div>

              <div>
                <Label className="text-sm font-medium mb-3 block">Known Weaknesses</Label>
                <div className="space-y-2">
                  {opposingProfile?.weaknesses?.map((weakness, index) => (
                    <div key={index} className="text-sm text-gray-700 p-2 bg-green-50 rounded border flex items-start">
                      <Shield className="h-3 w-3 text-green-500 mt-1 mr-2 flex-shrink-0" />
                      {weakness}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Profile */}
          <Card className="legal-card legal-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Your Profile</CardTitle>
                  <CardDescription>
                    Configure your approach and preferences
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Aggressiveness: {userPreferences?.aggressiveness}%
                  </Label>
                  <Slider
                    value={[userPreferences?.aggressiveness ?? 50]}
                    onValueChange={(value) => setUserPreferences(prev => ({...prev, aggressiveness: value[0]}))}
                    max={100}
                    step={10}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-600 mt-1">
                    How forcefully to present arguments
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Thoroughness: {userPreferences?.thoroughness}%
                  </Label>
                  <Slider
                    value={[userPreferences?.thoroughness ?? 50]}
                    onValueChange={(value) => setUserPreferences(prev => ({...prev, thoroughness: value[0]}))}
                    max={100}
                    step={10}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-600 mt-1">
                    Depth of legal analysis and citation
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Risk Tolerance: {userPreferences?.riskTolerance}%
                  </Label>
                  <Slider
                    value={[userPreferences?.riskTolerance ?? 50]}
                    onValueChange={(value) => setUserPreferences(prev => ({...prev, riskTolerance: value[0]}))}
                    max={100}
                    step={10}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-600 mt-1">
                    Willingness to pursue novel arguments
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Time Constraints: {userPreferences?.timeConstraints}%
                  </Label>
                  <Slider
                    value={[userPreferences?.timeConstraints ?? 50]}
                    onValueChange={(value) => setUserPreferences(prev => ({...prev, timeConstraints: value[0]}))}
                    max={100}
                    step={10}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-600 mt-1">
                    Pressure for quick resolution
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="p-3 bg-blue-50 rounded border">
                  <div className="flex items-center space-x-2 mb-2">
                    <Brain className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">AI Recommendation</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Based on the judge's precedent preference and opposing counsel's aggressive style, 
                    consider maintaining high thoroughness with moderate aggressiveness.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <Button 
            variant="outline" 
            onClick={() => router.push('/strategy')}
          >
            Back to Strategy
          </Button>
          
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline"
              className="flex items-center space-x-2"
              onClick={() => {
                // Save configuration to localStorage
                const configData = {
                  judgeProfile,
                  opposingProfile,
                  userPreferences,
                  timestamp: Date.now()
                };
                localStorage.setItem('digitalTwinsConfig', JSON.stringify(configData));
                
                // Show success feedback
                const button = document.activeElement as HTMLButtonElement;
                if (button) {
                  const originalText = button.textContent;
                  button.textContent = 'Saved!';
                  button.className = button.className.replace('variant="outline"', '') + ' bg-green-100 text-green-800';
                  setTimeout(() => {
                    button.textContent = originalText ?? 'Save Configuration';
                    button.className = button.className.replace(' bg-green-100 text-green-800', '');
                  }, 2000);
                }
              }}
            >
              <Settings className="h-4 w-4" />
              <span>Save Configuration</span>
            </Button>
            
            <Button 
              onClick={() => router.push('/simulation')}
              className="legal-gradient text-white flex items-center space-x-2"
            >
              <Zap className="h-4 w-4" />
              <span>Run Courtroom Simulation</span>
            </Button>
          </div>
        </div>

        {/* Configuration Summary */}
        <Card className="legal-card legal-shadow mt-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Users className="h-5 w-5 mr-2 text-purple-600" />
              Configuration Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium text-purple-600">Judge Profile:</span>
                <p className="text-gray-700">
                  Moderate strictness, high precedent weight, balanced policy receptivity
                </p>
              </div>
              <div>
                <span className="font-medium text-red-600">Opposing Counsel:</span>
                <p className="text-gray-700">
                  High aggressiveness, focuses on front-label dominance theory
                </p>
              </div>
              <div>
                <span className="font-medium text-blue-600">Your Approach:</span>
                <p className="text-gray-700">
                  Balanced aggressiveness with high thoroughness and moderate risk tolerance
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
