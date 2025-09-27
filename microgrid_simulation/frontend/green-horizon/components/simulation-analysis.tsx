"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { BarChart3, CloudCog, Coins, Leaf, Zap, Fuel, AlertTriangle, RefreshCw } from "lucide-react"

interface SimulationAnalysisProps {
  systemStatus: any
}

interface AnalysisResult {
  with_renewable: ScenarioResult
  without_renewable: ScenarioResult
  savings: SavingsResult
}

interface ScenarioResult {
  total_cost: number
  co2_emissions_kg: number
  diesel_usage_l: number
  grid_import_kwh: number
  renewable_generation_kwh: number
}

interface SavingsResult {
  cost_saved: number
  co2_saved_kg: number
  cost_saving_percent: number
  co2_saving_percent: number
}

export function SimulationAnalysis({ systemStatus }: SimulationAnalysisProps) {
  const [selectedDevice, setSelectedDevice] = useState<string>("")
  const [duration, setDuration] = useState<number>(30)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const renewableDevices =
    systemStatus?.devices.filter((d: any) => d.type === "WindTurbine" || d.type === "SolarPanel") || []

  const runAnalysis = async () => {
    if (!selectedDevice) {
      setError("Please select a renewable device to analyze.")
      return
    }
    setIsLoading(true)
    setError(null)
    setAnalysisResult(null)

    try {
      const response = await fetch(`http://localhost:8000/analyze/scenario`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exclude_device_name: selectedDevice,
          duration_days: duration,
        }),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.detail || `API Error: ${response.statusText}`)
      }

      const data = await response.json()
      setAnalysisResult(data)
    } catch (err: any) {
      console.error("Analysis failed:", err)
      setError(err.message || "Failed to run analysis. Check the console and backend server for details.")
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }).format(value)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Scenario Analysis</h2>
        <Badge variant="outline" className="gap-1 border-accent/50 text-accent">
          <BarChart3 className="h-3 w-3" />
          Comparative Simulation
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Run Impact Analysis</CardTitle>
          <CardDescription>
            Select a renewable device and a time period to simulate its removal from the grid. This analysis
            calculates the financial and environmental impact.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row items-end gap-4">
          <div className="w-full md:w-1/3">
            <Label htmlFor="device-select">Renewable Device</Label>
            <Select value={selectedDevice} onValueChange={setSelectedDevice}>
              <SelectTrigger id="device-select">
                <SelectValue placeholder="Select a device..." />
              </SelectTrigger>
              <SelectContent>
                {renewableDevices.map((device: any) => (
                  <SelectItem key={device.name} value={device.name}>
                    {device.name} ({device.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-1/4">
            <Label htmlFor="duration-days">Duration (days)</Label>
            <Input
              id="duration-days"
              type="number"
              value={duration}
              onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              className="mt-1"
            />
          </div>
          <Button
            onClick={runAnalysis}
            disabled={isLoading || !selectedDevice}
            className="w-full md:w-auto gap-2 flex-grow"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              `Run ${duration}-Day Analysis`
            )}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/50 bg-destructive/10 text-destructive">
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <CardTitle>Analysis Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
        </Card>
      )}

      {analysisResult && (
        <div className="space-y-6">
          <Card className="bg-gradient-to-r from-accent/10 to-transparent border-accent/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-accent">
                <Leaf className="h-6 w-6" />
                Analysis Complete: Impact of removing {selectedDevice}
              </CardTitle>
              <CardDescription>
                Summary of a {duration}-day simulation comparing the microgrid with and without the selected renewable
                source.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-3">
              <div className="flex flex-col items-center justify-center p-6 rounded-lg bg-card border">
                <p className="text-sm text-muted-foreground">CO₂ Emissions Saved</p>
                <p className="text-3xl font-bold text-accent mt-1">
                  {formatNumber(analysisResult.savings.co2_saved_kg)} kg
                </p>
                <p className="text-sm font-medium text-accent">
                  ({analysisResult.savings.co2_saving_percent.toFixed(0)}% reduction)
                </p>
              </div>
              <div className="flex flex-col items-center justify-center p-6 rounded-lg bg-card border">
                <p className="text-sm text-muted-foreground">Total Cost Saved</p>
                <p className="text-3xl font-bold text-accent mt-1">
                  {formatCurrency(analysisResult.savings.cost_saved)}
                </p>
                <p className="text-sm font-medium text-accent">
                  ({analysisResult.savings.cost_saving_percent.toFixed(0)}% reduction)
                </p>
              </div>
              <div className="flex flex-col items-center justify-center p-6 rounded-lg bg-card border">
                <p className="text-sm text-muted-foreground">Renewable Contribution</p>
                <p className="text-3xl font-bold text-accent mt-1">
                  {formatNumber(analysisResult.with_renewable.renewable_generation_kwh)} kWh
                </p>
                <p className="text-sm font-medium text-muted-foreground">Generated by {selectedDevice}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Scenario: With {selectedDevice}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-sm">
                    <Coins className="h-4 w-4 text-primary" /> Total Cost
                  </span>
                  <span className="font-mono text-lg">
                    {formatCurrency(analysisResult.with_renewable.total_cost)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-sm">
                    <CloudCog className="h-4 w-4 text-muted-foreground" /> CO₂ Emissions
                  </span>
                  <span className="font-mono text-lg">
                    {formatNumber(analysisResult.with_renewable.co2_emissions_kg)} kg
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-sm">
                    <Fuel className="h-4 w-4 text-chart-4" /> Diesel Usage
                  </span>
                  <span className="font-mono text-lg">{formatNumber(analysisResult.with_renewable.diesel_usage_l)} L</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-sm">
                    <Zap className="h-4 w-4 text-chart-1" /> Grid Import
                  </span>
                  <span className="font-mono text-lg">
                    {formatNumber(analysisResult.with_renewable.grid_import_kwh)} kWh
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Baseline: Without {selectedDevice}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-sm">
                    <Coins className="h-4 w-4 text-primary" /> Total Cost
                  </span>
                  <span className="font-mono text-lg">
                    {formatCurrency(analysisResult.without_renewable.total_cost)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-sm">
                    <CloudCog className="h-4 w-4 text-muted-foreground" /> CO₂ Emissions
                  </span>
                  <span className="font-mono text-lg">
                    {formatNumber(analysisResult.without_renewable.co2_emissions_kg)} kg
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-sm">
                    <Fuel className="h-4 w-4 text-chart-4" /> Diesel Usage
                  </span>
                  <span className="font-mono text-lg">
                    {formatNumber(analysisResult.without_renewable.diesel_usage_l)} L
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-sm">
                    <Zap className="h-4 w-4 text-chart-1" /> Grid Import
                  </span>
                  <span className="font-mono text-lg">
                    {formatNumber(analysisResult.without_renewable.grid_import_kwh)} kWh
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}