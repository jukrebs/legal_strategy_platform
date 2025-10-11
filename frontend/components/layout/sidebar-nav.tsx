
"use client"

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  FileText, 
  Search, 
  Target, 
  Users, 
  MessageSquare, 
  Download,
  Scale
} from 'lucide-react';

const navigationItems = [
  {
    title: 'Case Intake',
    href: '/intake',
    icon: FileText,
    description: 'Enter case details'
  },
  {
    title: 'Similar Cases',
    href: '/cases',
    icon: Search,
    description: 'Research precedents'
  },
  {
    title: 'Strategy Synthesis',
    href: '/strategy',
    icon: Target,
    description: 'Develop arguments'
  },
  {
    title: 'Digital Twins',
    href: '/twins',
    icon: Users,
    description: 'Configure profiles'
  },
  {
    title: 'Courtroom Simulation',
    href: '/simulation',
    icon: MessageSquare,
    description: 'Test strategies'
  },
  {
    title: 'Export & Download',
    href: '/export',
    icon: Download,
    description: 'Generate documents'
  }
];

interface SidebarNavProps {
  currentStep?: number;
}

export function SidebarNav({ currentStep = 1 }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-slate-900 text-white h-screen flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center space-x-3">
          <Scale className="h-8 w-8 text-blue-400" />
          <div>
            <h1 className="text-xl font-bold">Legal Strategy</h1>
            <p className="text-sm text-slate-400">Platform</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4">
        <div className="space-y-2">
          {navigationItems.map((item, index) => {
            const isActive = pathname === item.href;
            const isCompleted = currentStep > index + 1;
            const isCurrent = currentStep === index + 1;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group',
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : isCompleted
                    ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                    : isCurrent
                    ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                )}
              >
                <item.icon className={cn(
                  'h-5 w-5 flex-shrink-0',
                  isCompleted ? 'text-green-400' : isCurrent ? 'text-blue-400' : ''
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs opacity-75 truncate">{item.description}</p>
                </div>
                {isCompleted && (
                  <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0" />
                )}
                {isCurrent && (
                  <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t border-slate-700">
        <div className="text-xs text-slate-400 space-y-1">
          <p>Legal Strategy Platform MVP</p>
          <p>© 2024 All rights reserved</p>
        </div>
      </div>
    </div>
  );
}
