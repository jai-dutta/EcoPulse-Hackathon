"""
power_simulation.py

This file represents multiple power generation and storage devices.
"""

from environment_simulation import Environment
import math
from datetime import datetime
import random

class PowerDevice:
    def __init__(self, name: str):
        self.name: str = name
        self.power_output = 0.0  # Current power output in kW

    def update_output(self, environment: Environment) -> None:
        pass

    def get_power_output(self) -> float:
        return self.power_output

    def __str__(self) -> str:
        return self.name

class WindTurbine(PowerDevice):
    # ADDED: Realistic power curve parameters
    def __init__(self, name: str, rated_power: float, direction: int, 
                 cut_in_speed: float, rated_speed: float, cut_out_speed: float):
        super().__init__(name)
        self.rated_power = rated_power
        self.cut_in_speed = cut_in_speed
        self.rated_speed = rated_speed
        self.cut_out_speed = cut_out_speed
        
        if 0 <= direction <= 360:
            self.direction = direction
        else:
            raise ValueError("Invalid direction for WindTurbine.")

    def update_output(self, environment):
        wind_speed = environment.wind_speed
        wind_direction = environment.wind_direction

        angle_diff = abs(self.direction - wind_direction) % 360
        if angle_diff > 180:
            angle_diff = 360 - angle_diff
        alignment_factor = max(0, math.cos(math.radians(angle_diff)))
        
        # CHANGED: Switched to a realistic power curve model
        power = 0.0
        if self.cut_in_speed <= wind_speed < self.rated_speed:
            # Power is proportional to velocity cubed in this range
            # This formula scales the output to match the rated power at the rated speed
            power = self.rated_power * (
                (wind_speed**3 - self.cut_in_speed**3) / 
                (self.rated_speed**3 - self.cut_in_speed**3)
            )
        elif self.rated_speed <= wind_speed < self.cut_out_speed:
            # Output is capped at rated power
            power = self.rated_power
        # If wind is below cut-in or above cut-out, power remains 0.0
        
        self.power_output = power * alignment_factor

class SolarPanel(PowerDevice):
    # ADDED: Parameters for temperature effects
    def __init__(self, name: str, rated_power: float, temp_coefficient: float = 0.004, stc_temp: float = 25.0):
        super().__init__(name)
        self.rated_power = rated_power
        self.temp_coefficient = temp_coefficient  # 0.4% loss per degree C over STC
        self.stc_temp = stc_temp  # Standard Test Condition temperature (25°C)

    def update_output(self, environment):
        max_radiation = 1000  # W/m²
        radiation = environment.solar_radiation
        temperature = environment.temperature

        # Base power from radiation
        base_power = self.rated_power * (radiation / max_radiation)
        
        # ADDED: Temperature derating factor
        # For every degree above 25°C, the panel loses efficiency
        temp_derating = 1.0 - (temperature - self.stc_temp) * self.temp_coefficient
        
        # Final power is base power adjusted for temperature
        self.power_output = max(0.0, base_power * temp_derating)

# CHANGED: Renamed from GridImport to GridConnection to handle both import and export
class GridConnection(PowerDevice):
    def __init__(self, name: str, import_price: float, export_price: float):
        super().__init__(name)
        self.import_price = import_price # Price to buy from grid ($/kWh)
        self.export_price = export_price # Price to sell to grid ($/kWh)

    def update_output(self, environment, net_demand: float = 0.0):
        # If demand is positive, we import. If negative, we export.
        self.power_output = net_demand

    # Cost calculation method for clarity
    def get_cost(self, timestep_hours: float) -> float:
        """Returns the cost for the timestep. Positive for import, negative for export revenue."""
        if self.power_output > 0: # Importing
            return self.power_output * self.import_price * timestep_hours
        elif self.power_output < 0: # Exporting
            return self.power_output * self.export_price * timestep_hours
        else:
            return 0.0

class Battery(PowerDevice):
    # ADDED: Efficiency parameter
    def __init__(self, name: str, capacity_kwh: float, max_power_kw: float, 
                 efficiency: float = 0.90, initial_charge: float = 0.5):
        super().__init__(name)
        self.capacity_kwh = capacity_kwh
        self.max_power_kw = max_power_kw
        # Account for round-trip efficiency
        self.one_way_efficiency = math.sqrt(efficiency) # Split losses between charge/discharge
        self.state_of_charge = initial_charge * capacity_kwh  # kWh

    def update_output(self, environment, demand: float = 0.0, timestep_hours: float = 1.0):
        if demand > 0:  # Discharge to meet demand
            # How much power can we deliver from storage?
            power_available_from_soc = self.state_of_charge * self.one_way_efficiency / timestep_hours
            available_to_discharge = min(power_available_from_soc, self.max_power_kw)
            
            discharge = min(demand, available_to_discharge)
            self.power_output = discharge
            # To deliver 'discharge' kW, we must pull more from storage due to losses
            self.state_of_charge -= (discharge * timestep_hours) / self.one_way_efficiency

        elif demand < 0:  # Charge with surplus generation
            # How much can we charge?
            power_available_to_charge = (self.capacity_kwh - self.state_of_charge) / self.one_way_efficiency / timestep_hours
            available_to_charge = min(-demand, self.max_power_kw, power_available_to_charge)

            self.power_output = -available_to_charge
            # When charging, we store less than we take in due to losses
            self.state_of_charge += available_to_charge * timestep_hours * self.one_way_efficiency
        else:
            self.power_output = 0.0
        
        self.state_of_charge = max(0, min(self.capacity_kwh, self.state_of_charge))

    def get_state_of_charge(self) -> float:
        return self.state_of_charge

class MicrogridManager:
    def __init__(self, environment, devices: list, battery: Battery, grid: GridConnection):
        self.environment = environment
        self.devices = devices
        self.battery = battery
        self.grid = grid

    def step(self, demand_kw: float, timestep_hours: float = 1.0) -> dict:
        # 1. Update environment-driven devices (wind, solar)
        for d in self.devices:
            d.update_output(self.environment)

        # 2. Total renewable generation
        generation = sum(d.get_power_output() for d in self.devices)

        # 3. Net demand after renewables (positive = shortfall, negative = surplus)
        net_demand = demand_kw - generation

        # 4. Battery response (charge or discharge)
        self.battery.update_output(self.environment, net_demand, timestep_hours)
        net_demand -= self.battery.get_power_output()

        # 5. Grid response (import or export remaining balance)
        self.grid.update_output(self.environment, net_demand)

        # 6. Record results
        results = {
            "Time": self.environment.current_time.strftime("%Y-%m-%d %H:%M"),
            "Demand (kW)": demand_kw,
            "Generation (kW)": generation,
            "Battery Flow (kW)": self.battery.get_power_output(),
            "Grid Flow (kW)": self.grid.get_power_output(), # Positive=Import, Negative=Export
            "SOC (kWh)": self.battery.get_state_of_charge(),
            "Step Cost ($)": self.grid.get_cost(timestep_hours)
        }
        return results

def get_realistic_demand(current_time: datetime, total_daily_kwh: float) -> float:
    """
    Returns a plausible kW demand for the given hour such that the total energy
    matches total_daily_kwh, with 80% of energy during day (6-22) and 20% during night (22-6).
    """
    hour = current_time.hour

    # Determine day/night weighting
    if 6 <= hour < 22:
        weight = 0.8 / 16  # 16 day hours share 80%
    else:
        weight = 0.2 / 8   # 8 night hours share 20%

    demand = weight * total_daily_kwh
    # Add some random noise
    demand += random.uniform(-0.9, 0.9) * demand

    return max(0.1, demand)  # ensure nonzero

# --- Simulation Setup ---
e = Environment()

m = MicrogridManager(
    environment=e,
    devices=[
        SolarPanel("Solar", rated_power=6, temp_coefficient=0.004)
    ],
    battery=Battery("Battery", capacity_kwh=15, max_power_kw=3.5, 
                    efficiency=0.90, initial_charge=0.8),
    grid=GridConnection("Grid", import_price=0.40, export_price=0.08)
)

print("--- Starting Microgrid Simulation ---")
total_cost = 0.0
total_demand = 0.0
for i in range(24): # Simulate for one week
    timestep = 1 # 1 hour timestep
    
    demand = get_realistic_demand(e.current_time, 15)
    
    results = m.step(demand_kw=demand, timestep_hours=timestep)
    total_cost += results["Step Cost ($)"]
    total_demand += results['Demand (kW)']
    
    # Print results in a formatted way
    print(
        f"{results['Time']} | "
        f"Demand: {results['Demand (kW)']:>6.1f}kW | "
        f"Gen: {results['Generation (kW)']:>6.1f}kW | "
        f"Battery: {results['Battery Flow (kW)']:>7.1f}kW | "
        f"Grid: {results['Grid Flow (kW)']:>7.1f}kW | "
        f"SOC: {results['SOC (kWh)']:>7.1f}kWh | "
        f"Cost: ${results['Step Cost ($)']:>6.2f} | "
        f"Total Cost: ${total_cost:>7.2f}  | "
        f"Total demand: {total_demand}"
    )
    
    e.step(timestep)