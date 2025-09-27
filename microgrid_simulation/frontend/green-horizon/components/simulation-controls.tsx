"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Play, Pause, RotateCcw, Zap, Fuel, Settings, TrendingUp, Activity, Timer, Square } from "lucide-react"
import { useSimulation } from "@/app/context/SimulationContext"
export function DeviceManagementWrapper() {
  const { refresh } = useSimulation()

  useEffect(() => {
    // Refresh immediately on mount
    refresh()

    // Set up interval (e.g., every 2 seconds)
    const interval = setInterval(() => {
      refresh()
    }, 2000)

    // Clean up on unmount
    return () => clearInterval(interval)
  }, [refresh])

  return <SimulationControls onUpdate={refresh} />
}
interface SimulationControlsProps {
  onUpdate: () => void
}

export function SimulationControls({ onUpdate }: SimulationControlsProps) {
  const {
    demandKw,
    setDemandKw,
    timestepHours,
    setTimestepHours,
    totalDailyKwh,
    setTotalDailyKwh,
    simulationResults,
    isAutoRunning,
    autoStepCount,
    autoInterval,
    useRealisticDemand,
    setAutoInterval,
    setUseRealisticDemand,
    toggleAutoStep,
    resetAutoStep,
    runStep,
  } = useSimulation()

  const [isLoading, setIsLoading] = useState(false)
  const [dieselStrategy, setDieselStrategy] = useState("demand_following")
  const [selectedGenerator, setSelectedGenerator] = useState("")
  const [generatorSetpoint, setGeneratorSetpoint] = useState(0)

  const resetParameters = () => {
    setDemandKw(100)
    setTimestepHours(1)
    setTotalDailyKwh(150)
    resetAutoStep()
  }

  const setDieselControlStrategy = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`http://localhost:8000/diesel/strategy?strategy=${dieselStrategy}`, { method: "POST" })
      if (response.ok) onUpdate()
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const setGeneratorManualSetpoint = async () => {
    if (!selectedGenerator) return
    setIsLoading(true)
    try {
      const response = await fetch(`http://localhost:8000/diesel/${selectedGenerator}/setpoint`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setpoint_kw: generatorSetpoint }),
      })
      if (response.ok) onUpdate()
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Simulation Controls</h2>
        <div className="flex items-center gap-2">
          {isAutoRunning && (
            <Badge variant="default" className="gap-1 bg-accent text-accent-foreground animate-pulse">
              <Timer className="h-3 w-3" />
              Auto Running ({autoStepCount} steps)
            </Badge>
          )}
          <Badge variant="outline" className="gap-1 border-accent/50 text-accent">
            <Activity className="h-3 w-3" />
            Step-based Engine
          </Badge>
        </div>
      </div>

      {/* Auto-Timestep Control */}
      <Card className="border-accent/20 bg-gradient-to-r from-accent/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-accent" />
            Auto-Timestep Control
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="autoInterval">Interval (seconds)</Label>
              <Input
                id="autoInterval"
                type="number"
                min="1"
                max="60"
                step="1"
                value={autoInterval}
                onChange={(e) => setAutoInterval(Number.parseInt(e.target.value))}
                className="mt-1"
                disabled={isAutoRunning}
              />
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Switch id="useRealistic" checked={useRealisticDemand} onCheckedChange={setUseRealisticDemand} disabled={isAutoRunning} />
              <Label htmlFor="useRealistic" className="text-sm">Use Realistic Demand</Label>
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Badge variant="secondary" className="text-xs">{autoStepCount} steps completed</Badge>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={toggleAutoStep} disabled={isLoading} className={`gap-2 flex-1 ${isAutoRunning ? "bg-destructive hover:bg-destructive/90" : "bg-accent hover:bg-accent/90"}`}>
              {isAutoRunning ? <><Square className="h-4 w-4" />Stop Auto-Timestep</> : <><Play className="h-4 w-4" />Start Auto-Timestep</>}
            </Button>
            <Button onClick={resetAutoStep} disabled={isLoading} variant="outline" className="gap-2 bg-transparent">
              <RotateCcw className="h-4 w-4" />Reset
            </Button>
          </div>

          <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg">
            {useRealisticDemand
              ? `Running realistic demand simulation every ${autoInterval}s with ${totalDailyKwh} kWh daily consumption`
              : `Running manual simulation every ${autoInterval}s with ${demandKw} kW demand`}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-3">
          <Button variant="outline" onClick={() => { setDemandKw(50); setTimestepHours(1) }} disabled={isAutoRunning} className="gap-2">
            <Pause className="h-4 w-4" />Low Demand Test
          </Button>
          <Button variant="outline" onClick={() => { setDemandKw(200); setTimestepHours(1) }} disabled={isAutoRunning} className="gap-2">
            <TrendingUp className="h-4 w-4" />High Demand Test
          </Button>
          <Button variant="outline" onClick={resetParameters} className="gap-2">
            <RotateCcw className="h-4 w-4" />Reset Parameters
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
