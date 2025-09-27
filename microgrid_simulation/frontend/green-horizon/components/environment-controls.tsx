"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Thermometer, Sun, Wind, Compass, Cloud, Play, RotateCcw, Clock, Settings } from "lucide-react"

interface EnvironmentControlsProps {
  environment: any
  onUpdate: () => void
}

export function EnvironmentControls({ environment, onUpdate }: EnvironmentControlsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [tempValue, setTempValue] = useState([environment?.temperature || 25])
  const [solarValue, setSolarValue] = useState([environment?.solar_radiation || 800])
  const [windSpeedValue, setWindSpeedValue] = useState([environment?.wind_speed || 5])
  const [windDirValue, setWindDirValue] = useState([environment?.wind_direction || 180])
  const [cloudValue, setCloudValue] = useState([environment?.cloud_cover || 2])
  const [timeStep, setTimeStep] = useState(1)

  const updateEnvironmentParameter = async (parameter: string, value: number) => {
    setIsLoading(true)
    try {
      const response = await fetch(`http://localhost:8000/environment/${parameter}?${parameter}=${value}`, {
        method: "POST",
      })
      if (response.ok) {
        onUpdate()
      }
    } catch (error) {
      console.error(`Failed to update ${parameter}:`, error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateMultipleParameters = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("http://localhost:8000/environment/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          temperature: tempValue[0],
          solar_radiation: solarValue[0],
          wind_speed: windSpeedValue[0],
          wind_direction: windDirValue[0],
          cloud_cover: cloudValue[0],
        }),
      })
      if (response.ok) {
        onUpdate()
      }
    } catch (error) {
      console.error("Failed to update environment:", error)
    } finally {
      setIsLoading(false)
    }
  }

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

  const resetEnvironment = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("http://localhost:8000/reset", {
        method: "POST",
      })
      if (response.ok) {
        onUpdate()
        // Reset local state to defaults
        setTempValue([25])
        setSolarValue([800])
        setWindSpeedValue([5])
        setWindDirValue([180])
        setCloudValue([2])
      }
    } catch (error) {
      console.error("Failed to reset environment:", error)
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
        <h2 className="text-2xl font-bold">Environment Controls</h2>
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
                <p className="font-medium">{environment.cloud_cover}/9</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Environment Parameter Controls */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Thermometer className="h-5 w-5 text-chart-4" />
              Temperature Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Temperature (°C)</Label>
                <Badge variant="outline">{tempValue[0]}°C</Badge>
              </div>
              <Slider value={tempValue} onValueChange={setTempValue} min={-20} max={50} step={0.5} className="w-full" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>-20°C</span>
                <span>50°C</span>
              </div>
            </div>
            <Button
              onClick={() => updateEnvironmentParameter("temperature", tempValue[0])}
              disabled={isLoading}
              className="w-full"
            >
              Update Temperature
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sun className="h-5 w-5 text-chart-3" />
              Solar Radiation Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Solar Radiation (W/m²)</Label>
                <Badge variant="outline">{solarValue[0]} W/m²</Badge>
              </div>
              <Slider
                value={solarValue}
                onValueChange={setSolarValue}
                min={0}
                max={1400}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0 W/m²</span>
                <span>1400 W/m²</span>
              </div>
            </div>
            <Button
              onClick={() => updateEnvironmentParameter("solar_radiation", solarValue[0])}
              disabled={isLoading}
              className="w-full"
            >
              Update Solar Radiation
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wind className="h-5 w-5 text-chart-1" />
              Wind Speed Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Wind Speed (m/s)</Label>
                <Badge variant="outline">{windSpeedValue[0]} m/s</Badge>
              </div>
              <Slider
                value={windSpeedValue}
                onValueChange={setWindSpeedValue}
                min={0}
                max={30}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0 m/s</span>
                <span>30 m/s</span>
              </div>
            </div>
            <Button
              onClick={() => updateEnvironmentParameter("wind_speed", windSpeedValue[0])}
              disabled={isLoading}
              className="w-full"
            >
              Update Wind Speed
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Compass className="h-5 w-5 text-primary" />
              Wind Direction Control
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Wind Direction (degrees)</Label>
                <Badge variant="outline">{windDirValue[0]}°</Badge>
              </div>
              <Slider
                value={windDirValue}
                onValueChange={setWindDirValue}
                min={0}
                max={359}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0° (N)</span>
                <span>359° (N)</span>
              </div>
            </div>
            <Button
              onClick={() => updateEnvironmentParameter("wind_direction", windDirValue[0])}
              disabled={isLoading}
              className="w-full"
            >
              Update Wind Direction
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Cloud Cover Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-muted-foreground" />
            Cloud Cover Control
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Cloud Cover (0-9 scale)</Label>
              <Badge variant="outline">{cloudValue[0]}/9</Badge>
            </div>
            <Slider value={cloudValue} onValueChange={setCloudValue} min={0} max={9} step={1} className="w-full" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0 (Clear)</span>
              <span>9 (Overcast)</span>
            </div>
          </div>
          <Button
            onClick={() => updateEnvironmentParameter("cloud_cover", cloudValue[0])}
            disabled={isLoading}
            className="w-full"
          >
            Update Cloud Cover
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Batch Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Button onClick={updateMultipleParameters} disabled={isLoading} className="gap-2">
              <Settings className="h-4 w-4" />
              Apply All Changes
            </Button>
            <Button variant="outline" onClick={resetEnvironment} disabled={isLoading} className="gap-2 bg-transparent">
              <RotateCcw className="h-4 w-4" />
              Reset Environment
            </Button>
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
