"use client"

import React, { useState, useEffect } from 'react';

interface LegalLoadingProps {
  messages: string[];
  duration?: number; // Duration in milliseconds
}

export function LegalLoading({ messages, duration = 5000 }: LegalLoadingProps) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    if (messages.length === 0) return;

    const messageInterval = duration / messages.length;
    
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, messageInterval);

    return () => clearInterval(interval);
  }, [messages, duration]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] pt-32 pb-16 space-y-3">
      {/* Balance Scale - Smaller and moved down */}
      <div className="scale-[1.2] sm:scale-[1.3]">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="80" 
          height="80" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.75" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="text-black"
        >
          <style>
            {`
              @keyframes tilt {
                0%, 100% { transform: rotate(-8deg); }
                50% { transform: rotate(8deg); }
              }
            
              .beam-group {
                transform-origin: 12px 6px;
                animation: tilt 2s ease-in-out infinite;
              }
            `}
          </style>

          {/* Static pole */}
          <path d="M12 3v18" />

          {/* Base */}
          <path d="M7 21h10" />

          {/* Pivot point */}
          <circle cx="12" cy="6" r="0.5" fill="currentColor" />

          {/* Animated beam and weights group */}
          <g className="beam-group">
            {/* Beam */}
            <path d="M3 6h18" />
          
            {/* Left chain and weight */}
            <line x1="5" y1="6" x2="5" y2="8" />
            <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
          
            {/* Right chain and weight */}
            <line x1="19" y1="6" x2="19" y2="8" />
            <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
          </g>
        </svg>
      </div>

      {/* Animated Text Below - Apple-like style with continuous rotation */}
      <div 
        className="relative h-20 w-full max-w-3xl px-4 overflow-hidden"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)'
        }}
      >
        
        {messages.map((message, index) => {
          // Calculate position relative to current index
          const position = (index - currentMessageIndex + messages.length) % messages.length;
          
          // Determine transform and opacity based on position
          let translateY = '0';
          let opacity = 1;
          
          if (position === 0) {
            // Current message - centered
            translateY = '0';
            opacity = 1;
          } else if (position === messages.length - 1) {
            // Previous message - going up, fade it out
            translateY = '-100%';
            opacity = 0;
          } else {
            // Next messages - coming from below
            translateY = '100%';
            opacity = 0;
          }
          
          return (
            <div
              key={index}
              className="absolute inset-0 flex items-center justify-center transition-all duration-[2500ms] ease-in-out"
              style={{
                transform: `translateY(${translateY})`,
                opacity: opacity
              }}
            >
              <p 
                className="text-base sm:text-lg text-gray-800 text-center tracking-tight"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", system-ui, sans-serif',
                  fontWeight: 300,
                  letterSpacing: '-0.02em'
                }}
              >
                {message}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

