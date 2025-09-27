"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Battery, Sun, Wind, Zap, Fuel, TrendingUp, TrendingDown, Activity } from "lucide-react"

interface SystemOverviewProps {
  systemStatus: any
}

export function SystemOverview({ systemStatus }: SystemOverviewProps) {
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

  const totalBatteryCapacity = systemStatus.batteries.reduce((sum: number, b: any) => sum + b.capacity_kwh, 0)
  const totalBatteryCharge = systemStatus.batteries.reduce((sum: number, b: any) => sum + b.state_of_charge, 0)
  const avgBatterySOC = totalBatteryCapacity > 0 ? (totalBatteryCharge / totalBatteryCapacity) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Generation</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{systemStatus.total_generation.toFixed(1)} kW</div>
            <p className="text-xs text-muted-foreground">From {systemStatus.devices.length} devices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Battery Storage</CardTitle>
            <Battery className="h-4 w-4 text-chart-2" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">{avgBatterySOC.toFixed(0)}%</div>
            <Progress value={avgBatterySOC} className="mt-2" />
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">Online</div>
            <Badge variant="outline" className="mt-2">
              {systemStatus.diesel_strategy}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Generation Breakdown */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
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
                <span>{systemStatus.environment.wind_speed} m/s</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Direction</span>
                <span>{systemStatus.environment.wind_direction}°</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
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
                <span>{systemStatus.environment.solar_radiation} W/m²</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Temperature</span>
                <span>{systemStatus.environment.temperature}°C</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
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
                <span className="capitalize">{systemStatus.diesel_strategy.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Running</span>
                <span>{dieselGens.filter((d: any) => d.power_output > 0).length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
