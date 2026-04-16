const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 10000);
const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Earth (simple sphere)
const geometry = new THREE.SphereGeometry(200, 32, 32);
const material = new THREE.MeshBasicMaterial({ wireframe: true });
const earth = new THREE.Mesh(geometry, material);
scene.add(earth);

// Satellite
const satGeometry = new THREE.SphereGeometry(10, 16, 16);
const satMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const satellite = new THREE.Mesh(satGeometry, satMaterial);
const trailPoints = [];
const trailGeometry = new THREE.BufferGeometry();
const trailMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });

const trailLine = new THREE.Line(trailGeometry, trailMaterial);
scene.add(trailLine);
earth.rotation.y += 0.002;
scene.background = new THREE.Color(0x000000);
scene.add(satellite);


camera.position.z = 500;
camera.position.set(0, 0, 800);

const SCALE = 0.9; // VERY IMPORTANT

// Fetch position from backend
async function updatePosition() {
  try {
    const res = await fetch("http://127.0.0.1:8000/position");
    const data = await res.json();

    const SCALE = 0.1;

    satellite.position.set(
      data.x * SCALE,
      data.y * SCALE,
      data.z * SCALE
    );
    if (trailPoints.length > 200) {
  trailPoints.shift();
}

trailGeometry.setFromPoints(trailPoints);

  } catch (err) {
    console.error("Fetch error:", err);
  }
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  setInterval(updatePosition, 1000);

  renderer.render(scene, camera);
}

animate();
updatePosition();