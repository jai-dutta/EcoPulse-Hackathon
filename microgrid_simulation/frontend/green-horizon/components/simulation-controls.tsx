"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Play, Pause, RotateCcw, Zap, Fuel, Settings, TrendingUp, Activity, Timer, Square } from "lucide-react"
import { useMonitoring } from "@/app/page"

interface SimulationControlsProps {
  onUpdate: () => void
}

export function SimulationControls({ onUpdate }: SimulationControlsProps) {
  const { onStepUpdate } = useMonitoring()
  const [isLoading, setIsLoading] = useState(false)
  const [demandKw, setDemandKw] = useState(100)
  const [timestepHours, setTimestepHours] = useState(1)
  const [totalDailyKwh, setTotalDailyKwh] = useState(150)
  const [dieselStrategy, setDieselStrategy] = useState("demand_following")
  const [selectedGenerator, setSelectedGenerator] = useState("")
  const [generatorSetpoint, setGeneratorSetpoint] = useState(0)
  const [simulationResults, setSimulationResults] = useState<any>(null)

  const [isAutoRunning, setIsAutoRunning] = useState(false)
  const [autoInterval, setAutoInterval] = useState(5) // seconds
  const [useRealisticDemand, setUseRealisticDemand] = useState(false)
  const [autoStepCount, setAutoStepCount] = useState(0)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isAutoRunning) {
      intervalRef.current = setInterval(() => {
          runRealisticSimulation(true)
      }, autoInterval * 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isAutoRunning, autoInterval, useRealisticDemand, demandKw, timestepHours, totalDailyKwh])


  const runRealisticSimulation = async (isAutoStep = false) => {
    if (!isAutoStep) setIsLoading(true)
    try {
      const response = await fetch(
        `http://localhost:8000/simulate/realistic?total_daily_kwh=${totalDailyKwh}&timestep_hours=${timestepHours}`,
        { method: "POST" },
      )
      if (response.ok) {
        const data = await response.json()
        setSimulationResults(data.simulation_results)
        setDemandKw(data.calculated_demand)
        if (isAutoStep) {
          setAutoStepCount((prev) => prev + 1)
        }
        onStepUpdate()
        onUpdate()
      }
    } catch (error) {
      console.error("Failed to run realistic simulation:", error)
      if (isAutoStep) {
        // Stop auto-running on error
        setIsAutoRunning(false)
      }
    } finally {
      if (!isAutoStep) setIsLoading(false)
    }
  }

  const toggleAutoTimestep = () => {
    if (isAutoRunning) {
      setIsAutoRunning(false)
      setAutoStepCount(0)
    } else {
      setIsAutoRunning(true)
      setAutoStepCount(0)
    }
  }

  const resetAutoTimestep = () => {
    setIsAutoRunning(false)
    setAutoStepCount(0)
  }

  const setDieselControlStrategy = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`http://localhost:8000/diesel/strategy?strategy=${dieselStrategy}`, {
        method: "POST",
      })
      if (response.ok) {
        onUpdate()
      }
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
      if (response.ok) {
        onUpdate()
      }
    } catch (error) {
      console.error("Failed to set generator setpoint:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
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
              <p className="text-xs text-muted-foreground mt-1">Time between automatic steps</p>
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Switch
                id="useRealistic"
                checked={useRealisticDemand}
                onCheckedChange={setUseRealisticDemand}
                disabled={isAutoRunning}
              />
              <Label htmlFor="useRealistic" className="text-sm">
                Use Realistic Demand
              </Label>
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <Badge variant="secondary" className="text-xs">
                {autoStepCount} steps completed
              </Badge>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={toggleAutoTimestep}
              disabled={isLoading}
              className={`gap-2 flex-1 ${
                isAutoRunning ? "bg-destructive hover:bg-destructive/90" : "bg-accent hover:bg-accent/90"
              }`}
            >
              {isAutoRunning ? (
                <>
                  <Square className="h-4 w-4" />
                  Stop Auto-Timestep
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Start Auto-Timestep
                </>
              )}
            </Button>
            <Button onClick={resetAutoTimestep} disabled={isLoading} variant="outline" className="gap-2 bg-transparent">
              <RotateCcw className="h-4 w-4" />
              Reset
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
                min="1"
                step="1"
                value={totalDailyKwh}
                onChange={(e) => setTotalDailyKwh(Number.parseFloat(e.target.value))}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Expected daily energy consumption for realistic demand calculation
              </p>
            </div>
            <div>
              <Label htmlFor="realisticTimestep">Time Step (hours)</Label>
              <Input
                id="realisticTimestep"
                type="number"
                min="0.1"
                max="24"
                step="0.1"
                value={timestepHours}
                onChange={(e) => setTimestepHours(Number.parseFloat(e.target.value))}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Duration of the simulation step</p>
            </div>
          </div>
          <Button
            onClick={() => runRealisticSimulation(false)}
            disabled={isLoading || isAutoRunning}
            className="gap-2 w-full bg-transparent border-accent/50 text-accent hover:bg-accent/10"
            variant="outline"
          >
            <TrendingUp className="h-4 w-4" />
            Run Realistic Simulation Step
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Diesel Generator Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5 text-chart-4" />
            Diesel Generator Control
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="dieselStrategy">Control Strategy</Label>
            <Select value={dieselStrategy} onValueChange={setDieselStrategy}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
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
            <Settings className="h-4 w-4" />
            Apply Diesel Strategy
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
                placeholder="Generator name (e.g., diesel_gen_1)"
                value={selectedGenerator}
                onChange={(e) => setSelectedGenerator(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Enter the exact name of the diesel generator</p>
            </div>
            <div>
              <Label htmlFor="setpoint">Setpoint (kW)</Label>
              <Input
                id="setpoint"
                type="number"
                min="0"
                step="0.1"
                value={generatorSetpoint}
                onChange={(e) => setGeneratorSetpoint(Number.parseFloat(e.target.value))}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Manual power output setpoint</p>
            </div>
          </div>
          <Button
            onClick={setGeneratorManualSetpoint}
            disabled={isLoading || !selectedGenerator}
            className="gap-2 w-full"
          >
            <Settings className="h-4 w-4" />
            Set Generator Setpoint
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

            {simulationResults.diesel_usage && (
              <div className="mt-4 p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-2">Diesel Usage</p>
                <div className="grid gap-2 md:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Power</p>
                    <p className="font-medium">{simulationResults.diesel_usage.total_power?.toFixed(1) || "N/A"} kW</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Fuel Consumption</p>
                    <p className="font-medium">{simulationResults.diesel_usage.total_fuel?.toFixed(2) || "N/A"} L/h</p>
                  </div>
                </div>
              </div>
            )}

            {simulationResults.unmet_demand && simulationResults.unmet_demand > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive font-medium">
                  Unmet Demand: {simulationResults.unmet_demand.toFixed(1)} kW
                </p>
                <p className="text-xs text-muted-foreground mt-1">The system could not meet the full power demand</p>
              </div>
            )}

            {simulationResults.excess_generation && simulationResults.excess_generation > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-accent/10 border border-accent/20">
                <p className="text-sm text-accent font-medium">
                  Excess Generation: {simulationResults.excess_generation.toFixed(1)} kW
                </p>
                <p className="text-xs text-muted-foreground mt-1">The system generated more power than demanded</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-3">
            <Button
              variant="outline"
              onClick={() => {
                setDemandKw(50)
                setTimestepHours(1)
              }}
              className="gap-2"
              disabled={isAutoRunning}
            >
              <Pause className="h-4 w-4" />
              Low Demand Test
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setDemandKw(200)
                setTimestepHours(1)
              }}
              className="gap-2"
              disabled={isAutoRunning}
            >
              <TrendingUp className="h-4 w-4" />
              High Demand Test
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setDemandKw(100)
                setTimestepHours(1)
                setTotalDailyKwh(150)
                setSimulationResults(null)
                resetAutoTimestep()
              }}
              className="gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Parameters
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
