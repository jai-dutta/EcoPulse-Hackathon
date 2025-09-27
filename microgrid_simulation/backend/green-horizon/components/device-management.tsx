"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Trash2, Wind, Sun, Battery, Fuel, Zap } from "lucide-react"

interface DeviceManagementProps {
  systemStatus: any
  onUpdate: () => void
}

export function DeviceManagement({ systemStatus, onUpdate }: DeviceManagementProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [deviceType, setDeviceType] = useState("windturbine")
  const [isLoading, setIsLoading] = useState(false)

  const addDevice = async (formData: FormData) => {
    setIsLoading(true)
    try {
      const endpoint = `http://localhost:8000/add/${deviceType}`
      const data: any = {
        name: formData.get("name"),
      }

      // Add device-specific fields
      switch (deviceType) {
        case "windturbine":
          data.rated_power = Number.parseFloat(formData.get("rated_power") as string)
          data.direction = Number.parseInt(formData.get("direction") as string)
          data.cut_in_speed = Number.parseFloat(formData.get("cut_in_speed") as string) || 3.0
          data.rated_speed = Number.parseFloat(formData.get("rated_speed") as string) || 12.0
          data.cut_out_speed = Number.parseFloat(formData.get("cut_out_speed") as string) || 25.0
          break
        case "solarpanel":
          data.rated_power = Number.parseFloat(formData.get("rated_power") as string)
          data.temp_coefficient = Number.parseFloat(formData.get("temp_coefficient") as string) || 0.004
          data.stc_temp = Number.parseFloat(formData.get("stc_temp") as string) || 25.0
          break
        case "battery":
          data.capacity_kwh = Number.parseFloat(formData.get("capacity_kwh") as string)
          data.max_power_kw = Number.parseFloat(formData.get("max_power_kw") as string)
          data.efficiency = Number.parseFloat(formData.get("efficiency") as string) || 0.9
          data.initial_charge = Number.parseFloat(formData.get("initial_charge") as string) || 0.5
          break
        case "dieselgenerator":
          data.rated_power = Number.parseFloat(formData.get("rated_power") as string)
          data.diesel_usage_litre_per_kw = Number.parseFloat(formData.get("diesel_usage_litre_per_kw") as string) || 0.4
          break
        case "gridconnection":
          data.import_price = Number.parseFloat(formData.get("import_price") as string)
          data.export_price = Number.parseFloat(formData.get("export_price") as string)
          break
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setIsAddDialogOpen(false)
        onUpdate()
      }
    } catch (error) {
      console.error("Failed to add device:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const removeDevice = async (deviceName: string) => {
    try {
      const response = await fetch(`http://localhost:8000/remove/${deviceName}`, {
        method: "DELETE",
      })
      if (response.ok) {
        onUpdate()
      }
    } catch (error) {
      console.error("Failed to remove device:", error)
    }
  }

  if (!systemStatus) {
    return <div>Loading device management...</div>
  }

  const windTurbines = systemStatus.devices.filter((d: any) => d.type === "WindTurbine")
  const solarPanels = systemStatus.devices.filter((d: any) => d.type === "SolarPanel")
  const batteries = systemStatus.devices.filter((d: any) => d.type === "Battery")
  const dieselGens = systemStatus.devices.filter((d: any) => d.type === "DieselGenerator")
  const gridConnections = systemStatus.devices.filter((d: any) => d.type === "GridConnection")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Device Management</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Device
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Device</DialogTitle>
            </DialogHeader>
            <form action={addDevice} className="space-y-4">
              <div>
                <Label htmlFor="deviceType">Device Type</Label>
                <select
                  id="deviceType"
                  value={deviceType}
                  onChange={(e) => setDeviceType(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md bg-background"
                >
                  <option value="windturbine">Wind Turbine</option>
                  <option value="solarpanel">Solar Panel</option>
                  <option value="battery">Battery</option>
                  <option value="dieselgenerator">Diesel Generator</option>
                  <option value="gridconnection">Grid Connection</option>
                </select>
              </div>

              <div>
                <Label htmlFor="name">Device Name</Label>
                <Input id="name" name="name" required />
              </div>

              {/* Device-specific fields */}
              {(deviceType === "windturbine" || deviceType === "solarpanel" || deviceType === "dieselgenerator") && (
                <div>
                  <Label htmlFor="rated_power">Rated Power (kW)</Label>
                  <Input id="rated_power" name="rated_power" type="number" step="0.1" required />
                </div>
              )}

              {deviceType === "windturbine" && (
                <>
                  <div>
                    <Label htmlFor="direction">Direction (degrees)</Label>
                    <Input id="direction" name="direction" type="number" min="0" max="360" required />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label htmlFor="cut_in_speed">Cut-in Speed</Label>
                      <Input id="cut_in_speed" name="cut_in_speed" type="number" step="0.1" placeholder="3.0" />
                    </div>
                    <div>
                      <Label htmlFor="rated_speed">Rated Speed</Label>
                      <Input id="rated_speed" name="rated_speed" type="number" step="0.1" placeholder="12.0" />
                    </div>
                    <div>
                      <Label htmlFor="cut_out_speed">Cut-out Speed</Label>
                      <Input id="cut_out_speed" name="cut_out_speed" type="number" step="0.1" placeholder="25.0" />
                    </div>
                  </div>
                </>
              )}

              {deviceType === "battery" && (
                <>
                  <div>
                    <Label htmlFor="capacity_kwh">Capacity (kWh)</Label>
                    <Input id="capacity_kwh" name="capacity_kwh" type="number" step="0.1" required />
                  </div>
                  <div>
                    <Label htmlFor="max_power_kw">Max Power (kW)</Label>
                    <Input id="max_power_kw" name="max_power_kw" type="number" step="0.1" required />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="efficiency">Efficiency</Label>
                      <Input
                        id="efficiency"
                        name="efficiency"
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        placeholder="0.90"
                      />
                    </div>
                    <div>
                      <Label htmlFor="initial_charge">Initial Charge</Label>
                      <Input
                        id="initial_charge"
                        name="initial_charge"
                        type="number"
                        step="0.01"
                        min="0"
                        max="1"
                        placeholder="0.5"
                      />
                    </div>
                  </div>
                </>
              )}

              {deviceType === "gridconnection" && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="import_price">Import Price</Label>
                    <Input id="import_price" name="import_price" type="number" step="0.01" required />
                  </div>
                  <div>
                    <Label htmlFor="export_price">Export Price</Label>
                    <Input id="export_price" name="export_price" type="number" step="0.01" required />
                  </div>
                </div>
              )}

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Adding..." : "Add Device"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="wind" className="space-y-4">
        <TabsList>
          <TabsTrigger value="wind" className="gap-2">
            <Wind className="h-4 w-4" />
            Wind ({windTurbines.length})
          </TabsTrigger>
          <TabsTrigger value="solar" className="gap-2">
            <Sun className="h-4 w-4" />
            Solar ({solarPanels.length})
          </TabsTrigger>
          <TabsTrigger value="battery" className="gap-2">
            <Battery className="h-4 w-4" />
            Battery ({batteries.length})
          </TabsTrigger>
          <TabsTrigger value="diesel" className="gap-2">
            <Fuel className="h-4 w-4" />
            Diesel ({dieselGens.length})
          </TabsTrigger>
          <TabsTrigger value="grid" className="gap-2">
            <Zap className="h-4 w-4" />
            Grid ({gridConnections.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wind" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {windTurbines.map((device: any, index: number) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base">{device.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDevice(device.name)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Power Output</span>
                      <Badge variant="outline">{device.power_output.toFixed(1)} kW</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Rated Power</span>
                      <span className="text-sm">{device.rated_power} kW</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Direction</span>
                      <span className="text-sm">{device.direction}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Speed Range</span>
                      <span className="text-sm">
                        {device.cut_in_speed}-{device.cut_out_speed} m/s
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="solar" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {solarPanels.map((device: any, index: number) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base">{device.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDevice(device.name)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Power Output</span>
                      <Badge variant="outline">{device.power_output.toFixed(1)} kW</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Rated Power</span>
                      <span className="text-sm">{device.rated_power} kW</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Temp Coefficient</span>
                      <span className="text-sm">{device.temp_coefficient}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="battery" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {batteries.map((device: any, index: number) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base">{device.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDevice(device.name)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Current Power</span>
                      <Badge variant="outline">{device.power_output.toFixed(1)} kW</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">State of Charge</span>
                      <span className="text-sm">{device.soc_percent.toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Capacity</span>
                      <span className="text-sm">{device.capacity_kwh} kWh</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Max Power</span>
                      <span className="text-sm">{device.max_power_kw} kW</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="diesel" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {dieselGens.map((device: any, index: number) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base">{device.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDevice(device.name)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Power Output</span>
                      <Badge variant="outline">{device.power_output.toFixed(1)} kW</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Rated Power</span>
                      <span className="text-sm">{device.rated_power} kW</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Fuel Usage</span>
                      <span className="text-sm">{device.current_diesel_usage?.toFixed(2) || 0} L/h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Setpoint</span>
                      <span className="text-sm">{device.manual_setpoint || "Auto"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="grid" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {gridConnections.map((device: any, index: number) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base">{device.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDevice(device.name)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Power Flow</span>
                      <Badge variant="outline">{device.power_output.toFixed(1)} kW</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Status</span>
                      <Badge
                        variant={
                          device.status === "importing"
                            ? "destructive"
                            : device.status === "exporting"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {device.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Import Price</span>
                      <span className="text-sm">${device.import_price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Export Price</span>
                      <span className="text-sm">${device.export_price}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
