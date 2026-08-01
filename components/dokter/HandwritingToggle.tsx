'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Keyboard, PenTool } from 'lucide-react'

export type InputMode = 'text' | 'handwriting'

interface HandwritingToggleProps {
  mode: InputMode
  onChange: (mode: InputMode) => void
  disabled?: boolean
  hasHandwriting?: boolean
}

export function HandwritingToggle({
  mode,
  onChange,
  disabled = false,
  hasHandwriting = false,
}: HandwritingToggleProps) {
  return (
    <div className="inline-flex items-center p-0.5 bg-gray-200/80 rounded-lg border border-gray-300/60 shadow-xs">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={disabled}
        onClick={() => onChange('text')}
        className={`h-6 px-2 text-[11px] font-medium rounded-md gap-1 transition-all ${
          mode === 'text'
            ? 'bg-white text-blue-900 shadow-xs font-semibold'
            : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
        }`}
      >
        <Keyboard className="h-3 w-3" />
        Ketik
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={disabled}
        onClick={() => onChange('handwriting')}
        className={`h-6 px-2 text-[11px] font-medium rounded-md gap-1 transition-all relative ${
          mode === 'handwriting'
            ? 'bg-blue-600 text-white shadow-xs font-semibold'
            : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
        }`}
      >
        <PenTool className="h-3 w-3" />
        Tulis Tangan
        {hasHandwriting && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5 ring-2 ring-white"></span>
        )}
      </Button>
    </div>
  )
}
