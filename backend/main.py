from fastapi import FastAPI
from sgp4.api import Satrec, jday
import time

app = FastAPI()
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load TLE
with open("tle.txt", "r") as f:
    lines = f.readlines()

line1 = lines[1].strip()
line2 = lines[2].strip()

satellite = Satrec.twoline2rv(line1, line2)


@app.get("/position")
def get_position():
    t = time.gmtime()

    jd, fr = jday(
        t.tm_year, t.tm_mon, t.tm_mday,
        t.tm_hour, t.tm_min, t.tm_sec
    )

    error, position, velocity = satellite.sgp4(jd, fr)

    if error == 0:
        return {
            "x": position[0],
            "y": position[1],
            "z": position[2]
        }
    else:
        return {"error": "Calculation failed"}