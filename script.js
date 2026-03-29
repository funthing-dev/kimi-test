// ============================================
// INTO THE COSMOS - Journey to the Galactic Core
// ============================================

let scene, camera, renderer;
let starLayers = [];
let nebulaClouds = [];
let galaxyClusters = [];
let spaceDust = [];
let centralCore;
let warpLines;
let mouseX = 0, mouseY = 0;
let targetRotationX = 0, targetRotationY = 0;
let isDragging = false;
let previousMouseX = 0, previousMouseY = 0;
let speed = 0;
let targetSpeed = 0;
let cameraZ = -5000;
let warpIntensity = 0;
let nearestCluster = null;
let journeyProgress = 0;

const keys = {};

const CONFIG = {
    layers: 4,
    starsPerLayer: 80000,
    maxSpeed: 250,
    nebulaCount: 20,
    clusterCount: 15,
    universeSize: 5000,
    colors: {
        cyan: 0x00d4ff,
        blue: 0x0066ff,
        purple: 0x7b2cbf,
        pink: 0xff006e,
        orange: 0xff6b35,
        gold: 0xffd700,
        white: 0xffffff,
        red: 0xff3333,
        violet: 0x9d4edd,
        green: 0x00ff88
    }
};

let cosmicStructure = { clusters: [] };

function init() {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.000015);

    camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.1, 15000);
    camera.position.z = cameraZ;
    camera.position.y = 0;
    camera.position.x = 0;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 1);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    generateCosmicStructure();
    createCentralCore();
    createMassiveStarfield();
    createNebulaClouds();
    createGalaxyClusters();
    createSpaceDust();
    createWarpLines();
    
    setupEvents();
    animate();
}

function generateCosmicStructure() {
    for (let i = 0; i < CONFIG.clusterCount; i++) {
        const t = i / CONFIG.clusterCount;
        const distanceFromCenter = 500 + t * CONFIG.universeSize * 0.8;
        const angle = t * Math.PI * 6;
        
        cosmicStructure.clusters.push({
            id: i,
            name: `CLUSTER-${String.fromCharCode(65 + i % 26)}${Math.floor(i / 26) || ''}`,
            x: Math.cos(angle) * distanceFromCenter * 0.6,
            y: Math.sin(angle) * distanceFromCenter * 0.4,
            z: -distanceFromCenter,
            radius: 300 + Math.random() * 400,
            mass: 0.5 + Math.random() * 0.5
        });
    }
}

function createCentralCore() {
    const count = 8000;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];
    const sizes = [];
    
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.pow(Math.random(), 0.5) * 1000;
        const height = (Math.random() - 0.5) * 150;
        
        positions.push(
            Math.cos(angle) * radius,
            height + Math.sin(angle) * radius * 0.1,
            Math.sin(angle) * radius * 0.05
        );
        
        const distRatio = radius / 1000;
        const color = new THREE.Color();
        if (distRatio < 0.2) color.setHex(0xffffff);
        else if (distRatio < 0.5) color.setHex(CONFIG.colors.gold);
        else color.setHex(CONFIG.colors.orange);
        
        colors.push(color.r, color.g, color.b);
        sizes.push((1 - distRatio) * 25 + 8);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    
    const texture = createParticleTexture();
    const material = new THREE.PointsMaterial({
        size: 20,
        vertexColors: true,
        map: texture,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        transparent: true,
        opacity: 1
    });
    
    centralCore = new THREE.Points(geometry, material);
    scene.add(centralCore);
}

function createMassiveStarfield() {
    for (let layer = 0; layer < CONFIG.layers; layer++) {
        const scale = Math.pow(2, layer);
        const count = CONFIG.starsPerLayer;
        
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        const sizes = [];
        
        for (let i = 0; i < count; i++) {
            let x, y, z, r, g, b, size;
            
            const rand = Math.random();
            
            if (rand < 0.3 && i < 20000) {
                // Cluster stars
                const clusterIdx = Math.floor(Math.random() * cosmicStructure.clusters.length);
                const cluster = cosmicStructure.clusters[clusterIdx];
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(Math.random() * 2 - 1);
                const radius = Math.pow(Math.random(), 0.4) * cluster.radius * scale;
                
                x = cluster.x * scale + radius * Math.sin(phi) * Math.cos(theta);
                y = cluster.y * scale + radius * Math.sin(phi) * Math.sin(theta);
                z = cluster.z * scale + radius * Math.cos(phi);
                
                const colorType = Math.random();
                if (colorType < 0.4) { r = 1; g = 1; b = 1; }
                else if (colorType < 0.7) { r = 0; g = 0.8; b = 1; }
                else { r = 0.8; g = 0.9; b = 1; }
                size = 4 + Math.random() * 4;
            } else if (rand < 0.5) {
                // Filament stars
                const cluster1 = cosmicStructure.clusters[Math.floor(Math.random() * cosmicStructure.clusters.length)];
                const cluster2 = cosmicStructure.clusters[Math.floor(Math.random() * cosmicStructure.clusters.length)];
                const t = Math.random();
                const spread = 100 * scale * (Math.random() - 0.5);
                
                x = (cluster1.x * scale * (1-t) + cluster2.x * scale * t) + spread;
                y = (cluster1.y * scale * (1-t) + cluster2.y * scale * t) + spread * 0.5;
                z = (cluster1.z * scale * (1-t) + cluster2.z * scale * t) + spread * 0.5;
                
                const colorType = Math.random();
                if (colorType < 0.4) { r = 0.3; g = 0.5; b = 1; }
                else if (colorType < 0.7) { r = 0.5; g = 0.3; b = 1; }
                else { r = 0.8; g = 0.2; b = 0.6; }
                size = 2.5 + Math.random() * 2;
            } else {
                // Field stars
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(Math.random() * 2 - 1);
                const radius = Math.pow(Math.random(), 0.8) * CONFIG.universeSize * scale;
                
                x = radius * Math.sin(phi) * Math.cos(theta) * 0.8;
                y = radius * Math.sin(phi) * Math.sin(theta) * 0.6;
                z = -radius + Math.random() * 1000;
                
                const colorType = Math.random();
                const distRatio = radius / (CONFIG.universeSize * scale);
                
                if (distRatio < 0.3) {
                    r = 1; g = 0.6 + Math.random() * 0.4; b = 0.3;
                } else if (colorType < 0.25) { r = 1; g = 1; b = 1; }
                else if (colorType < 0.5) { r = 0.8; g = 0.9; b = 1; }
                else if (colorType < 0.75) { r = 0.5; g = 0.7; b = 1; }
                else { r = 1; g = 0.8; b = 0.4; }
                
                size = 1.5 + Math.random() * 2 + (1 - distRatio) * 2;
            }
            
            positions.push(x, y, z);
            colors.push(r, g, b);
            sizes.push(size);
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
        
        const texture = createParticleTexture();
        const material = new THREE.PointsMaterial({
            size: 3,
            vertexColors: true,
            map: texture,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            opacity: 0.9 - layer * 0.15
        });
        
        const stars = new THREE.Points(geometry, material);
        stars.userData = { layer: layer, scale: scale };
        scene.add(stars);
        starLayers.push(stars);
    }
}

function createNebulaClouds() {
    for (let i = 0; i < CONFIG.nebulaCount; i++) {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        const sizes = [];
        
        const cluster = cosmicStructure.clusters[i % cosmicStructure.clusters.length];
        const color = new THREE.Color();
        const hue = Math.random();
        color.setHSL(hue, 0.8, 0.5);
        
        const count = 500;
        for (let j = 0; j < count; j++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            const radius = Math.pow(Math.random(), 0.5) * cluster.radius * 2.5;
            
            positions.push(
                cluster.x + radius * Math.sin(phi) * Math.cos(theta),
                cluster.y + radius * Math.sin(phi) * Math.sin(theta) * 0.4,
                cluster.z + radius * Math.cos(phi) * 0.8
            );
            
            const variation = (Math.random() - 0.5) * 0.3;
            colors.push(
                Math.max(0, color.r + variation),
                Math.max(0, color.g + variation),
                Math.max(0, color.b + variation)
            );
            
            sizes.push(50 + Math.random() * 100);
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
        
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        grad.addColorStop(0, 'rgba(255,255,255,0.4)');
        grad.addColorStop(0.5, 'rgba(255,255,255,0.1)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 128, 128);
        
        const material = new THREE.PointsMaterial({
            size: 100,
            vertexColors: true,
            map: new THREE.CanvasTexture(canvas),
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            opacity: 0.5
        });
        
        const nebula = new THREE.Points(geometry, material);
        nebula.userData = { centerZ: cluster.z, rotationSpeed: (Math.random() - 0.5) * 0.0003 };
        scene.add(nebula);
        nebulaClouds.push(nebula);
    }
}

function createGalaxyClusters() {
    for (const cluster of cosmicStructure.clusters) {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        const sizes = [];
        
        const count = 300;
        for (let i = 0; i < count; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(Math.random() * 2 - 1);
            const radius = Math.pow(Math.random(), 2) * cluster.radius * 0.6;
            
            positions.push(
                cluster.x + radius * Math.sin(phi) * Math.cos(theta),
                cluster.y + radius * Math.sin(phi) * Math.sin(theta),
                cluster.z + radius * Math.cos(phi)
            );
            
            const colorType = Math.random();
            if (colorType > 0.5) {
                colors.push(1, 1, 1);
            } else if (colorType > 0.25) {
                colors.push(1, 0.9, 0.5);
            } else {
                colors.push(0.5, 0.9, 1);
            }
            
            sizes.push(Math.random() * 15 + 8);
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
        
        const material = new THREE.PointsMaterial({
            size: 15,
            vertexColors: true,
            map: createParticleTexture(),
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            opacity: 1
        });
        
        const core = new THREE.Points(geometry, material);
        scene.add(core);
        galaxyClusters.push(core);
    }
}

function createSpaceDust() {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];
    
    for (let i = 0; i < 1000; i++) {
        positions.push(
            (Math.random() - 0.5) * 4000,
            (Math.random() - 0.5) * 4000,
            Math.random() * 8000 - 8000
        );
        velocities.push(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            100 + Math.random() * 200
        );
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
        color: 0xaaddff,
        size: 2,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });
    
    const dust = new THREE.Points(geometry, material);
    dust.userData = { velocities: velocities };
    scene.add(dust);
    spaceDust.push(dust);
}

function createWarpLines() {
    const count = 500;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const originalPositions = [];
    
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.pow(Math.random(), 0.5) * 2000;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius * 0.6;
        const z = Math.random() * 10000 - 10000;
        const length = 100 + Math.random() * 300;
        
        positions.push(x, y, z, x, y, z + length);
        originalPositions.push(x, y, z, x, y, z + length);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    const material = new THREE.LineBasicMaterial({
        color: 0x00d4ff,
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending
    });
    
    warpLines = new THREE.LineSegments(geometry, material);
    warpLines.userData = { originalPositions: originalPositions };
    scene.add(warpLines);
}

function createParticleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.2, 'rgba(255,255,255,0.8)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.3)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(canvas);
}

function findNearestCluster() {
    let nearest = null;
    let minDist = Infinity;
    
    for (const cluster of cosmicStructure.clusters) {
        const dx = cluster.x - camera.position.x;
        const dy = cluster.y - camera.position.y;
        const dz = cluster.z - cameraZ;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        if (dist < minDist && dist < 4000) {
            minDist = dist;
            nearest = { ...cluster, distance: dist };
        }
    }
    
    return nearest;
}

function setupEvents() {
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
    document.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);
    document.addEventListener('wheel', onWheel);
    window.addEventListener('resize', onResize);
}

function onMouseMove(event) {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    
    if (isDragging) {
        targetRotationY += (event.clientX - previousMouseX) * 0.005;
        targetRotationX += (event.clientY - previousMouseY) * 0.005;
        previousMouseX = event.clientX;
        previousMouseY = event.clientY;
    }
}

function onMouseDown(event) {
    isDragging = true;
    previousMouseX = event.clientX;
    previousMouseY = event.clientY;
}

function onMouseUp() { isDragging = false; }

function onWheel(event) {
    const boost = keys['shift'] ? 3 : 1;
    // 휠 위로 (deltaY < 0): 중심으로 이동 (z 증가)
    // 휠 아래로 (deltaY > 0): 뒤로 이동 (z 감소)
    const moveAmount = -event.deltaY * 2 * boost;
    cameraZ += moveAmount;
    cameraZ = Math.max(-6000, Math.min(800, cameraZ));
    
    // 속도도 약간 변화시켜 워프 효과
    targetSpeed = Math.abs(moveAmount) * 0.5;
    targetSpeed = Math.min(CONFIG.maxSpeed, targetSpeed);
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    const delta = 0.016;
    
    // Smooth speed
    speed += (targetSpeed - speed) * 0.05;
    const normalizedSpeed = speed / CONFIG.maxSpeed;
    warpIntensity += (normalizedSpeed - warpIntensity) * 0.1;
    
    // Camera movement - FORWARD toward center (increasing z)
    const boost = keys['shift'] ? 3 : 1;
    const keyMoveSpeed = 80 * boost * delta;
    
    // W: 중심으로 전진 (z 증가), S: 뒤로 후진 (z 감소)
    if (keys['w'] || keys['arrowup']) {
        cameraZ += keyMoveSpeed * 2.5;
        targetSpeed = Math.min(CONFIG.maxSpeed, targetSpeed + 2);
    }
    if (keys['s'] || keys['arrowdown']) {
        cameraZ -= keyMoveSpeed;
        targetSpeed = Math.min(CONFIG.maxSpeed, targetSpeed + 1);
    }
    
    // 자동 감속
    targetSpeed *= 0.98;
    
    cameraZ = Math.max(-6000, Math.min(800, cameraZ));
    
    cameraZ = Math.max(-6000, Math.min(800, cameraZ));
    journeyProgress = (cameraZ + 6000) / 6800;
    
    // Camera rotation
    camera.rotation.x += (targetRotationX - camera.rotation.x) * 0.05;
    camera.rotation.y += (targetRotationY - camera.rotation.y) * 0.05;
    camera.position.z = cameraZ;
    
    // Dynamic FOV
    camera.fov += ((85 + warpIntensity * 30) - camera.fov) * 0.05;
    camera.updateProjectionMatrix();
    
    // Rotate central core
    if (centralCore) {
        centralCore.rotation.z += 0.0008;
        centralCore.rotation.y += 0.0003;
    }
    
    // Update star layers
    starLayers.forEach((layer, index) => {
        layer.position.x = camera.position.x * 0.05 * layer.userData.scale;
        layer.position.y = camera.position.y * 0.05 * layer.userData.scale;
        layer.rotation.z += 0.00002 * (index + 1);
    });
    
    // Update nebulae
    nebulaClouds.forEach((nebula) => {
        nebula.rotation.z += nebula.userData.rotationSpeed;
        nebula.position.z = (nebula.userData.centerZ - cameraZ) * 0.3;
    });
    
    // Update galaxy clusters
    galaxyClusters.forEach((cluster) => {
        cluster.rotation.y += 0.0002;
        cluster.rotation.z += 0.0001;
    });
    
    // Update space dust - moving toward camera
    spaceDust.forEach((dust) => {
        const positions = dust.geometry.attributes.position.array;
        const velocities = dust.userData.velocities;
        
        for (let i = 0; i < positions.length; i += 3) {
            positions[i] += velocities[i] * normalizedSpeed * delta * 0.1;
            positions[i+1] += velocities[i+1] * normalizedSpeed * delta * 0.1;
            positions[i+2] += velocities[i+2] * normalizedSpeed * delta * 0.5;
            
            if (positions[i+2] > cameraZ + 200) {
                positions[i] = camera.position.x + (Math.random() - 0.5) * 4000;
                positions[i+1] = camera.position.y + (Math.random() - 0.5) * 4000;
                positions[i+2] = cameraZ - 6000 - Math.random() * 3000;
            }
        }
        
        dust.geometry.attributes.position.needsUpdate = true;
        dust.material.opacity = 0.4 + warpIntensity * 0.5;
    });
    
    // Update warp lines
    if (warpLines) {
        const positions = warpLines.geometry.attributes.position.array;
        const originalPositions = warpLines.userData.originalPositions;
        
        warpLines.material.opacity = 0.1 + warpIntensity * 0.6;
        warpLines.material.color.setHSL(0.55 + warpIntensity * 0.15, 1, 0.5 + warpIntensity * 0.3);
        
        for (let i = 0; i < positions.length; i += 6) {
            const stretch = 1 + warpIntensity * 15;
            const origZ = originalPositions[i + 2];
            const origLength = originalPositions[i + 5] - originalPositions[i + 2];
            
            positions[i + 2] = origZ + (cameraZ + 6000) * 0.8;
            positions[i + 5] = positions[i + 2] + origLength * stretch;
            
            if (positions[i + 2] > cameraZ + 300) {
                const offset = -10000 - Math.random() * 5000;
                originalPositions[i + 2] = offset;
                originalPositions[i + 5] = offset + origLength;
            }
        }
        
        warpLines.geometry.attributes.position.needsUpdate = true;
    }
    
    nearestCluster = findNearestCluster();
    updateHUD();
    
    renderer.render(scene, camera);
}

function updateHUD() {
    const normalizedSpeed = speed / CONFIG.maxSpeed;
    const distanceEl = document.getElementById('distanceDisplay');
    if (distanceEl) distanceEl.textContent = (Math.abs(cameraZ / 1000)).toFixed(2) + ' LY';
    
    const coordsEl = document.getElementById('coordsDisplay');
    if (coordsEl) coordsEl.textContent = `X:${Math.round(camera.position.x)} Y:${Math.round(camera.position.y)} Z:${Math.round(cameraZ)}`;
    
    const speedValEl = document.getElementById('speedValue');
    if (speedValEl) speedValEl.textContent = (normalizedSpeed * 9.9).toFixed(1);
    
    const speedFill = document.getElementById('speedFill');
    if (speedFill) speedFill.style.width = (warpIntensity * 100) + '%';
    
    const targetEl = document.getElementById('targetInfo');
    if (targetEl) {
        if (nearestCluster) {
            targetEl.innerHTML = `
                <div class="target-name">TARGET: ${nearestCluster.name}</div>
                <div class="target-dist">DIST: ${(nearestCluster.distance / 100).toFixed(1)} AU</div>
            `;
            targetEl.style.opacity = '1';
        } else if (journeyProgress > 0.85) {
            targetEl.innerHTML = `
                <div class="target-name" style="color:#ff6b35">GALACTIC CORE</div>
                <div class="target-dist">DIST: ${(Math.abs(cameraZ)/100).toFixed(1)} AU</div>
            `;
            targetEl.style.opacity = '1';
        } else {
            targetEl.style.opacity = '0';
        }
    }
    
    const warpIndicator = document.getElementById('warpIndicator');
    if (warpIndicator) {
        warpIndicator.style.opacity = warpIntensity > 0.3 ? '1' : '0';
        warpIndicator.style.transform = `scale(${1 + warpIntensity * 0.8})`;
    }
}

document.addEventListener('DOMContentLoaded', init);
