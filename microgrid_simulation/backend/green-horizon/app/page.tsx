"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, Battery, Sun, Zap, Settings, Play, RefreshCw } from "lucide-react"
import { SystemOverview } from "@/components/system-overview"
import { DeviceManagement } from "@/components/device-management"
import { EnvironmentControls } from "@/components/environment-controls"
import { SimulationControls } from "@/components/simulation-controls"
import { RealTimeMonitoring } from "@/components/real-time-monitoring"

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

export default function MicrogridDashboard() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch("http://localhost:8000/")
      if (response.ok) {
        const data = await response.json()
        setSystemStatus(data)
      }
    } catch (error) {
      console.error("Failed to fetch system status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSystemStatus()
    const interval = setInterval(fetchSystemStatus, 5000) // Update every 5 seconds
    return () => clearInterval(interval)
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Microgrid Management</h1>
              <p className="text-sm text-muted-foreground">{systemStatus?.environment.time || "System Offline"}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant="outline" className="gap-1">
              <Activity className="h-3 w-3" />
              {systemStatus?.device_count || 0} Devices
            </Badge>
            <Button variant="outline" size="sm" onClick={fetchSystemStatus} className="gap-2 bg-transparent">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="gap-2">
              <Activity className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="devices" className="gap-2">
              <Settings className="h-4 w-4" />
              Devices
            </TabsTrigger>
            <TabsTrigger value="environment" className="gap-2">
              <Sun className="h-4 w-4" />
              Environment
            </TabsTrigger>
            <TabsTrigger value="simulation" className="gap-2">
              <Play className="h-4 w-4" />
              Simulation
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="gap-2">
              <Battery className="h-4 w-4" />
              Monitoring
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <SystemOverview systemStatus={systemStatus} />
          </TabsContent>

          <TabsContent value="devices" className="space-y-6">
            <DeviceManagement systemStatus={systemStatus} onUpdate={fetchSystemStatus} />
          </TabsContent>

          <TabsContent value="environment" className="space-y-6">
            <EnvironmentControls environment={systemStatus?.environment} onUpdate={fetchSystemStatus} />
          </TabsContent>

          <TabsContent value="simulation" className="space-y-6">
            <SimulationControls onUpdate={fetchSystemStatus} />
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <RealTimeMonitoring systemStatus={systemStatus} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
