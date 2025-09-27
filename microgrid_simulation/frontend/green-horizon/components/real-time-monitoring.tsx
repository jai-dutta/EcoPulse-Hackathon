"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Battery, Fuel, Sun, Wind, Zap, Activity, TrendingUp, TrendingDown, AlertTriangle, Leaf } from "lucide-react"
import { useMonitoring } from "@/app/page"
import { useSimulation } from "@/app/context/SimulationContext"
import { SimulationControls } from "./simulation-controls"

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
interface RealTimeMonitoringProps {
  systemStatus: any
}

export function RealTimeMonitoring({ systemStatus }: RealTimeMonitoringProps) {
  const { historicalData } = useMonitoring()
  const [batteryStatus, setBatteryStatus] = useState<any[]>([])
  const [dieselStatus, setDieselStatus] = useState<any>(null)
  const [gridStatus, setGridStatus] = useState<any[]>([])

  useEffect(() => {
    const fetchMonitoringData = async () => {
      if (!systemStatus) return

      try {
        // Fetch battery status
        const batteryResponse = await fetch("http://localhost:8000/batteries/status")
        if (batteryResponse.ok) {
          const batteryData = await batteryResponse.json()
          setBatteryStatus(batteryData.batteries)
        }

        // Fetch diesel status
        const dieselResponse = await fetch("http://localhost:8000/diesel/status")
        if (dieselResponse.ok) {
          const dieselData = await dieselResponse.json()
          setDieselStatus(dieselData)
        }

        // Fetch grid status
        const gridResponse = await fetch("http://localhost:8000/grids/status")
        if (gridResponse.ok) {
          const gridData = await gridResponse.json()
          setGridStatus(gridData.grid_connections)
        }
      } catch (error) {
        console.error("Failed to fetch monitoring data:", error)
      }
    }

    fetchMonitoringData()
  }, [systemStatus]) // Only fetch when systemStatus changes (step-based)

  if (!systemStatus) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-4"></div>
          <div className="grid gap-6 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const windTurbines = systemStatus.devices.filter((d: any) => d.type === "WindTurbine")
  const solarPanels = systemStatus.devices.filter((d: any) => d.type === "SolarPanel")
  const dieselGens = systemStatus.devices.filter((d: any) => d.type === "DieselGenerator")

  const totalWindPower = windTurbines.reduce((sum: number, t: any) => sum + t.power_output, 0)
  const totalSolarPower = solarPanels.reduce((sum: number, s: any) => sum + s.power_output, 0)
  const totalDieselPower = dieselGens.reduce((sum: number, d: any) => sum + d.power_output, 0)

  // Generation mix data for pie chart
  const generationMixData = [
    { name: "Wind", value: totalWindPower, color: "var(--chart-1)" },
    { name: "Solar", value: totalSolarPower, color: "var(--chart-3)" },
    { name: "Diesel", value: totalDieselPower, color: "var(--chart-4)" },
  ].filter((item) => item.value > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Real-time Monitoring</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 border-accent/50 text-accent">
            <Activity className="h-3 w-3" />
            Step-based Updates
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">System Overview</TabsTrigger>
          <TabsTrigger value="generation">Generation</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Real-time Power Flow Chart */}
          <Card className="border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                Power Flow Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="timestepHours"
                      stroke="#9ca3af"
                      fontSize={12}
                      tickFormatter={(value) => `${value.toFixed(1)}h`}
                      domain={["dataMin", "dataMax"]}
                    />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                      }}
                      labelFormatter={(value) => `Time: ${value.toFixed(1)} hours`}
                      formatter={(value: any, name: string) => [`${Number(value).toFixed(1)} kW`, name]}
                    />
                    <Line
                      type="monotone"
                      dataKey="totalGeneration"
                      stroke="var(--accent)"
                      strokeWidth={2}
                      name="Total Generation"
                      dot={{ fill: "var(--accent)", strokeWidth: 2, r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="batteryPower"
                      stroke="var(--chart-2)"
                      strokeWidth={2}
                      name="Battery Power"
                      dot={{ fill: "var(--chart-2)", strokeWidth: 2, r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="gridPower"
                      stroke="var(--primary)"
                      strokeWidth={2}
                      name="Grid Power"
                      dot={{ fill: "var(--primary)", strokeWidth: 2, r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Generation Mix */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-accent" />
                  Generation Mix
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={generationMixData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {generationMixData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1f2937",
                          border: "1px solid #374151",
                          borderRadius: "8px",
                        }}
                        formatter={(value: any) => [`${value.toFixed(1)} kW`, "Power"]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-4">
                  {generationMixData.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm">{item.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-accent" />
                  System Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {systemStatus.total_generation === 0 && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <span className="text-sm text-destructive">No power generation detected</span>
                    </div>
                  )}

                  {systemStatus.batteries.some((b: any) => b.soc_percent < 20) && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
                      <Battery className="h-4 w-4 text-destructive" />
                      <span className="text-sm text-destructive">Low battery charge detected</span>
                    </div>
                  )}

                  {Math.abs(systemStatus.total_grid_power) > 100 && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <TrendingUp className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-yellow-500">High grid power flow</span>
                    </div>
                  )}

                  {systemStatus.total_generation > 0 &&
                    systemStatus.batteries.every((b: any) => b.soc_percent > 80) && (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-accent/10 border border-accent/20">
                        <Leaf className="h-4 w-4 text-accent" />
                        <span className="text-sm text-accent">System operating optimally</span>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="generation" className="space-y-6">
          {/* Generation Sources Chart */}
          <Card className="border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-accent" />
                Generation Sources Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="timestepHours"
                      stroke="#9ca3af"
                      fontSize={12}
                      tickFormatter={(value) => `${value.toFixed(1)}h`}
                      domain={["dataMin", "dataMax"]}
                    />
                    <YAxis stroke="#9ca3af" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1f2937",
                        border: "1px solid #374151",
                        borderRadius: "8px",
                      }}
                      labelFormatter={(value) => `Time: ${value.toFixed(1)} hours`}
                      formatter={(value: any, name: string) => [`${Number(value).toFixed(1)} kW`, name]}
                    />
                    <Area
                      type="monotone"
                      dataKey="windPower"
                      stackId="1"
                      stroke="var(--chart-1)"
                      fill="var(--chart-1)"
                      fillOpacity={0.6}
                      name="Wind"
                    />
                    <Area
                      type="monotone"
                      dataKey="solarPower"
                      stackId="1"
                      stroke="var(--chart-3)"
                      fill="var(--chart-3)"
                      fillOpacity={0.6}
                      name="Solar"
                    />
                    <Area
                      type="monotone"
                      dataKey="dieselPower"
                      stackId="1"
                      stroke="var(--chart-4)"
                      fill="var(--chart-4)"
                      fillOpacity={0.6}
                      name="Diesel"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Individual Generator Performance */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="border-accent/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">Wind Turbines</CardTitle>
                <Wind className="h-4 w-4 text-chart-1" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-chart-1">{totalWindPower.toFixed(1)} kW</div>
                <div className="space-y-2 mt-3">
                  {windTurbines.map((turbine: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{turbine.name}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={(turbine.power_output / turbine.rated_power) * 100} className="w-16 h-2" />
                        <span className="text-xs w-12 text-right">{turbine.power_output.toFixed(1)}kW</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-accent/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">Solar Panels</CardTitle>
                <Sun className="h-4 w-4 text-chart-3" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-chart-3">{totalSolarPower.toFixed(1)} kW</div>
                <div className="space-y-2 mt-3">
                  {solarPanels.map((panel: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{panel.name}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={(panel.power_output / panel.rated_power) * 100} className="w-16 h-2" />
                        <span className="text-xs w-12 text-right">{panel.power_output.toFixed(1)}kW</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-accent/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">Diesel Generators</CardTitle>
                <Fuel className="h-4 w-4 text-chart-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-chart-4">{totalDieselPower.toFixed(1)} kW</div>
                <div className="space-y-2 mt-3">
                  {dieselGens.map((gen: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{gen.name}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={(gen.power_output / gen.rated_power) * 100} className="w-16 h-2" />
                        <span className="text-xs w-12 text-right">{gen.power_output.toFixed(1)}kW</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="storage" className="space-y-6">
          {/* Battery Status Overview */}
          <div className="grid gap-6 md:grid-cols-2">
            {batteryStatus.map((battery: any, index: number) => (
              <Card key={index} className="border-accent/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base">{battery.name}</CardTitle>
                  <Battery className="h-4 w-4 text-chart-2" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm">State of Charge</span>
                        <span className="text-sm font-medium">{battery.soc_percent.toFixed(0)}%</span>
                      </div>
                      <Progress value={battery.soc_percent} className="h-3" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Current Power</p>
                        <p className="font-medium">{battery.current_power.toFixed(1)} kW</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Capacity</p>
                        <p className="font-medium">{battery.capacity_kwh} kWh</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Max Power</p>
                        <p className="font-medium">{battery.max_power_kw} kW</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Efficiency</p>
                        <p className="font-medium">{(battery.efficiency * 100).toFixed(0)}%</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {battery.current_power > 0 ? (
                        <>
                          <TrendingDown className="h-4 w-4 text-destructive" />
                          <span className="text-sm text-destructive">Discharging</span>
                        </>
                      ) : battery.current_power < 0 ? (
                        <>
                          <TrendingUp className="h-4 w-4 text-accent" />
                          <span className="text-sm text-accent">Charging</span>
                        </>
                      ) : (
                        <>
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Idle</span>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Grid Connections */}
          {gridStatus.length > 0 && (
            <Card className="border-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-accent" />
                  Grid Connections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {gridStatus.map((grid: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{grid.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Import: ${grid.import_price} | Export: ${grid.export_price}
                        </p>
                      </div>
                      <div className="text-right">
                      <p className="font-medium">{Math.abs(grid.current_power).toFixed(1)} kW</p>
                      <p className="font-medium">
                        ${Math.round(Math.abs(grid.current_power) * (grid.status === "importing" ? grid.import_price : grid.export_price)).toFixed(1)} / h
                      </p>

                  
                        <Badge
                          variant={
                            grid.status === "importing"
                              ? "destructive"
                              : grid.status === "exporting"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {grid.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Diesel Performance */}
          {dieselStatus && (
            <Card className="border-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fuel className="h-5 w-5 text-chart-4" />
                  Diesel Generator Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-4 mb-6">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Total Output</p>
                    <p className="text-lg font-semibold">
                      {dieselStatus.summary?.total_diesel_output?.toFixed(1) || 0} kW
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Fuel Usage</p>
                    <p className="text-lg font-semibold">
                      {dieselStatus.summary?.total_diesel_usage_lph?.toFixed(2) || 0} L/h
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Running Units</p>
                    <p className="text-lg font-semibold">
                      {dieselStatus.summary?.running_generators || 0}/{dieselStatus.summary?.total_generators || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground">Fleet Utilization</p>
                    <p className="text-lg font-semibold">{dieselStatus.summary?.fleet_utilization?.toFixed(0) || 0}%</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {dieselStatus.diesel_generators?.map((gen: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium">{gen.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {gen.rated_power} kW rated | {gen.diesel_usage_rate} L/kW
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{gen.current_output.toFixed(1)} kW</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={gen.utilization_percent} className="w-16 h-2" />
                          <span className="text-xs">{gen.utilization_percent.toFixed(0)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Efficiency Metrics */}
          <Card className="border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                System Efficiency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-2">Renewable Ratio</p>
                  <div className="text-2xl font-bold text-accent">
                    {systemStatus.total_generation > 0
                      ? (((totalWindPower + totalSolarPower) / systemStatus.total_generation) * 100).toFixed(0)
                      : 0}
                    %
                  </div>
                  <Progress
                    value={
                      systemStatus.total_generation > 0
                        ? ((totalWindPower + totalSolarPower) / systemStatus.total_generation) * 100
                        : 0
                    }
                    className="mt-2"
                  />
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-2">Battery Utilization</p>
                  <div className="text-2xl font-bold text-chart-2">
                    {systemStatus.batteries.length > 0
                      ? (
                          systemStatus.batteries.reduce((sum: number, b: any) => sum + b.soc_percent, 0) /
                          systemStatus.batteries.length
                        ).toFixed(0)
                      : 0}
                    %
                  </div>
                  <Progress
                    value={
                      systemStatus.batteries.length > 0
                        ? systemStatus.batteries.reduce((sum: number, b: any) => sum + b.soc_percent, 0) /
                          systemStatus.batteries.length
                        : 0
                    }
                    className="mt-2"
                  />
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-2">Grid Independence</p>
                  <div className="text-2xl font-bold text-primary">
                    {Math.abs(systemStatus.total_grid_power) < 10 ? "100" : "0"}%
                  </div>
                  <Progress value={Math.abs(systemStatus.total_grid_power) < 10 ? 100 : 0} className="mt-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
