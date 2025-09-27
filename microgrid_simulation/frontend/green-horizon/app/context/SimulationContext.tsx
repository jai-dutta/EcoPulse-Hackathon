"use client"

import { createContext, useContext, useState, useRef, useEffect, ReactNode } from "react"

interface SimulationContextType {
  isAutoRunning: boolean
  autoStepCount: number
  autoInterval: number
  setAutoInterval: (v: number) => void
  toggleAutoStep: () => void
  resetAutoStep: () => void
  runStep: (isAutoStep?: boolean) => Promise<void>
  simulationResults: any
  demandKw: number
  setDemandKw: (v: number) => void
  totalDailyKwh: number
  timestepHours: number
  setTotalDailyKwh: (v: number) => void
  setTimestepHours: (v: number) => void
  systemStatus: any
  refresh: () => void
  refreshTrigger: number
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined)

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [isAutoRunning, setIsAutoRunning] = useState(false)
  const [autoStepCount, setAutoStepCount] = useState(0)
  const [autoInterval, setAutoInterval] = useState(5)
  const [simulationResults, setSimulationResults] = useState<any>(null)
  const [demandKw, setDemandKw] = useState(100)
  const [totalDailyKwh, setTotalDailyKwh] = useState(150)
  const [timestepHours, setTimestepHours] = useState(1)
  const [systemStatus, setSystemStatus] = useState<any>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const latestSettingsRef = useRef({ totalDailyKwh, timestepHours })

  useEffect(() => {
    latestSettingsRef.current = { totalDailyKwh, timestepHours }
  }, [totalDailyKwh, timestepHours])

  const runStep = async (isAutoStep = false) => {
    try {
      const { totalDailyKwh, timestepHours } = latestSettingsRef.current
      const response = await fetch(
        `http://localhost:8000/simulate/realistic?total_daily_kwh=${totalDailyKwh}&timestep_hours=${timestepHours}`,
        { method: "POST" }
      )
      if (response.ok) {
        const data = await response.json()
        setSimulationResults(data.simulation_results)
        setDemandKw(data.calculated_demand)
        if (isAutoStep) setAutoStepCount(prev => prev + 1)
      }
    } catch (error) {
      console.error("Simulation failed:", error)
      setIsAutoRunning(false)
    }
  }

  const refresh = () => {
    console.log("REFRESHING")
    fetch("/api/system-status")
      .then(res => res.json())
      .then(data => setSystemStatus(data))
      .finally(() => setRefreshTrigger(prev => prev + 1))
  }

  const toggleAutoStep = () => {
    setIsAutoRunning(prev => !prev)
    setAutoStepCount(0)
  }

  const resetAutoStep = () => {
    setIsAutoRunning(false)
    setAutoStepCount(0)
  }

  useEffect(() => {
    if (isAutoRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current)
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
  }, [isAutoRunning, autoInterval])

  return (
    <SimulationContext.Provider
      value={{
        isAutoRunning,
        autoStepCount,
        autoInterval,
        setAutoInterval,
        toggleAutoStep,
        resetAutoStep,
        runStep,
        simulationResults,
        demandKw,
        totalDailyKwh,
        timestepHours,
        setTotalDailyKwh,
        setTimestepHours,
        systemStatus,
        refresh,
        setDemandKw,
        refreshTrigger,
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