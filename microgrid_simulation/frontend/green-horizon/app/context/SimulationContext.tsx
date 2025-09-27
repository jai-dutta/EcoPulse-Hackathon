"use client"

import { createContext, useContext, useState, useRef, useEffect, ReactNode } from "react"

interface SimulationContextType {
  isAutoRunning: boolean
  autoStepCount: number
  autoInterval: number
  useRealisticDemand: boolean
  demandKw: number
  totalDailyKwh: number
  timestepHours: number
  simulationResults: any
  setDemandKw: (v: number) => void
  setTotalDailyKwh: (v: number) => void
  setTimestepHours: (v: number) => void
  setUseRealisticDemand: (v: boolean) => void
  setAutoInterval: (v: number) => void
  toggleAutoStep: () => void
  resetAutoStep: () => void
  runStep: (isAutoStep?: boolean) => Promise<void>
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined)

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [isAutoRunning, setIsAutoRunning] = useState(false)
  const [autoStepCount, setAutoStepCount] = useState(0)
  const [autoInterval, setAutoInterval] = useState(5)
  const [useRealisticDemand, setUseRealisticDemand] = useState(false)
  const [simulationResults, setSimulationResults] = useState<any>(null)
  const [demandKw, setDemandKw] = useState(100)
  const [totalDailyKwh, setTotalDailyKwh] = useState(150)
  const [timestepHours, setTimestepHours] = useState(1)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const runStep = async (isAutoStep = false) => {
    try {
      const response = await fetch(
        `http://localhost:8000/simulate/realistic?total_daily_kwh=${totalDailyKwh}&timestep_hours=${timestepHours}`,
        { method: "POST" }
      )
      if (response.ok) {
        const data = await response.json()
        setSimulationResults(data.simulation_results)
        setDemandKw(data.calculated_demand)
        if (isAutoStep) setAutoStepCount((prev) => prev + 1)
      }
    } catch (error) {
      console.error("Simulation failed:", error)
      setIsAutoRunning(false)
    }
  }

  const toggleAutoStep = () => {
    setIsAutoRunning((prev) => !prev)
    setAutoStepCount(0)
  }

  const resetAutoStep = () => {
    setIsAutoRunning(false)
    setAutoStepCount(0)
  }

  // Auto-step interval
  useEffect(() => {
    if (isAutoRunning) {
      intervalRef.current = setInterval(() => runStep(true), autoInterval * 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isAutoRunning, autoInterval, useRealisticDemand, totalDailyKwh, timestepHours])

  return (
    <SimulationContext.Provider
      value={{
        isAutoRunning,
        autoStepCount,
        autoInterval,
        useRealisticDemand,
        demandKw,
        totalDailyKwh,
        timestepHours,
        simulationResults,
        setDemandKw,
        setTotalDailyKwh,
        setTimestepHours,
        setUseRealisticDemand,
        setAutoInterval,
        toggleAutoStep,
        resetAutoStep,
        runStep,
      }}
    >
      {children}
    </SimulationContext.Provider>
  )
}

export const useSimulation = () => {
  const context = useContext(SimulationContext)
  if (!context) throw new Error("useSimulation must be used within SimulationProvider")
  return context
}
