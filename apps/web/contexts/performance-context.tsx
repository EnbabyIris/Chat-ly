'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { performanceMonitor, PerformanceMetrics } from '@/lib/utils/performance'

interface PerformanceContextType {
  metrics: PerformanceMetrics
  isOnline: boolean
  connectionSpeed: 'slow' | 'fast' | 'unknown'
  memoryUsage?: number
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined)

export const usePerformance = () => {
  const context = useContext(PerformanceContext)
  if (!context) {
    throw new Error('usePerformance must be used within a PerformanceProvider')
  }
  return context
}

interface PerformanceProviderProps {
  children: React.ReactNode
}

export const PerformanceProvider: React.FC<PerformanceProviderProps> = ({ children }) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({})
  const [isOnline, setIsOnline] = useState(true)
  const [connectionSpeed, setConnectionSpeed] = useState<'slow' | 'fast' | 'unknown'>('unknown')
  const [memoryUsage, setMemoryUsage] = useState<number>()

  useEffect(() => {
    // Update metrics periodically
    const updateMetrics = () => {
      setMetrics(performanceMonitor.getMetrics())
    }

    // Initial metrics
    updateMetrics()

    // Update every 30 seconds
    const interval = setInterval(updateMetrics, 30000)

    // Monitor online status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Monitor connection speed
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      const updateConnectionSpeed = () => {
        const downlink = connection.downlink
        setConnectionSpeed(downlink < 1 ? 'slow' : 'fast')
      }

      updateConnectionSpeed()
      connection.addEventListener('change', updateConnectionSpeed)
    }

    // Monitor memory usage (if available)
    if ('memory' in performance) {
      const updateMemoryUsage = () => {
        const memory = (performance as any).memory
        setMemoryUsage(memory.usedJSHeapSize)
      }

      updateMemoryUsage()
      const memoryInterval = setInterval(updateMemoryUsage, 10000)
    }

    return () => {
      clearInterval(interval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)

      if ('connection' in navigator) {
        const connection = (navigator as any).connection
        connection.removeEventListener('change', () => {})
      }
    }
  }, [])

  const value: PerformanceContextType = {
    metrics,
    isOnline,
    connectionSpeed,
    memoryUsage,
  }

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  )
}

// Performance monitoring component
export const PerformanceMonitor: React.FC = () => {
  const { metrics, isOnline, connectionSpeed, memoryUsage } = usePerformance()

  // Only show in development or when explicitly enabled
  if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_DEBUG_MODE) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded-lg font-mono z-50 max-w-xs">
      <div className="space-y-1">
        <div className="font-bold text-green-400">Performance Monitor</div>

        {metrics.fcp && (
          <div>FCP: {metrics.fcp.toFixed(0)}ms</div>
        )}
        {metrics.lcp && (
          <div>LCP: {metrics.lcp.toFixed(0)}ms</div>
        )}
        {metrics.cls !== undefined && (
          <div>CLS: {metrics.cls.toFixed(3)}</div>
        )}

        <div className={`text-xs ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
          {isOnline ? '🟢 Online' : '🔴 Offline'}
        </div>

        <div className={`text-xs ${
          connectionSpeed === 'fast' ? 'text-green-400' :
          connectionSpeed === 'slow' ? 'text-yellow-400' : 'text-gray-400'
        }`}>
          {connectionSpeed === 'fast' ? '🚀 Fast' :
           connectionSpeed === 'slow' ? '🐌 Slow' : '❓ Unknown'} connection
        </div>

        {memoryUsage && (
          <div className="text-xs text-blue-400">
            RAM: {(memoryUsage / 1024 / 1024).toFixed(1)}MB
          </div>
        )}
      </div>
    </div>
  )
}