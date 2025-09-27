"use client"

import { useState, useEffect} from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Battery, Sun, Wind, Zap, Fuel, TrendingUp, TrendingDown, Activity, Leaf } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"
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

interface SystemOverviewProps {
  systemStatus: any
}

export function SystemOverview({ systemStatus }: SystemOverviewProps) {
  const { historicalData } = useMonitoring()

  if (!systemStatus) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const windTurbines = systemStatus.devices.filter((d: any) => d.type === "WindTurbine")
  const solarPanels = systemStatus.devices.filter((d: any) => d.type === "SolarPanel")
  const dieselGens = systemStatus.devices.filter((d: any) => d.type === "DieselGenerator")

  const totalWindPower = windTurbines.reduce((sum: number, t: any) => sum + t.power_output, 0)
  const totalSolarPower = solarPanels.reduce((sum: number, s: any) => sum + s.power_output, 0)
  const totalDieselPower = dieselGens.reduce((sum: number, d: any) => sum + d.power_output, 0)
  const totalRenewablePower = totalWindPower + totalSolarPower

  const totalBatteryCapacity = systemStatus.batteries.reduce((sum: number, b: any) => sum + b.capacity_kwh, 0)
  const totalBatteryCharge = systemStatus.batteries.reduce((sum: number, b: any) => sum + b.state_of_charge, 0)
  const avgBatterySOC =
    totalBatteryCapacity > 0 && !isNaN(totalBatteryCharge) && !isNaN(totalBatteryCapacity)
      ? (totalBatteryCharge / totalBatteryCapacity) * 100
      : 0

  const renewableRatio =
    systemStatus.total_generation > 0 ? (totalRenewablePower / systemStatus.total_generation) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Trend Charts */}
      {historicalData.length > 1 && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                Power Generation Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
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
                      dataKey="windPower"
                      stroke="var(--chart-1)"
                      strokeWidth={2}
                      name="Wind Power"
                      dot={{ fill: "var(--chart-1)", strokeWidth: 2, r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="solarPower"
                      stroke="var(--chart-3)"
                      strokeWidth={2}
                      name="Solar Power"
                      dot={{ fill: "var(--chart-3)", strokeWidth: 2, r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-accent" />
                Renewable Energy Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
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
                      formatter={(value: any, name: string) => [
                        `${Number(value).toFixed(1)}${name.includes("%") ? "%" : " kW"}`,
                        name,
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="renewableRatio"
                      stroke="var(--accent)"
                      fill="var(--accent)"
                      fillOpacity={0.3}
                      name="Renewable %"
                    />
                    <Area
                      type="monotone"
                      dataKey="batterySOC"
                      stroke="var(--chart-2)"
                      fill="var(--chart-2)"
                      fillOpacity={0.3}
                      name="Battery SOC %"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-accent/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Generation</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{systemStatus.total_generation.toFixed(1)} kW</div>
            <p className="text-xs text-muted-foreground">From {systemStatus.devices.length} devices</p>
          </CardContent>
        </Card>

        <Card className="border-accent/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Renewable Power</CardTitle>
            <Leaf className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{totalRenewablePower.toFixed(1)} kW</div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-accent">{renewableRatio.toFixed(0)}% of total</span>
            </div>
            <Progress value={renewableRatio} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="border-chart-2/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Battery Storage</CardTitle>
            <Battery className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">{avgBatterySOC.toFixed(0)}%</div>
            <Progress value={isNaN(avgBatterySOC) ? 0 : avgBatterySOC} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {totalBatteryCharge.toFixed(1)} / {totalBatteryCapacity.toFixed(1)} kWh
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grid Power</CardTitle>
            <Zap className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {Math.abs(systemStatus.total_grid_power).toFixed(1)} kW
            </div>
            <div className="flex items-center gap-1 mt-1">
              {systemStatus.total_grid_power > 0 ? (
                <>
                  <TrendingDown className="h-3 w-3 text-destructive" />
                  <span className="text-xs text-destructive">Importing</span>
                </>
              ) : systemStatus.total_grid_power < 0 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-accent" />
                  <span className="text-xs text-accent">Exporting</span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">Idle</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generation Breakdown */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-chart-1/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wind Power</CardTitle>
            <Wind className="h-4 w-4 text-chart-1" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-1">{totalWindPower.toFixed(1)} kW</div>
            <p className="text-xs text-muted-foreground">
              {windTurbines.length} turbine{windTurbines.length !== 1 ? "s" : ""}
            </p>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span>Wind Speed</span>
                <span className="text-accent">{systemStatus.environment.wind_speed} m/s</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Direction</span>
                <span className="text-accent">{systemStatus.environment.wind_direction}°</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-chart-3/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solar Power</CardTitle>
            <Sun className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-3">{totalSolarPower.toFixed(1)} kW</div>
            <p className="text-xs text-muted-foreground">
              {solarPanels.length} panel{solarPanels.length !== 1 ? "s" : ""}
            </p>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span>Radiation</span>
                <span className="text-accent">{systemStatus.environment.solar_radiation} W/m²</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Temperature</span>
                <span className="text-accent">{systemStatus.environment.temperature}°C</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-chart-4/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Diesel Power</CardTitle>
            <Fuel className="h-4 w-4 text-chart-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-4">{totalDieselPower.toFixed(1)} kW</div>
            <p className="text-xs text-muted-foreground">
              {dieselGens.length} generator{dieselGens.length !== 1 ? "s" : ""}
            </p>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span>Strategy</span>
                <span className="capitalize text-accent">{systemStatus.diesel_strategy.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Running</span>
                <span className="text-accent">{dieselGens.filter((d: any) => d.power_output > 0).length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status Card */}
      <Card className="border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-accent" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-lg font-semibold text-accent">Online</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Diesel Strategy</p>
              <Badge variant="outline" className="mt-1 border-accent/50 text-accent">
                {systemStatus.diesel_strategy}
              </Badge>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Renewable Ratio</p>
              <p className="text-lg font-semibold text-accent">{renewableRatio.toFixed(0)}%</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Grid Independence</p>
              <p className="text-lg font-semibold text-accent">
                {Math.abs(systemStatus.total_grid_power) < 10 ? "100" : "0"}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Device List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Devices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {systemStatus.devices.map((device: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  {device.type === "WindTurbine" && <Wind className="h-5 w-5 text-chart-1" />}
                  {device.type === "SolarPanel" && <Sun className="h-5 w-5 text-chart-3" />}
                  {device.type === "DieselGenerator" && <Fuel className="h-5 w-5 text-chart-4" />}
                  {device.type === "Battery" && <Battery className="h-5 w-5 text-chart-2" />}
                  {device.type === "GridConnection" && <Zap className="h-5 w-5 text-primary" />}
                  <div>
                    <p className="font-medium">{device.name}</p>
                    <p className="text-sm text-muted-foreground">{device.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{device.power_output.toFixed(1)} kW</p>
                  {device.type === "Battery" && (
                    <p className="text-sm text-muted-foreground">
                      {((device.state_of_charge / device.capacity_kwh) * 100).toFixed(0)}% SOC
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
