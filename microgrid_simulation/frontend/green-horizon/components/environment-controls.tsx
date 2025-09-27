"use client"

import { useState, useEffect} from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Thermometer, Sun, Wind, Compass, Cloud, Play, Clock, Settings } from "lucide-react"
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
interface EnvironmentControlsProps {
  environment: any
  onUpdate: () => void
}

export function EnvironmentControls({ environment, onUpdate }: EnvironmentControlsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [timeStep, setTimeStep] = useState(1)

  const stepEnvironment = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`http://localhost:8000/step?timestep_hours=${timeStep}`, {
        method: "POST",
      })
      if (response.ok) {
        onUpdate()
      }
    } catch (error) {
      console.error("Failed to step environment:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!environment) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid gap-6 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Environment Status</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            {environment.time}
          </Badge>
        </div>
      </div>

      {/* Current Environment Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Current Environment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Thermometer className="h-5 w-5 text-chart-4" />
              <div>
                <p className="text-sm text-muted-foreground">Temperature</p>
                <p className="font-medium">{environment.temperature}°C</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Sun className="h-5 w-5 text-chart-3" />
              <div>
                <p className="text-sm text-muted-foreground">Solar Radiation</p>
                <p className="font-medium">{environment.solar_radiation} W/m²</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Wind className="h-5 w-5 text-chart-1" />
              <div>
                <p className="text-sm text-muted-foreground">Wind Speed</p>
                <p className="font-medium">{environment.wind_speed} m/s</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Compass className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Wind Direction</p>
                <p className="font-medium">{environment.wind_direction}°</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Cloud className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Cloud Cover</p>
                <p className="font-medium">{Math.round(environment.cloud_cover)}/9</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Time Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="timestep">Time Step (hours)</Label>
              <Input
                id="timestep"
                type="number"
                min="0.1"
                max="24"
                step="0.1"
                value={timeStep}
                onChange={(e) => setTimeStep(Number.parseFloat(e.target.value))}
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={stepEnvironment} disabled={isLoading} className="gap-2 w-full">
                <Play className="h-4 w-4" />
                Step Forward {timeStep}h
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Current simulation time: {environment.time}</p>
        </CardContent>
      </Card>
    </div>
  )
}