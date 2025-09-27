"use client"

import { useState, useEffect, createContext, useContext } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Activity, Battery, Sun, Zap, Settings, Play, RefreshCw, AlertTriangle, BarChart3 } from "lucide-react"
import { SystemOverview } from "@/components/system-overview"
import { DeviceManagement } from "@/components/device-management"
import { SimulationControls } from "@/components/simulation-controls"
import { RealTimeMonitoring } from "@/components/real-time-monitoring"
import { SimulationAnalysis } from "@/components/simulation-analysis"

interface SystemStatus {
  timestamp: string
  environment: {
    time: string
    temperature: number
    solar_radiation: number
    wind_speed: number
    wind_direction: number
    cloud_cover: number
  }
  devices: Array<{
    name: string
    type: string
    power_output: number
    [key: string]: any
  }>
  batteries: Array<{
    name: string
    capacity_kwh: number
    max_power_kw: number
    state_of_charge: number
    current_power: number
    soc_percent: number
  }>
  grid_connections: Array<{
    name: string
    import_price: number
    export_price: number
    current_power: number
    status: string
  }>
  diesel_strategy: string
  total_generation: number
  total_storage_power: number
  total_grid_power: number
  device_count: number
}

const MonitoringContext = createContext<{
  onStepUpdate: () => void
  historicalData: any[]
}>({
  onStepUpdate: () => {},
  historicalData: [],
})

export const useMonitoring = () => useContext(MonitoringContext)

export default function MicrogridDashboard() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [historicalData, setHistoricalData] = useState<any[]>([])

  useEffect(() => {
    const interval = setInterval(() => {
      fetchSystemStatus() // always refresh every 500ms
    }, 500)

    return () => clearInterval(interval)
  }, [])

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch("http://localhost:8000/")
      if (response.ok) {
        const data = await response.json()
        setSystemStatus(data)
        setConnectionError(null)

        updateHistoricalData(data)
      } else {
        setConnectionError(`Server responded with status: ${response.status}`)
      }
    } catch (error) {
      console.error("Failed to fetch system status:", error)
      setConnectionError(
        "Cannot connect to API server. Make sure the FastAPI backend is running on http://localhost:8000",
      )
    } finally {
      setIsLoading(false)
    }
  }

  const updateHistoricalData = (data: SystemStatus) => {
    const environmentTime = new Date(data.environment.timestamp || data.timestamp)
    const timestepHours = environmentTime.getHours() + environmentTime.getMinutes() / 60

    const newDataPoint = {
      time: `${timestepHours.toFixed(1)}h`, // Format as "14.5h" for display
      timestepHours: timestepHours, // Actual numeric value for calculations
      timestamp: environmentTime.getTime(),
      totalGeneration: data.total_generation,
      batteryPower: data.total_storage_power,
      gridPower: data.total_grid_power,
      windPower: data.devices
        .filter((d: any) => d.type === "WindTurbine")
        .reduce((sum: number, d: any) => sum + d.power_output, 0),
      solarPower: data.devices
        .filter((d: any) => d.type === "SolarPanel")
        .reduce((sum: number, d: any) => sum + d.power_output, 0),
      dieselPower: data.devices
        .filter((d: any) => d.type === "DieselGenerator")
        .reduce((sum: number, d: any) => sum + d.power_output, 0),
      renewableRatio:
        data.total_generation > 0
          ? (data.devices
              .filter((d: any) => d.type === "WindTurbine" || d.type === "SolarPanel")
              .reduce((sum: number, d: any) => sum + d.power_output, 0) /
              data.total_generation) *
            100
          : 0,
      batterySOC:
        data.batteries.length > 0
          ? data.batteries.reduce((sum: number, b: any) => sum + b.soc_percent, 0) / data.batteries.length
          : 0,
    }

    setHistoricalData((prev) => {
      const updated = [...prev, newDataPoint]
      return updated.slice(-50) // Keep last 50 data points for better trend visibility
    })
  }

  const handleStepUpdate = () => {
    fetchSystemStatus()
  }

  useEffect(() => {
    fetchSystemStatus()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          <span className="text-lg">Loading Microgrid System...</span>
        </div>
      </div>
    )
  }

  return (
    <MonitoringContext.Provider value={{ onStepUpdate: handleStepUpdate, historicalData }}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
                <Zap className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Microgrid Management</h1>
                <p className="text-sm text-muted-foreground">{systemStatus?.environment.time || "System Offline"}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge
                variant={connectionError ? "destructive" : "outline"}
                className="gap-1 border-accent/50 text-accent"
              >
                <Activity className="h-3 w-3" />
                {connectionError ? "Offline" : `${systemStatus?.device_count || 0} Devices`}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchSystemStatus}
                className="gap-2 bg-transparent border-accent/50 text-accent hover:bg-accent/10"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          {connectionError && (
            <Alert className="mb-6 border-destructive/50 bg-destructive/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Connection Error:</strong> {connectionError}
                <br />
                <span className="text-sm mt-1 block">
                  To fix this: Start your FastAPI backend server by running{" "}
                  <code className="bg-muted px-1 rounded">python your_api_file.py</code> or{" "}
                  <code className="bg-muted px-1 rounded">uvicorn main:app --reload --port 8000</code>
                </span>
              </AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
<<<<<<< Updated upstream
            <TabsList className="grid w-full grid-cols-6">
=======
            <TabsList className="grid w-full grid-cols-4">
>>>>>>> Stashed changes
              <TabsTrigger value="overview" className="gap-2">
                <Activity className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="devices" className="gap-2">
                <Settings className="h-4 w-4" />
                Devices
              </TabsTrigger>
              <TabsTrigger value="simulation" className="gap-2">
                <Play className="h-4 w-4" />
                Simulation
              </TabsTrigger>
              <TabsTrigger value="monitoring" className="gap-2">
                <Battery className="h-4 w-4" />
                Monitoring
              </TabsTrigger>
              <TabsTrigger value="analysis" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Analysis
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <SystemOverview systemStatus={systemStatus} />
            </TabsContent>

            <TabsContent value="devices" className="space-y-6">
              <DeviceManagement systemStatus={systemStatus} onUpdate={fetchSystemStatus} />
            </TabsContent>

            <TabsContent value="simulation" className="space-y-6">
              <SimulationControls onUpdate={handleStepUpdate} />
            </TabsContent>

            <TabsContent value="monitoring" className="space-y-6">
              <RealTimeMonitoring systemStatus={systemStatus} />
            </TabsContent>

            <TabsContent value="analysis" className="space-y-6">
              <SimulationAnalysis systemStatus={systemStatus} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </MonitoringContext.Provider>
  )
}