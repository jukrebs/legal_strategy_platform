
"use client"

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

const steps = [
  'Intake',
  'Cases',
  'Strategy',
  'Twins',
  'Simulation',
  'Export'
];

interface ProgressHeaderProps {
  currentStep: number;
  title: string;
  description?: string;
}

export function ProgressHeader({ currentStep, title, description }: ProgressHeaderProps) {
  const progressValue = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {description && (
              <p className="text-sm text-gray-600 mt-1">{description}</p>
            )}
          </div>
          <div className="text-sm text-gray-500">
            Step {currentStep} of {steps.length}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            {steps.map((step, index) => (
              <span
                key={step}
                className={cn(
                  'transition-colors',
                  index + 1 <= currentStep ? 'text-blue-600 font-medium' : 'text-gray-400'
                )}
              >
                {step}
              </span>
            ))}
          </div>
          <Progress 
            value={progressValue} 
            className="h-2 bg-gray-200"
          />
        </div>
      </div>
    </div>
  );
}
