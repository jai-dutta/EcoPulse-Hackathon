from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from simulation.environment_simulation import Environment
from simulation.simulation_instances import get_environment_instance
app = FastAPI(title="Microgrid Environment API")

# Enable CORS for local dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

env = get_environment_instance()

@app.get("/environment")
def get_environment():
    """
    Returns the current environment state.
    """
    return {
        "time": env.current_time.strftime("%d %B %Y %H:%M"),
        "temperature": env.temperature,
        "solar_radiation": env.solar_radiation,
        "cloud_cover": env.cloud_cover,
        "wind_speed": env.wind_speed,
        "wind_direction": env.wind_direction
    }

@app.post("/environment/cloud_cover")
def set_cloud_cover(cloud_cover: float):
    """
    Set the cloud cover value (0-9)
    """
    env.set_cloud_cover(cloud_cover)
    return {"message": f"Cloud cover set to {cloud_cover}", "cloud_cover": env.cloud_cover}

@app.post("/environment/solar_radiation")
def set_solar_radiation(solar_radiation: float):
    """
    Set the solar radiation value (0-1000 W/m²)
    """
    env.set_solar_radiation(solar_radiation)
    return {"message": f"Solar radiation set to {solar_radiation}", "solar_radiation": env.solar_radiation}

@app.post("/environment/wind_speed")
def set_wind_speed(wind_speed: float):
    """
    Set the wind speed value (0-100 m/s)
    """
    env.set_wind_speed(wind_speed)
    return {"message": f"Wind speed set to {wind_speed}", "wind_speed": env.wind_speed}

@app.post("/environment/wind_direction")
def set_wind_direction(wind_direction: float):
    """
    Set the wind direction value (0-359 degrees)
    """
    env.set_wind_direction(wind_direction)
    return {"message": f"Wind direction set to {wind_direction}", "wind_direction": env.wind_direction}

@app.post("/environment/temperature")
def set_temperature(temperature: float):
    """
    Set the temperature value (-50 to 50°C)
    """
    env.set_temperature(temperature)
    return {"message": f"Temperature set to {temperature}", "temperature": env.temperature}


@app.post("/step")
def step_environment(timestep_hours: float = 1.0):
    """
    Advance the simulation by the specified timestep
    """
    env.step(timestep_hours)
    return get_environment()

@app.post("/reset")
def reset_environment():
    """
    Reset the environment to initial state
    """
    global env
    env = Environment()
    return {"message": "Environment reset to initial state", "environment": get_environment()}