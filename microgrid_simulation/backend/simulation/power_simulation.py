"""
power_simulation.py

This file represents multiple power generation and storage devices:
- Wind Turbine
- Solar Panel
- Import (Grid import)
- Battery
"""

from environment_simulation import Environment
import math
import time

class PowerDevice:
    def __init__(self, name: str):
        self.name: str = name
        self.power_output = 0.0 # Current power output in kW
        
    def update_output(self, environment: Environment) -> None:
        # To be implemented by children
        pass
    
    def get_power_output(self) -> float:
        return self.power_output
    
    def __str__(self) -> str:
        return self.name
    
class WindTurbine(PowerDevice):
    def __init__(self, name: str, rated_power: float, direction: int):
        super().__init__(name)
        self.rated_power = rated_power
        if 0 <= direction <= 360:
            self.direction = direction
        else:
            raise ValueError("Invalid direction for WindTurbine.")
        
    def update_output(self, environment):
        wind_speed = environment.wind_speed
        wind_direction = environment.wind_direction

        # Calculate alignment factor based on angle difference between turbine and wind direction
        # Perfect alignment (0 deg difference) = 1.0, worst alignment (180 deg) = 0.0
        angle_diff = abs(self.direction - wind_direction) % 360
        if angle_diff > 180:
            angle_diff = 360 - angle_diff
        alignment_factor = max(0, math.cos(math.radians(angle_diff)))

        # Power output proportional to wind speed squared * alignment_factor (simplified)
        # Cap output at rated power
        power = (wind_speed ** 2) * alignment_factor
        self.power_output = min(power, self.rated_power)
        
class SolarPanel(PowerDevice):
    def __init__(self, name: str, rated_power: float):
        super().__init__(name)
        self.rated_power = rated_power

    def update_output(self, environment):
        max_radiation = 1000  # W/m² peak solar radiation
        radiation = environment.solar_radiation
        self.power_output = max(
            0.0,
            self.rated_power * (radiation / max_radiation)
        )

class GridImport(PowerDevice):
    def __init__(self, name: str):
        super().__init__(name)
    def update_output(self, environment, demand: float = 0.0):
        """
        Import power from the grid to meet demand.
        demand (kW) is how much extra power is needed.
        """
        self.power_output = demand

class Battery(PowerDevice):
    def __init__(self, name: str, capacity_kwh: float, max_power_kw: float, initial_charge: float = 0.5):
        super().__init__(name)
        self.capacity_kwh = capacity_kwh
        self.max_power_kw = max_power_kw
        self.state_of_charge = initial_charge * capacity_kwh  # kWh stored

    def update_output(self, environment, demand: float = 0.0, timestep_hours: float = 1.0):
        """
        Update battery output depending on demand and SOC.
        Positive power_output = discharge, negative = charging.
        """
        if demand > 0:  # Discharge
            available = min(self.state_of_charge / timestep_hours, self.max_power_kw)
            discharge = min(demand, available)
            self.power_output = discharge
            self.state_of_charge -= discharge * timestep_hours
        elif demand < 0:  # Excess generation → charge
            charge_power = min(-demand, self.max_power_kw)
            available_capacity = (self.capacity_kwh - self.state_of_charge) / timestep_hours
            charge = min(charge_power, available_capacity)
            self.power_output = -charge
            self.state_of_charge += charge * timestep_hours
        else:  # No net demand
            self.power_output = 0.0

    def get_state_of_charge(self) -> float:
        """Return state of charge in kWh."""
        return self.state_of_charge

class MicrogridManager:
    def __init__(self, environment, devices: list, battery: Battery, grid: GridImport):
        self.environment = environment
        self.devices = devices  # list of PowerDevice (solar, wind, etc.)
        self.battery = battery
        self.grid = grid
        self.grid_import_price = 0.4 # $0.40 / kW
        
    def step(self, demand_kw: float, timestep_hours: float = 1.0) -> dict:
        """Simulate one timestep with given demand (kW)."""

        # 1. Update environment-driven devices
        for d in self.devices:
            d.update_output(self.environment)

        # 2. Total renewable generation
        generation = sum(d.get_power_output() for d in self.devices)

        # 3. Net balance (positive = demand > gen, negative = surplus)
        net_demand = demand_kw - generation

        # 4. Battery response
        self.battery.update_output(self.environment, net_demand, timestep_hours)
        net_demand -= self.battery.get_power_output()

        # 5. Grid import response
        self.grid.update_output(self.environment, net_demand)
        net_demand -= self.grid.get_power_output()

        # 6. Record results
        results = {
            "demand_kw": demand_kw,
            "generation_kw": generation,
            "battery_kw": self.battery.get_power_output(),
            "grid_kw": self.grid.get_power_output(),
            "soc_kwh": self.battery.get_state_of_charge(),
            "cost": self.grid.get_power_output() * self.grid_import_price
        }
        return results
    
e = Environment()

m = MicrogridManager(
    environment=e,
    devices=[
        WindTurbine("Wind1", rated_power=600, direction=225),   # SW-aligned small turbine
        WindTurbine("Wind2", rated_power=1200, direction=180),  # larger turbine
        SolarPanel("Solar", rated_power=400)                    # realistic rooftop/field array
    ],
    battery=Battery("Battery", capacity_kwh=2000, max_power_kw=1000, initial_charge=0.8),
    grid=GridImport("Grid")
)

while True:
    if e.current_time.hour > 18:
        demand = 0
    else:
        demand = 250
    d = m.step(demand_kw=demand, timestep_hours=6)
    e.step(6)
    print(e.wind_direction, e.wind_speed, e.current_time)
    print(d)
    print()
    time.sleep(3)
    