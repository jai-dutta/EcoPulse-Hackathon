"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Play, RotateCcw, Zap, Fuel, TrendingUp, Timer, Square, Activity, Settings } from "lucide-react"
import { useSimulation } from "@/app/context/SimulationContext"

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
    setAutoInterval,
    useRealisticDemand,
    setUseRealisticDemand,
    toggleAutoStep,
    resetAutoStep,
    runStep,
  } = useSimulation()

  const [isLoading, setIsLoading] = useState(false)
  const [dieselStrategy, setDieselStrategy] = useState("demand_following")
  const [selectedGenerator, setSelectedGenerator] = useState("")
  const [generatorSetpoint, setGeneratorSetpoint] = useState(0)

  const setDieselControlStrategy = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`http://localhost:8000/diesel/strategy?strategy=${dieselStrategy}`, { method: "POST" })
      if (response.ok) onUpdate()
    } catch (error) {
      console.error("Failed to set diesel strategy:", error)
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
      console.error("Failed to set generator setpoint:", error)
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
                min={1}
                max={60}
                step={1}
                value={autoInterval}
                onChange={(e) => setAutoInterval(Number(e.target.value))}
                className="mt-1"
                disabled={isAutoRunning}
              />
              <p className="text-xs text-muted-foreground mt-1">Time between automatic steps</p>
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Switch
                id="useRealistic"
                checked={useRealisticDemand}
                onCheckedChange={setUseRealisticDemand}
                disabled={isAutoRunning}
              />
              <Label htmlFor="useRealistic" className="text-sm">Use Realistic Demand</Label>
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Badge variant="secondary" className="text-xs">{autoStepCount} steps completed</Badge>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={toggleAutoStep}
              disabled={isLoading}
              className={`gap-2 flex-1 ${isAutoRunning ? "bg-destructive hover:bg-destructive/90" : "bg-accent hover:bg-accent/90"}`}
            >
              {isAutoRunning ? <><Square className="h-4 w-4" />Stop Auto-Timestep</> : <><Play className="h-4 w-4" />Start Auto-Timestep</>}
            </Button>
            <Button onClick={resetAutoStep} disabled={isLoading} variant="outline" className="gap-2 bg-transparent">
              <RotateCcw className="h-4 w-4" />Reset
            </Button>
          </div>

          <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg">
            <p className="font-medium mb-1">Auto-Timestep Mode:</p>
            <p>
              {useRealisticDemand
                ? `Running realistic demand simulation every ${autoInterval}s with ${totalDailyKwh} kWh daily consumption`
                : `Running manual simulation every ${autoInterval}s with ${demandKw} kW demand`}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Realistic Simulation Controls */}
      <Card className="border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            Realistic Demand Simulation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="dailyKwh">Total Daily Consumption (kWh)</Label>
              <Input
                id="dailyKwh"
                type="number"
                min={1}
                step={1}
                value={totalDailyKwh}
                onChange={(e) => setTotalDailyKwh(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="realisticTimestep">Time Step (hours)</Label>
              <Input
                id="realisticTimestep"
                type="number"
                min={0.1}
                max={24}
                step={0.1}
                value={timestepHours}
                onChange={(e) => setTimestepHours(Number(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>
          <Button
            onClick={() => runStep(false)}
            disabled={isLoading || isAutoRunning}
            className="gap-2 w-full bg-transparent border-accent/50 text-accent hover:bg-accent/10"
            variant="outline"
          >
            <TrendingUp className="h-4 w-4" />Run Realistic Simulation Step
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Diesel Generator Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5 text-chart-4" />Diesel Generator Control
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="dieselStrategy">Control Strategy</Label>
            <Select value={dieselStrategy} onValueChange={setDieselStrategy}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="demand_following">Demand Following</SelectItem>
                <SelectItem value="battery_charging">Battery Charging</SelectItem>
                <SelectItem value="manual">Manual Control</SelectItem>
              </SelectContent>
            </Select>
            <div className="mt-2 text-xs text-muted-foreground">
              {dieselStrategy === "demand_following" && "Run diesel only to meet unmet demand"}
              {dieselStrategy === "battery_charging" && "Run diesel to charge battery when SOC < 30%"}
              {dieselStrategy === "manual" && "Use manually set setpoints for each generator"}
            </div>
          </div>
          <Button onClick={setDieselControlStrategy} disabled={isLoading} className="gap-2 w-full">
            <Settings className="h-4 w-4" />Apply Diesel Strategy
          </Button>
        </CardContent>
      </Card>

      {/* Manual Generator Setpoint */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Manual Generator Setpoint
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="generator">Generator</Label>
              <Input
                id="generator"
                placeholder="Generator name"
                value={selectedGenerator}
                onChange={(e) => setSelectedGenerator(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="setpoint">Setpoint (kW)</Label>
              <Input
                id="setpoint"
                type="number"
                min={0}
                step={0.1}
                value={generatorSetpoint}
                onChange={(e) => setGeneratorSetpoint(Number(e.target.value))}
                className="mt-1"
              />
            </div>
          </div>
          <Button
            onClick={setGeneratorManualSetpoint}
            disabled={isLoading || !selectedGenerator}
            className="gap-2 w-full"
          >
            <Settings className="h-4 w-4" />Set Generator Setpoint
          </Button>
        </CardContent>
      </Card>

      {/* Simulation Results */}
      {simulationResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-accent" />
              Last Simulation Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Demand Met</p>
                <p className="text-lg font-semibold text-accent">
                  {simulationResults.demand_met?.toFixed(1) || "N/A"} kW
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Total Generation</p>
                <p className="text-lg font-semibold text-chart-1">
                  {simulationResults.total_generation?.toFixed(1) || "N/A"} kW
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Battery Power</p>
                <p className="text-lg font-semibold text-chart-2">
                  {simulationResults.battery_power?.toFixed(1) || "N/A"} kW
                </p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Grid Power</p>
                <p className="text-lg font-semibold text-primary">
                  {simulationResults.grid_power?.toFixed(1) || "N/A"} kW
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
