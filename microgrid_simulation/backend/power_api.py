from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from simulation.power_simulation import MicrogridManager

app = FastAPI(title="Microgrid Environment API")

# Enable CORS for local dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/add/windturbine")
def add_wind_turbine(name: str, rated_power: int, direction: float):
    