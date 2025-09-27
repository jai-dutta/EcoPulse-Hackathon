from environment_simulation import *
from power_simulation import *

env = Environment()

devices = []
grid = GridConnection()
battery = Battery()
microgrid = MicrogridManager(
)

def get_environment_instance() -> Environment:
    return env

def get_microgrid_instance() -> MicrogridManager:
    return microgrid