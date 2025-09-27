"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Play, RotateCcw, Timer, Square, Settings } from "lucide-react"
import { useSimulation } from "@/app/context/SimulationContext"

interface SimulationControlsProps {
  onUpdate: () => void
}

export function SimulationControls({ onUpdate }: SimulationControlsProps) {
  const {
    timestepHours,
    setTimestepHours,
    totalDailyKwh,
    setTotalDailyKwh,
    isAutoRunning,
    autoStepCount,
    autoInterval,
    setAutoInterval,
    toggleAutoStep,
    resetAutoStep,
  } = useSimulation()

  const [isLoading, setIsLoading] = useState(false)

  const resetParameters = () => {
    setTimestepHours(1)
    setTotalDailyKwh(150)
    resetAutoStep()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Simulation Controls</h2>
        {isAutoRunning && (
          <Badge variant="default" className="gap-1 bg-accent text-accent-foreground animate-pulse">
            <Timer className="h-3 w-3" />
            Auto Running ({autoStepCount} steps)
          </Badge>
        )}
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
            <div>
              <Label htmlFor="totalDailyKwh">Daily Usage (kWh)</Label>
              <Input
                id="totalDailyKwh"
                type="number"
                min="1"
                step="1"
                value={totalDailyKwh}
                onChange={(e) => setTotalDailyKwh(Number.parseInt(e.target.value))}
                className="mt-1"
                disabled={isAutoRunning}
              />
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
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2">
            <Button variant="outline" onClick={() => { setTotalDailyKwh(100); setTimestepHours(1) }} disabled={isAutoRunning} className="gap-2">
                <Settings className="h-4 w-4" />Low Consumption Scenario
            </Button>
            <Button variant="outline" onClick={() => { setTotalDailyKwh(500); setTimestepHours(1) }} disabled={isAutoRunning} className="gap-2">
                <Settings className="h-4 w-4" />High Consumption Scenario
            </Button>
        </CardContent>
      </Card>
    </div>
  )
}