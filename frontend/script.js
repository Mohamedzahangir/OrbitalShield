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

// 🌍 Earth
const earth = new THREE.Mesh(
  new THREE.SphereGeometry(200, 32, 32),
  new THREE.MeshBasicMaterial({ wireframe: true })
);
scene.add(earth);

camera.position.set(0, 0, 800);

// 🛰 Storage
const satellites = [];
const trails = [];

// 🚀 Create satellite
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


// 🎨 Create multiple satellites
createSatellite(0xff0000);
createSatellite(0x00ff00);
createSatellite(0x0000ff);

// 📡 Update positions
async function updatePositions() {
  try {
    const res = await fetch("http://127.0.0.1:8000/positions");

    // ❌ If server responds but error status
    if (!res.ok) throw new Error("Server not responding");

    const data = await res.json();

    // ✅ Hide error when backend works
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

  } catch (err) {
    console.error("Backend error:", err);

    // 🔴 Show error popup when backend fails
    showError();
  }
}
// ⏱ Call API every 1 sec (ONLY ONCE)
setInterval(updatePositions, 1000);

// 🎬 Animation
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

animate();