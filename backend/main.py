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


@app.get("/positions")
def get_positions():
    import time
    from sgp4.api import Satrec, jday

    satellites_data = []

    # Read TLE file
    with open("tle.txt", "r") as f:
        lines = [line.strip() for line in f.readlines() if line.strip()]

    # Current time
    t = time.gmtime()
    jd, fr = jday(
        t.tm_year, t.tm_mon, t.tm_mday,
        t.tm_hour, t.tm_min, t.tm_sec
    )

    # Loop through TLE (every 3 lines = 1 satellite)
    for i in range(0, len(lines), 3):
        try:
            name = lines[i]
            line1 = lines[i + 1]
            line2 = lines[i + 2]

            sat = Satrec.twoline2rv(line1, line2)
            error, position, velocity = sat.sgp4(jd, fr)

            if error == 0:
                satellites_data.append({
                    "name": name,
                    "x": position[0],
                    "y": position[1],
                    "z": position[2]
                })
            if len(satellites_data) == 1:
                satellites_data.append({
                    "name": "CLONE",
                    "x": position[0] + 5,   # very close
                    "y": position[1] + 5,
                    "z": position[2] + 5
                })
        except Exception as e:
            print("Error reading satellite:", e)

    return satellites_data
    
    