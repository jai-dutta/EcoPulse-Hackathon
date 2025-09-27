from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from zmq.green import device

from simulation.power_simulation import MicrogridManager, GridConnection, Battery, SolarPanel, WindTurbine
from simulation.simulation_instances import get_microgrid_instance, battery, grid, microgrid
from pydantic import BaseModel
from typing import Optional
import json


app = FastAPI(title="Microgrid Environment API")

# Enable CORS for the local dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class WindTurbineRequest(BaseModel):
    name: str
    rated_power: float
    direction: int
    cut_in_speed: float = 3.0
    rated_speed: float = 12.0
    cut_out_speed: float = 25.0

class SolarPanelRequest(BaseModel):
    name: str
    rated_power: float
    temp_coefficient: float = 0.004
    stc_temp: float = 25.0

class BatteryRequest(BaseModel):
    name: str
    capacity_kwh: float
    max_power_kw: float
    efficiency: float = 0.90
    initial_charge: float = 0.5

class SimulationStepRequest(BaseModel):
    demand_kw: float
    timestep_hours: float = 1.0

class EnvironmentUpdateRequest(BaseModel):
    temperature: Optional[float] = None
    wind_speed: Optional[float] = None
    wind_direction: Optional[float] = None
    solar_radiation: Optional[float] = None


mg = get_microgrid_instance()

@app.get("/")
def get_microgrid_state():
    environment = mg.environment
    device_states = []
    for device in mg.devices:
        device_info = {
            "name": device.name,
            "type": device.__class__.__name__,
            "power_output": device.get_power_output()
        }

        # Add device-specific information
        if isinstance(device, WindTurbine):
            device_info.update({
                "rated_power": device.rated_power,
                "direction": device.direction,
                "cut_in_speed": device.cut_in_speed,
                "rated_speed": device.rated_speed,
                "cut_out_speed": device.cut_out_speed
            })
        elif isinstance(device, SolarPanel):
            device_info.update({
                "rated_power": device.rated_power,
                "temp_coefficient": device.temp_coefficient,
                "stc_temp": device.stc_temp
            })

        device_states.append(device_info)

        return {
            "timestamp": environment.current_time.isoformat(),
            "environment": {
                "temperature": environment.temperature,
                "wind_speed": environment.wind_speed,
                "wind_direction": environment.wind_direction,
                "solar_radiation": environment.solar_radiation
            },
            "devices": device_states,
            "battery": {
                "name": battery.name,
                "capacity_kwh": battery.capacity_kwh,
                "max_power_kw": battery.max_power_kw,
                "state_of_charge": battery.get_state_of_charge(),
                "current_power": battery.get_power_output()
            },
            "grid": {
                "name": grid.name,
                "import_price": grid.import_price,
                "export_price": grid.export_price,
                "current_power": grid.get_power_output()
            },
            "total_generation": sum(d.get_power_output() for d in microgrid.devices),
            "device_count": len(microgrid.devices)
        }

@app.post("/add/windturbine")
def add_wind_turbine(turbine: WindTurbineRequest):
    """Add a wind turbine to the microgrid"""
    try:
        # Check if name already exists
        if any(d.name == turbine.name for d in microgrid.devices):
            raise HTTPException(status_code=400, detail=f"Device with name '{turbine.name}' already exists")

        # Validate direction
        if not (0 <= turbine.direction <= 360):
            raise HTTPException(status_code=400, detail="Direction must be between 0 and 360 degrees")

        wind_turbine = WindTurbine(
            name=turbine.name,
            rated_power=turbine.rated_power,
            direction=turbine.direction,
            cut_in_speed=turbine.cut_in_speed,
            rated_speed=turbine.rated_speed,
            cut_out_speed=turbine.cut_out_speed
        )

        microgrid.devices.append(wind_turbine)

        return {
            "message": f"Wind turbine '{turbine.name}' added successfully",
            "device": {
                "name": wind_turbine.name,
                "rated_power": wind_turbine.rated_power,
                "direction": wind_turbine.direction
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/add/solarpanel")
def add_solarpanel(panel: SolarPanelRequest):
    try:
        if any(device().name == panel.name for device in microgrid.devices):
            raise HTTPException(status_code=400, detail=f"Device name '{panel.name}' already exists")
