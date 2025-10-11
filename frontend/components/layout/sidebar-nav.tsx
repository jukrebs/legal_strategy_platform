
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

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-black text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <Scale className="h-8 w-8 text-white" />
          <div>
            <h1 className="text-xl font-bold">Legal Strategy</h1>
            <p className="text-sm text-gray-400">Platform</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group',
                  isActive 
                    ? 'bg-white text-black shadow-lg' 
                    : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                )}
              >
                <item.icon className={cn(
                  'h-5 w-5 flex-shrink-0',
                  isActive ? 'text-black' : 'text-gray-500'
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs opacity-75 truncate">{item.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t border-gray-800 mt-auto">
        <div className="text-xs text-gray-400 space-y-1">
          <p>Legal Strategy Platform MVP</p>
          <p>© 2025 All rights reserved</p>
        </div>
      </div>
    </div>
  );
}
