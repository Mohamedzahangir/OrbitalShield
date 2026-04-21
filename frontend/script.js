const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  10000
);
camera.position.set(0, 0, 800);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

//  Earth
const earth = new THREE.Mesh(
  new THREE.SphereGeometry(200, 32, 32),
  new THREE.MeshBasicMaterial({ wireframe: true })
);
scene.add(earth);

camera.position.set(0, 0, 800);

//  Storage
const satellites = [];
const trails = [];

//  Create satellite
function createSatellite(color) {
  const sat = new THREE.Mesh(
    new THREE.SphereGeometry(10, 16, 16),
    new THREE.MeshBasicMaterial({ color })
  );

  scene.add(sat);

  const trailPoints = [];
  const trailGeometry = new THREE.BufferGeometry();
  const trailMaterial = new THREE.LineBasicMaterial({ color });

  const trailLine = new THREE.Line(trailGeometry, trailMaterial);
  scene.add(trailLine);

  satellites.push(sat);
  trails.push({ points: trailPoints, line: trailLine });
  console.log("Satellites created:", satellites.length);
}


//  Create multiple satellites
createSatellite(0xff0000);
createSatellite(0x00ff00);
createSatellite(0x0000ff);

//  Update positions
async function updatePositions() {
  try {
    const res = await fetch("http://127.0.0.1:8000/positions");

    //  If server responds but error status
    if (!res.ok) throw new Error("Server not responding");

    const data = await res.json();

    //  Hide error when backend works
    hideError();

    const SCALE = 0.1;

    data.forEach((satData, index) => {
      if (index >= satellites.length) return;

      const x = satData.x * SCALE;
      const y = satData.y * SCALE;
      const z = satData.z * SCALE;

      // Position with offset (for visibility)
      satellites[index].position.set(
        x + index * 120,
        y + index * 80,
        z
      );

      const trail = trails[index];

      trail.points.push(
        new THREE.Vector3(
          x + index * 120,
          y + index * 80,
          z
        )
      );

      if (trail.points.length > 200) {
        trail.points.shift();
      }

      trail.line.geometry.setFromPoints(trail.points);
    });

    resetColors();
    checkCollisions();
    checkFutureCollisions(data);

  } catch (err) {
    console.error("Backend error:", err);

    //  Show error popup when backend fails
    showError();
  }
}
//  Call API every 1 sec (ONLY ONCE)
setInterval(updatePositions, 1000);

// Animation
function animate() {
  requestAnimationFrame(animate);

  earth.rotation.y += 0.002;

  renderer.render(scene, camera);
}

//error functions 
function showError() {
  document.getElementById("errorBox").style.display = "block";
}

function hideError() {
  document.getElementById("errorBox").style.display = "none";
}

// get distance
function getDistance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;

  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

//collision detection
function checkCollisions() {
  const THRESHOLD = 100; // tweak later

  for (let i = 0; i < satellites.length; i++) {
    for (let j = i + 1; j < satellites.length; j++) {

      const pos1 = satellites[i].position;
      const pos2 = satellites[j].position;

      const dist = getDistance(pos1, pos2);

      if (dist < THRESHOLD) {
        console.log(`⚠️ Collision Risk: ${i} & ${j}`);

        satellites[i].material.color.set(0xff0000);
        satellites[j].material.color.set(0xff0000);
      }
    }
  }
}

//reset colors after collision check
function resetColors() {
  const colors = [0xff0000, 0x00ff00, 0x0000ff];

  satellites.forEach((sat, index) => {
    sat.material.color.set(colors[index % colors.length]);
  });
}

//predict position
function predictPosition(sat, timeAhead = 10) {
  return {
    x: sat.x + sat.vx * timeAhead,
    y: sat.y + sat.vy * timeAhead,
    z: sat.z + sat.vz * timeAhead
  };
}

//check future collisions
function checkFutureCollisions(data) {
  const THRESHOLD = 100;

  for (let i = 0; i < data.length; i++) {
    for (let j = i + 1; j < data.length; j++) {

      const future1 = predictPosition(data[i], 10);
      const future2 = predictPosition(data[j], 10);

      const dist = getDistance(future1, future2);

      if (dist < THRESHOLD) {
        console.log(`🚨 FUTURE COLLISION: ${i} & ${j}`);

        satellites[i].material.color.set(0xff0000);
        satellites[j].material.color.set(0xff0000);
      }
    }
  }
}
animate();