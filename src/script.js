import * as THREE from 'three';

// SETUP 
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// Handle window resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// RAYCASTER SETUP 
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const skyPlaneGeometry = new THREE.PlaneGeometry(20, 20);
const skyPlaneMaterial = new THREE.MeshBasicMaterial({ visible: false }); // Invisible plane
const skyPlane = new THREE.Mesh(skyPlaneGeometry, skyPlaneMaterial);
scene.add(skyPlane);

// FIREWORKS ENGINE 
const fireworks = [];

class Firework {
    constructor(position) {
        this.isDead = false;
        
        const particleCount = 500; 
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const velocities = []; 

        // Color randomizer
        const color = new THREE.Color();
        color.setHSL(Math.random(), 1, 0.5);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y;
            positions[i * 3 + 2] = position.z;

            const u = Math.random();
            const v = Math.random();
            const theta = 2 * Math.PI * u;
            const phi = Math.acos(2 * v - 1);
            
            const speed = Math.random() * 0.1 + 0.05; 
            
            const vx = speed * Math.sin(phi) * Math.cos(theta);
            const vy = speed * Math.sin(phi) * Math.sin(theta);
            const vz = speed * Math.cos(phi);
            
            velocities.push({ x: vx, y: vy, z: vz });

            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true, 
            blending: THREE.AdditiveBlending, 
            depthWrite: false, 
            transparent: true,
            opacity: 1
        });

        this.mesh = new THREE.Points(geometry, material);
        this.velocities = velocities;
        scene.add(this.mesh);
    }

    update() {
        const positions = this.mesh.geometry.attributes.position.array;

        // Animate each particle
        for (let i = 0; i < this.velocities.length; i++) {
            // Apply Velocity
            positions[i * 3] += this.velocities[i].x;
            positions[i * 3 + 1] += this.velocities[i].y;
            positions[i * 3 + 2] += this.velocities[i].z;

            // Apply Gravity 
            this.velocities[i].y -= 0.002; 

            // Drag (slow down over time)
            this.velocities[i].x *= 0.98;
            this.velocities[i].y *= 0.98;
            this.velocities[i].z *= 0.98;
        }

        this.mesh.geometry.attributes.position.needsUpdate = true;

        // Fade out
        this.mesh.material.opacity -= 0.015;
        if (this.mesh.material.opacity <= 0) {
            this.isDead = true;
        }
    }

    dispose() {
        // Clean up memory 
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        scene.remove(this.mesh);
    }
}

// INPUT HANDLING 
window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObject(skyPlane);

    if (intersects.length > 0) {
        const impactPoint = intersects[0].point;
        fireworks.push(new Firework(impactPoint));
    }
});

// ANIMATION LOOP 
const clock = new THREE.Clock();

const tick = () => {
    const elapsedTime = clock.getElapsedTime();

    // Update all active fireworks
    for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].update();
        if (fireworks[i].isDead) {
            fireworks[i].dispose();
            fireworks.splice(i, 1);
        }
    }

    renderer.render(scene, camera);
    window.requestAnimationFrame(tick);
};

tick();