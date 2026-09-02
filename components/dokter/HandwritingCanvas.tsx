'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import getStroke from 'perfect-freehand'
import { Button } from '@/components/ui/button'
import { Undo2, RotateCcw, Pen, Eraser, Check } from 'lucide-react'
import { toast } from 'sonner'

interface Point {
  x: number
  y: number
  pressure?: number
}

interface HandwritingCanvasProps {
  initialImage?: string | null
  placeholder?: string
  readOnly?: boolean
  storageKey?: string
  onChange?: (dataUrl: string | null) => void
  minHeight?: number
}

export interface StrokeData {
  points: Point[]
  tool: 'pen' | 'eraser'
}

const STROKE_OPTIONS = {
  size: 4,
  thinning: 0.4,
  smoothing: 0.5,
  streamline: 0.5,
  easing: (t: number) => t,
  start: { taper: 0, easing: (t: number) => t, cap: true },
  end: { taper: 0, easing: (t: number) => t, cap: true },
}

const ERASER_STROKE_OPTIONS = {
  size: 24,
  thinning: 0,
  smoothing: 0.5,
  streamline: 0.5,
  easing: (t: number) => t,
  start: { taper: 0, easing: (t: number) => t, cap: true },
  end: { taper: 0, easing: (t: number) => t, cap: true },
}

function getSvgPathFromStroke(stroke: number[][]): string {
  if (!stroke.length) return ''
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length]
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2)
      return acc
    },
    ['M', ...stroke[0], 'Q']
  )
  d.push('Z')
  return d.join(' ')
}

export function HandwritingCanvas({
  initialImage,
  placeholder = 'Menulis dengan stylus / pen di sini...',
  readOnly = false,
  storageKey,
  onChange,
  minHeight = 220,
}: HandwritingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null)

  // Stored strokes: Array of StrokeData
  const [strokes, setStrokes] = useState<StrokeData[]>([])
  const [currentStroke, setCurrentStroke] = useState<StrokeData | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [activeTool, setActiveTool] = useState<'pen' | 'eraser'>('pen')
  const [isPenDetected, setIsPenDetected] = useState(false)
  const [loadedInitial, setLoadedInitial] = useState(false)

  // State for holding loaded background image
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null)

  // Load initialImage into HTMLImageElement
  useEffect(() => {
    if (initialImage) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        setBgImage(img)
      }
      img.src = initialImage
    }
  }, [initialImage])

  // Load from localStorage if present for crash recovery
  useEffect(() => {
    if (storageKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(`hw_draft_${storageKey}`)
      if (saved && !initialImage) {
        try {
          const parsed = JSON.parse(saved)
          if (Array.isArray(parsed) && parsed.length > 0) {
            if (Array.isArray(parsed[0])) {
              // Backward compatibility migration for old Point[][] structure
              setStrokes(parsed.map((pts: Point[]) => ({ points: pts, tool: 'pen' })))
            } else {
              setStrokes(parsed)
            }
          }
        } catch {
          // ignore error
        }
      }
    }
  }, [storageKey, initialImage])

  // Save draft to localStorage
  useEffect(() => {
    if (storageKey && strokes.length > 0 && typeof window !== 'undefined') {
      localStorage.setItem(`hw_draft_${storageKey}`, JSON.stringify(strokes))
    }
  }, [storageKey, strokes])

  // Render canvas strokes using offscreen canvas for eraser destination-out support
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const width = canvas.width / dpr
    const height = canvas.height / dpr

    // Clear main canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.scale(dpr, dpr)

    // 1. Draw Background paper color (#FAF9F6 - Ivory paper)
    ctx.fillStyle = '#FAF9F6'
    ctx.fillRect(0, 0, width, height)

    // 2. Draw notebook lines (32px line spacing)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)' // Subtle slate blue
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    const lineSpacing = 32
    for (let y = lineSpacing; y < height; y += lineSpacing) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
    ctx.setLineDash([]) // reset dash

    // 3. Create or reuse Offscreen Canvas for background image & strokes
    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas')
    }
    const offscreen = offscreenCanvasRef.current
    if (offscreen.width !== canvas.width || offscreen.height !== canvas.height) {
      offscreen.width = canvas.width
      offscreen.height = canvas.height
    }
    
    const offCtx = offscreen.getContext('2d')
    if (offCtx) {
      offCtx.clearRect(0, 0, offscreen.width, offscreen.height)
      offCtx.save()
      offCtx.scale(dpr, dpr)

      // Draw background image if exists
      if (bgImage) {
        offCtx.drawImage(bgImage, 0, 0, width, height)
      }

      const drawStroke = (s: StrokeData) => {
        if (s.points.length === 0) return
        const opts = s.tool === 'eraser' ? ERASER_STROKE_OPTIONS : STROKE_OPTIONS
        const strokeOutline = getStroke(
          s.points.map((p) => [p.x, p.y, p.pressure ?? 0.5]),
          opts
        )
        const pathData = getSvgPathFromStroke(strokeOutline)
        if (pathData) {
          const path = new Path2D(pathData)
          offCtx.save()
          if (s.tool === 'eraser') {
            offCtx.globalCompositeOperation = 'destination-out'
            offCtx.fillStyle = '#000000'
          } else {
            offCtx.globalCompositeOperation = 'source-over'
            offCtx.fillStyle = '#1e3a8a' // Dark blue ink
          }
          offCtx.fill(path)
          offCtx.restore()
        }
      }

      // Draw all saved strokes
      strokes.forEach(drawStroke)

      // Draw current active stroke
      if (currentStroke) {
        drawStroke(currentStroke)
      }
      offCtx.restore()
      
      // Render offscreen canvas onto main canvas
      ctx.drawImage(offscreen, 0, 0, width, height)
    }

    ctx.restore()
  }, [strokes, currentStroke, bgImage])

  // Handle canvas resize
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const dpr = window.devicePixelRatio || 1
    const targetWidth = container.clientWidth
    const targetHeight = Math.max(minHeight, container.clientHeight)

    if (canvas.style.width !== `${targetWidth}px` || canvas.style.height !== `${targetHeight}px`) {
      canvas.width = targetWidth * dpr
      canvas.height = targetHeight * dpr
      canvas.style.width = `${targetWidth}px`
      canvas.style.height = `${targetHeight}px`
      renderCanvas()
    }
  }, [minHeight, renderCanvas])

  useEffect(() => {
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [resizeCanvas])

  useEffect(() => {
    let animationFrameId: number
    const render = () => {
      renderCanvas()
      // We don't continuously loop requestAnimationFrame, we just use it 
      // to debounce if renderCanvas is called rapidly. 
      // But since we just want to defer the render to the next frame:
    }
    animationFrameId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animationFrameId)
  }, [renderCanvas])

  // Export Data URL when strokes change
  const exportDataUrl = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || (strokes.length === 0 && !bgImage)) {
      onChange?.(null)
      return
    }
    
    // Create a temporary canvas to export ONLY the transparent handwriting
    // This drastically reduces file size and prevents background lines from overlapping/stretching
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = canvas.width
    tempCanvas.height = canvas.height
    const tempCtx = tempCanvas.getContext('2d')
    
    if (tempCtx) {
      const dpr = window.devicePixelRatio || 1
      tempCtx.scale(dpr, dpr)

      // Draw previous image if exists (should be transparent too)
      if (bgImage) {
        tempCtx.drawImage(bgImage, 0, 0, canvas.width / dpr, canvas.height / dpr)
      }

      // Draw all strokes
      const drawStroke = (s: StrokeData) => {
        if (s.points.length === 0) return
        const opts = s.tool === 'eraser' ? ERASER_STROKE_OPTIONS : STROKE_OPTIONS
        const strokeOutline = getStroke(
          s.points.map((p) => [p.x, p.y, p.pressure ?? 0.5]),
          opts
        )
        const pathData = getSvgPathFromStroke(strokeOutline)
        if (pathData) {
          const path = new Path2D(pathData)
          tempCtx.save()
          if (s.tool === 'eraser') {
            tempCtx.globalCompositeOperation = 'destination-out'
            tempCtx.fillStyle = '#000000'
          } else {
            tempCtx.globalCompositeOperation = 'source-over'
            tempCtx.fillStyle = '#1e3a8a'
          }
          tempCtx.fill(path)
          tempCtx.restore()
        }
      }

      strokes.forEach(drawStroke)
    }

    const dataUrl = tempCanvas.toDataURL('image/png')
    onChange?.(dataUrl)
  }, [strokes, bgImage, onChange])

  useEffect(() => {
    if (loadedInitial) {
      exportDataUrl()
    }
  }, [strokes, exportDataUrl, loadedInitial])

  // Mark initial loaded
  useEffect(() => {
    setLoadedInitial(true)
  }, [])

  // Pointer event handlers
  const getPointerPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure > 0 ? e.pressure : 0.5,
    }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly) return

    // Palm Rejection: If stylus is active, ignore touch events
    if (e.pointerType === 'pen') {
      setIsPenDetected(true)
    } else if (e.pointerType === 'touch' && isPenDetected) {
      return
    }

    e.currentTarget.setPointerCapture(e.pointerId)
    setIsDrawing(true)
    const pt = getPointerPoint(e)
    setCurrentStroke({
      points: [pt],
      tool: activeTool,
    })
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly || !currentStroke) return
    if (e.pointerType === 'touch' && isPenDetected) return

    const pt = getPointerPoint(e)
    setCurrentStroke((prev) => (prev ? { ...prev, points: [...prev.points, pt] } : null))
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || readOnly) return
    if (e.pointerType === 'touch' && isPenDetected) return

    setIsDrawing(false)
    if (currentStroke && currentStroke.points.length > 0) {
      setStrokes((prev) => [...prev, currentStroke])
      setCurrentStroke(null)
    }
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      // ignore
    }
  }

  const handleUndo = () => {
    if (readOnly || strokes.length === 0) return
    setStrokes((prev) => prev.slice(0, prev.length - 1))
  }



  // Read Only Display if initialImage exists and no active strokes
  if (readOnly && initialImage && strokes.length === 0) {
    return (
      <div className="relative border border-amber-200 rounded-xl overflow-hidden bg-[#FAF9F6] p-2">
        <img
          src={initialImage}
          alt="Tulisan Tangan Rekam Medis"
          className="w-full h-auto object-contain max-h-[300px]"
        />
      </div>
    )
  }

  return (
    <div className="space-y-2 w-full">
      {/* Canvas Controls Bar */}
      {!readOnly && (
        <div className="flex items-center justify-between px-2 py-1 bg-amber-50/80 border border-amber-200 rounded-lg text-xs">
          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="sm"
              variant={activeTool === 'pen' ? 'default' : 'ghost'}
              onClick={() => setActiveTool('pen')}
              className={`h-7 px-2.5 text-xs gap-1.5 ${activeTool === 'pen'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'text-gray-700 hover:bg-amber-100'
                }`}
            >
              <Pen className="h-3.5 w-3.5" />

            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeTool === 'eraser' ? 'default' : 'ghost'}
              onClick={() => setActiveTool('eraser')}
              className={`h-7 px-2.5 text-xs gap-1.5 ${activeTool === 'eraser'
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'text-gray-700 hover:bg-amber-100'
                }`}
            >
              <Eraser className="h-3.5 w-3.5" />

            </Button>
          </div>

          <div className="flex items-center gap-1">
            {isPenDetected && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                <Check className="h-3 w-3" /> Stylus Aktif
              </span>
            )}
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleUndo}
              disabled={strokes.length === 0}
              className="h-7 px-2 text-xs gap-1 hover:bg-amber-100 border-amber-200"
            >
              <Undo2 className="h-3.5 w-3.5" />

            </Button>
          </div>
        </div>
      )}

      {/* Canvas Area */}
      <div
        ref={containerRef}
        className="relative border-2 border-amber-200 rounded-xl overflow-hidden shadow-inner bg-[#FAF9F6] touch-none select-none cursor-crosshair"
        style={{ minHeight: `${minHeight}px` }}
      >
        {strokes.length === 0 && !currentStroke && !readOnly && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted-foreground/60 text-sm font-handwritten text-center px-4">
            {placeholder}
          </div>
        )}
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="block w-full h-full"
        />
      </div>
    </div>
  )
}
