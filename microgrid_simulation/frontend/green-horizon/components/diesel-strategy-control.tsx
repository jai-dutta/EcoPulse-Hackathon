"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Fuel, Settings, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface DieselStrategyControlProps {
  currentStrategy: string
  onStrategyChange: () => void
}

const DIESEL_STRATEGIES = {
  demand_following: {
    label: "Demand Following",
    description: "Run diesel only to meet unmet demand",
    icon: "",
  },
  battery_charging: {
    label: "Battery Charging", 
    description: "Run diesel to charge battery when SOC < 30%",
    icon: "",
  },
  manual: {
    label: "Manual Control",
    description: "Use manually set setpoints for each generator",
    icon: "",
  },
}

export function DieselStrategyControl({ currentStrategy, onStrategyChange }: DieselStrategyControlProps) {
  const [selectedStrategy, setSelectedStrategy] = useState(currentStrategy)
  const [isLoading, setIsLoading] = useState(false)

  const handleStrategyChange = async () => {
    if (selectedStrategy === currentStrategy) {
      toast.info("Strategy is already set to this value")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(
        `http://localhost:8000/diesel/strategy?strategy=${selectedStrategy}`,
        { method: "POST" }
      )

      if (response.ok) {
        const data = await response.json()
        toast.success(`Diesel strategy changed to: ${DIESEL_STRATEGIES[selectedStrategy as keyof typeof DIESEL_STRATEGIES]?.label}`)
        onStrategyChange() // Trigger parent refresh
      } else {
        const error = await response.json()
        toast.error(`Failed to change strategy: ${error.detail}`)
      }
    } catch (error) {
      toast.error("Failed to communicate with server")
      console.error("Strategy change error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const currentStrategyInfo = DIESEL_STRATEGIES[currentStrategy as keyof typeof DIESEL_STRATEGIES]
  const selectedStrategyInfo = DIESEL_STRATEGIES[selectedStrategy as keyof typeof DIESEL_STRATEGIES]

  return (
    <Card className="border-chart-4/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fuel className="h-5 w-5 text-chart-4" />
          Diesel Generator Strategy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Strategy Display */}
        <div className="p-3 rounded-lg bg-chart-4/10 border border-chart-4/20">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-4 w-4 text-chart-4" />
            <span className="text-sm font-medium">Current Strategy</span>
          </div>
          <Badge variant="outline" className="border-chart-4/50 text-chart-4 mb-2">
            {currentStrategyInfo?.icon} {currentStrategyInfo?.label || currentStrategy}
          </Badge>
          <p className="text-xs text-muted-foreground">
            {currentStrategyInfo?.description || "Unknown strategy"}
          </p>
        </div>

        {/* Strategy Selection */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium">Change Strategy</span>
          </div>
          
          <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select strategy" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DIESEL_STRATEGIES).map(([key, strategy]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <span>{strategy.icon}</span>
                    <div>
                      <div className="font-medium">{strategy.label}</div>
                      <div className="text-xs text-foreground">{strategy.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Preview of selected strategy */}
          {selectedStrategy !== currentStrategy && (
            <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium">Preview</span>
              </div>
              <Badge variant="outline" className="border-accent/50 text-accent mb-2">
                {selectedStrategyInfo?.icon} {selectedStrategyInfo?.label}
              </Badge>
              <p className="text-xs text-muted-foreground">
                {selectedStrategyInfo?.description}
              </p>
            </div>
          )}

          <Button 
            onClick={handleStrategyChange}
            disabled={isLoading || selectedStrategy === currentStrategy}
            className="w-full gap-2"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Changing Strategy...
              </>
            ) : (
              <>
                <Settings className="h-4 w-4" />
                Apply Strategy Change
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}