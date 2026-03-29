// ============================================
// STARSHIP BRIDGE - Immersive Cosmic Journey
// Captain's view with targeting, depth, and momentum
// ============================================

let scene, camera, renderer;
let starLayers = [];
let nebulaClouds = [];
let galaxyClusters = [];
let filaments = [];
let spaceDust = [];
let warpLines;
let mouseX = 0, mouseY = 0;
let targetRotationX = 0, targetRotationY = 0;
let isDragging = false;
let previousMouseX = 0, previousMouseY = 0;
let speed = 0;
let targetSpeed = 0;
let velocity = { x: 0, y: 0, z: 0 };
let cameraZ = 0;
let warpIntensity = 0;
let nearestCluster = null;
let approachScale = 1;

const keys = {};

const CONFIG = {
    layers: 3,
    starsPerLayer: 8000,
    maxSpeed: 150,
    warpThreshold: 30,
    nebulaCount: 12,
    clusterCount: 15, // Reduced for closer spacing
    filamentCount: 30,
    voidCount: 3,
    universeSize: 8000, // Reduced from 20000 for better approachability
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

// Cosmic Web Structure Data
let cosmicStructure = {
    clusters: [],
    filaments: [],
    voids: []
};

function init() {
    scene = new THREE.Scene();
    // Reduced fog for better visibility
    scene.fog = new THREE.FogExp2(0x000000, 0.00003);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 15000);
    camera.position.z = 0;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 1);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    generateCosmicStructure();
    createCosmicWebStarfield();
    createFilamentConnections();
    createNebulaClouds();
    createGalaxyClusters();
    createSpaceDust();
    createWarpLines();
    
    setupEvents();
    animate();
}

// ============================================
// Generate Cosmic Structure - Smaller Scale
// ============================================

function generateCosmicStructure() {
    const universeSize = CONFIG.universeSize;
    
    // Generate Galaxy Clusters (Nodes) - Closer together
    for (let i = 0; i < CONFIG.clusterCount; i++) {
        cosmicStructure.clusters.push({
            id: i,
            name: generateClusterName(i),
            x: (Math.random() - 0.5) * universeSize * 0.8,
            y: (Math.random() - 0.5) * universeSize * 0.5,
            z: -Math.random() * universeSize * 0.8 - 1000,
            radius: 150 + Math.random() * 250,
            density: 0.8 + Math.random() * 0.2,
            mass: Math.random(),
            type: ['Spiral', 'Elliptical', 'Irregular'][Math.floor(Math.random() * 3)]
        });
    }
    
    // Generate Voids (Empty regions) - Smaller impact
    for (let i = 0; i < CONFIG.voidCount; i++) {
        cosmicStructure.voids.push({
            x: (Math.random() - 0.5) * universeSize,
            y: (Math.random() - 0.5) * universeSize * 0.6,
            z: -Math.random() * universeSize - 1000,
            radius: 400 + Math.random() * 600
        });
    }
    
    // Generate Filaments (Connections between clusters)
    for (let i = 0; i < cosmicStructure.clusters.length; i++) {
        const cluster = cosmicStructure.clusters[i];
        const connections = 2 + Math.floor(Math.random() * 2);
        
        for (let j = 1; j <= connections; j++) {
            const targetIdx = (i + j) % cosmicStructure.clusters.length;
            const target = cosmicStructure.clusters[targetIdx];
            
            cosmicStructure.filaments.push({
                start: cluster,
                end: target,
                thickness: 30 + Math.random() * 50,
                density: 0.5 + Math.random() * 0.3
            });
        }
    }
}

function generateClusterName(index) {
    const prefixes = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta'];
    const suffixes = ['Prime', 'Major', 'Minor', 'Nebula', 'Cluster', 'System', 'Hub'];
    const prefix = prefixes[index % prefixes.length];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const num = Math.floor(index / prefixes.length) + 1;
    return `${prefix}-${num} ${suffix}`;
}

// ============================================
// Cosmic Web Starfield with Approach Effect
// ============================================

function createCosmicWebStarfield() {
    for (let layer = 0; layer < CONFIG.layers; layer++) {
        const scale = Math.pow(2, layer);
        const count = CONFIG.starsPerLayer;
        
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        const sizes = [];
        const originalSizes = [];
        const clusterIds = [];
        const color = new THREE.Color();
        
        let starsCreated = 0;
        
        while (starsCreated < count) {
            const universeSize = CONFIG.universeSize * scale;
            let x = (Math.random() - 0.5) * universeSize;
            let y = (Math.random() - 0.5) * universeSize * 0.6;
            let z = -Math.random() * universeSize - 500 * scale;
            
            let density = 0.5;
            let nearestDist = Infinity;
            let nearestId = -1;
            
            // Check proximity to clusters
            for (let i = 0; i < cosmicStructure.clusters.length; i++) {
                const cluster = cosmicStructure.clusters[i];
                const dx = x - cluster.x * scale;
                const dy = y - cluster.y * scale;
                const dz = z - cluster.z * scale;
                const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
                
                if (dist < cluster.radius * scale) {
                    const normalizedDist = dist / (cluster.radius * scale);
                    density += cluster.density * (1 - normalizedDist) * 4;
                }
                
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestId = i;
                }
            }
            
            // Check filaments
            for (const filament of cosmicStructure.filaments) {
                const startX = filament.start.x * scale;
                const startY = filament.start.y * scale;
                const startZ = filament.start.z * scale;
                const endX = filament.end.x * scale;
                const endY = filament.end.y * scale;
                const endZ = filament.end.z * scale;
                
                const distToFilament = distanceToLineSegment(x, y, z, startX, startY, startZ, endX, endY, endZ);
                
                if (distToFilament < filament.thickness * scale) {
                    const normalizedDist = distToFilament / (filament.thickness * scale);
                    density += filament.density * (1 - normalizedDist) * 2;
                }
            }
            
            // Check voids
            for (const voidRegion of cosmicStructure.voids) {
                const dx = x - voidRegion.x * scale;
                const dy = y - voidRegion.y * scale;
                const dz = z - voidRegion.z * scale;
                const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
                
                if (dist < voidRegion.radius * scale) {
                    const normalizedDist = dist / (voidRegion.radius * scale);
                    density *= 0.5 + normalizedDist * 0.4;
                }
            }
            
            if (Math.random() > density * 0.8) continue;
            
            x += (Math.random() - 0.5) * 50 * scale;
            y += (Math.random() - 0.5) * 50 * scale;
            z += (Math.random() - 0.5) * 50 * scale;
            
            positions.push(x, y, z);
            
            // Color based on density and cluster
            const cluster = cosmicStructure.clusters[nearestId];
            const temp = Math.random();
            
            if (density > 2.5) {
                // Core stars - hot colors
                if (temp < 0.5) color.setHex(CONFIG.colors.white);
                else if (temp < 0.8) color.setHex(CONFIG.colors.gold);
                else color.setHex(CONFIG.colors.cyan);
            } else if (density > 1.2) {
                // Medium density
                if (cluster.type === 'Spiral') color.setHex(CONFIG.colors.blue);
                else if (cluster.type === 'Elliptical') color.setHex(CONFIG.colors.gold);
                else color.setHex(CONFIG.colors.purple);
            } else {
                // Low density - cool colors
                color.setHex(Math.random() > 0.5 ? CONFIG.colors.violet : 0x4466aa);
            }
            
            const variation = (Math.random() - 0.5) * 0.3;
            colors.push(
                Math.max(0, Math.min(1, color.r + variation)),
                Math.max(0, Math.min(1, color.g + variation)),
                Math.max(0, Math.min(1, color.b + variation))
            );
            
            // Size based on density and layer
            const baseSize = (3 - layer) * 1.2 + 0.5;
            const densityBoost = Math.min(density * 0.4, 3);
            const size = baseSize + densityBoost + Math.random() * 0.5;
            sizes.push(size);
            originalSizes.push(size);
            clusterIds.push(nearestId);
            
            starsCreated++;
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
        
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.15, 'rgba(255,255,255,0.9)');
        grad.addColorStop(0.4, 'rgba(255,255,255,0.5)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);
        
        const material = new THREE.PointsMaterial({
            size: 4,
            vertexColors: true,
            map: new THREE.CanvasTexture(canvas),
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            opacity: 0.95 - layer * 0.2
        });
        
        const stars = new THREE.Points(geometry, material);
        stars.userData = { 
            layer: layer, 
            scale: scale,
            originalSizes: originalSizes,
            clusterIds: clusterIds
        };
        scene.add(stars);
        starLayers.push(stars);
    }
}

function distanceToLineSegment(px, py, pz, x1, y1, z1, x2, y2, z2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dz = z2 - z1;
    
    const len = Math.sqrt(dx*dx + dy*dy + dz*dz);
    if (len === 0) return Math.sqrt((px-x1)**2 + (py-y1)**2 + (pz-z1)**2);
    
    const t = Math.max(0, Math.min(1, ((px-x1)*dx + (py-y1)*dy + (pz-z1)*dz) / (len*len)));
    
    const projX = x1 + t * dx;
    const projY = y1 + t * dy;
    const projZ = z1 + t * dz;
    
    return Math.sqrt((px-projX)**2 + (py-projY)**2 + (pz-projZ)**2);
}

// ============================================
// Filament Connections
// ============================================

function createFilamentConnections() {
    const lineMaterial = new THREE.LineBasicMaterial({
        color: 0x4488cc,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending
    });
    
    for (let layer = 0; layer < 2; layer++) {
        const scale = Math.pow(2, layer);
        const lineGeometry = new THREE.BufferGeometry();
        const linePositions = [];
        
        for (const filament of cosmicStructure.filaments) {
            const startX = filament.start.x * scale;
            const startY = filament.start.y * scale;
            const startZ = filament.start.z * scale;
            const endX = filament.end.x * scale;
            const endY = filament.end.y * scale;
            const endZ = filament.end.z * scale;
            
            const segments = 8;
            for (let i = 0; i < segments; i++) {
                const t1 = i / segments;
                const t2 = (i + 1) / segments;
                
                const curve = Math.sin(t1 * Math.PI) * 50 * scale;
                
                const x1 = startX + (endX - startX) * t1 + curve;
                const y1 = startY + (endY - startY) * t1 + curve * 0.3;
                const z1 = startZ + (endZ - startZ) * t1;
                
                const x2 = startX + (endX - startX) * t2 + curve;
                const y2 = startY + (endY - startY) * t2 + curve * 0.3;
                const z2 = startZ + (endZ - startZ) * t2;
                
                linePositions.push(x1, y1, z1, x2, y2, z2);
            }
        }
        
        lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        
        const lines = new THREE.LineSegments(lineGeometry, lineMaterial.clone());
        lines.material.opacity = 0.25 - layer * 0.1;
        scene.add(lines);
        filaments.push(lines);
    }
}

// ============================================
// Enhanced Nebula Clouds
// ============================================

function createNebulaClouds() {
    for (const cluster of cosmicStructure.clusters) {
        if (Math.random() > 0.7) continue;
        
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        const sizes = [];
        const color = new THREE.Color();
        
        const nebulaTypes = [CONFIG.colors.purple, CONFIG.colors.pink, CONFIG.colors.cyan, CONFIG.colors.blue];
        color.setHex(nebulaTypes[Math.floor(Math.random() * nebulaTypes.length)]);
        
        const particleCount = 600;
        
        for (let i = 0; i < particleCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            const radius = Math.pow(Math.random(), 0.4) * cluster.radius * 2.5;
            
            const x = cluster.x + radius * Math.sin(phi) * Math.cos(theta);
            const y = cluster.y + radius * Math.sin(phi) * Math.sin(theta) * 0.4;
            const z = cluster.z + radius * Math.cos(phi) * 0.7;
            
            positions.push(x, y, z);
            
            const variation = (Math.random() - 0.5) * 0.4;
            colors.push(
                Math.max(0, Math.min(1, color.r + variation)),
                Math.max(0, Math.min(1, color.g + variation)),
                Math.max(0, Math.min(1, color.b + variation))
            );
            
            sizes.push(Math.random() * 60 + 25);
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
        
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        grad.addColorStop(0, 'rgba(255,255,255,0.5)');
        grad.addColorStop(0.4, 'rgba(255,255,255,0.2)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 128, 128);
        
        const material = new THREE.PointsMaterial({
            size: 70,
            vertexColors: true,
            map: new THREE.CanvasTexture(canvas),
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            opacity: 0.6
        });
        
        const nebula = new THREE.Points(geometry, material);
        nebula.userData = {
            centerZ: cluster.z,
            clusterId: cluster.id,
            rotationSpeed: (Math.random() - 0.5) * 0.0002
        };
        
        scene.add(nebula);
        nebulaClouds.push(nebula);
    }
}

// ============================================
// Galaxy Cluster Cores - Bright Centers
// ============================================

function createGalaxyClusters() {
    for (const cluster of cosmicStructure.clusters) {
        const coreGeometry = new THREE.BufferGeometry();
        const corePositions = [];
        const coreColors = [];
        const coreSizes = [];
        
        const coreCount = 300;
        
        for (let i = 0; i < coreCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            const radius = Math.pow(Math.random(), 2) * cluster.radius * 0.4;
            
            const x = cluster.x + radius * Math.sin(phi) * Math.cos(theta);
            const y = cluster.y + radius * Math.sin(phi) * Math.sin(theta);
            const z = cluster.z + radius * Math.cos(phi);
            
            corePositions.push(x, y, z);
            
            const color = new THREE.Color();
            if (Math.random() > 0.4) color.setHex(CONFIG.colors.white);
            else if (Math.random() > 0.5) color.setHex(CONFIG.colors.gold);
            else color.setHex(CONFIG.colors.cyan);
            
            coreColors.push(color.r, color.g, color.b);
            coreSizes.push(Math.random() * 10 + 5);
        }
        
        coreGeometry.setAttribute('position', new THREE.Float32BufferAttribute(corePositions, 3));
        coreGeometry.setAttribute('color', new THREE.Float32BufferAttribute(coreColors, 3));
        coreGeometry.setAttribute('size', new THREE.Float32BufferAttribute(coreSizes, 1));
        
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.2, 'rgba(255,255,200,0.7)');
        grad.addColorStop(0.5, 'rgba(255,255,255,0.3)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 64, 64);
        
        const coreMaterial = new THREE.PointsMaterial({
            size: 10,
            vertexColors: true,
            map: new THREE.CanvasTexture(canvas),
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            transparent: true,
            opacity: 1
        });
        
        const core = new THREE.Points(coreGeometry, coreMaterial);
        core.userData = { clusterId: cluster.id };
        scene.add(core);
        galaxyClusters.push(core);
    }
}

// ============================================
// Space Dust - Speed sensation particles
// ============================================

function createSpaceDust() {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const velocities = [];
    
    const count = 500;
    
    for (let i = 0; i < count; i++) {
        positions.push(
            (Math.random() - 0.5) * 2000,
            (Math.random() - 0.5) * 2000,
            -Math.random() * 5000
        );
        velocities.push(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            -50 - Math.random() * 100
        );
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
        color: 0x88aaff,
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

// ============================================
// Warp Lines
// ============================================

function createWarpLines() {
    const lineCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const originalPositions = [];
    
    for (let i = 0; i < lineCount; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = -Math.random() * 10000;
        
        const length = 50 + Math.random() * 150;
        
        positions.push(x, y, z, x, y, z - length);
        originalPositions.push(x, y, z, x, y, z - length);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    const material = new THREE.LineBasicMaterial({
        color: 0x00d4ff,
        transparent: true,
        opacity: 0.1,
        blending: THREE.AdditiveBlending
    });
    
    warpLines = new THREE.LineSegments(geometry, material);
    warpLines.userData = { originalPositions: originalPositions };
    scene.add(warpLines);
}

// ============================================
// Find Nearest Cluster for Targeting
// ============================================

function findNearestCluster() {
    let nearest = null;
    let minDist = Infinity;
    
    for (const cluster of cosmicStructure.clusters) {
        const dx = cluster.x - camera.position.x;
        const dy = cluster.y - camera.position.y;
        const dz = cluster.z - cameraZ;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        if (dist < minDist) {
            minDist = dist;
            nearest = { ...cluster, distance: dist };
        }
    }
    
    return nearest;
}

// ============================================
// Event Handling
// ============================================

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
        const deltaX = event.clientX - previousMouseX;
        const deltaY = event.clientY - previousMouseY;
        
        targetRotationY += deltaX * 0.005;
        targetRotationX += deltaY * 0.005;
        
        previousMouseX = event.clientX;
        previousMouseY = event.clientY;
    }
}

function onMouseDown(event) {
    isDragging = true;
    previousMouseX = event.clientX;
    previousMouseY = event.clientY;
}

function onMouseUp() {
    isDragging = false;
}

function onWheel(event) {
    const boost = keys['shift'] ? 3 : 1;
    targetSpeed += event.deltaY * 0.03 * boost;
    targetSpeed = Math.max(0, Math.min(CONFIG.maxSpeed, targetSpeed));
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ============================================
// Animation Loop
// ============================================

function animate() {
    requestAnimationFrame(animate);
    
    const delta = 0.016;
    
    // Smooth speed transition
    speed += (targetSpeed - speed) * 0.05;
    
    // Calculate warp intensity
    const normalizedSpeed = speed / CONFIG.maxSpeed;
    warpIntensity += (normalizedSpeed - warpIntensity) * 0.1;
    
    // Camera movement with momentum
    const boost = keys['shift'] ? 2.5 : 1;
    const moveSpeed = speed * 20 * boost * delta;
    
    if (keys['w']) cameraZ -= moveSpeed * 2;
    if (keys['s']) cameraZ += moveSpeed;
    cameraZ -= moveSpeed * 0.5;
    
    // Smooth rotation
    camera.rotation.x += (targetRotationX - camera.rotation.x) * 0.05;
    camera.rotation.y += (targetRotationY - camera.rotation.y) * 0.05;
    
    // Apply camera position
    camera.position.z = cameraZ;
    
    // Dynamic FOV based on speed
    const targetFOV = 75 + warpIntensity * 35;
    camera.fov += (targetFOV - camera.fov) * 0.05;
    camera.updateProjectionMatrix();
    
    // Update star layers with approach scaling
    starLayers.forEach((layer, index) => {
        const scale = layer.userData.scale;
        
        layer.position.x = camera.position.x * 0.1 * scale;
        layer.position.y = camera.position.y * 0.1 * scale;
        
        const wrapDistance = CONFIG.universeSize * scale;
        if (cameraZ < layer.position.z - wrapDistance / 2) {
            layer.position.z -= wrapDistance;
        }
        
        layer.rotation.z += 0.0001 * (index + 1);
    });
    
    // Update nebulae
    nebulaClouds.forEach((nebula) => {
        nebula.rotation.z += nebula.userData.rotationSpeed;
        const parallaxZ = (nebula.userData.centerZ - cameraZ) * 0.3;
        nebula.position.z = Math.max(-3000, Math.min(500, parallaxZ));
    });
    
    // Update galaxy clusters
    galaxyClusters.forEach((cluster) => {
        cluster.rotation.y += 0.0002;
        cluster.rotation.z += 0.0001;
    });
    
    // Update space dust
    spaceDust.forEach((dust) => {
        const positions = dust.geometry.attributes.position.array;
        const velocities = dust.userData.velocities;
        
        for (let i = 0; i < positions.length; i += 3) {
            positions[i] += velocities[i] * speed * delta * 0.1;
            positions[i+1] += velocities[i+1] * speed * delta * 0.1;
            positions[i+2] += velocities[i+2] * speed * delta * 0.5;
            
            // Reset if behind camera
            if (positions[i+2] > cameraZ + 500) {
                positions[i] = camera.position.x + (Math.random() - 0.5) * 2000;
                positions[i+1] = camera.position.y + (Math.random() - 0.5) * 2000;
                positions[i+2] = cameraZ - 5000 - Math.random() * 2000;
            }
        }
        
        dust.geometry.attributes.position.needsUpdate = true;
        dust.material.opacity = 0.3 + warpIntensity * 0.5;
    });
    
    // Update warp lines
    if (warpLines) {
        const positions = warpLines.geometry.attributes.position.array;
        const originalPositions = warpLines.userData.originalPositions;
        
        warpLines.material.opacity = 0.1 + warpIntensity * 0.5;
        
        const hue = 0.5 + warpIntensity * 0.15;
        warpLines.material.color.setHSL(hue, 1, 0.5 + warpIntensity * 0.3);
        
        for (let i = 0; i < positions.length; i += 6) {
            const stretch = 1 + warpIntensity * 15;
            const origZ = originalPositions[i + 2];
            const origLength = originalPositions[i + 5] - originalPositions[i + 2];
            
            positions[i + 2] = origZ + cameraZ * 0.1;
            positions[i + 5] = positions[i + 2] - origLength * stretch;
            
            if (positions[i + 2] > cameraZ + 500) {
                const offset = -10000 - Math.random() * 3000;
                originalPositions[i + 2] = offset;
                originalPositions[i + 5] = offset - (50 + Math.random() * 150);
            }
        }
        
        warpLines.geometry.attributes.position.needsUpdate = true;
    }
    
    // Find nearest cluster
    nearestCluster = findNearestCluster();
    
    // Update UI
    updateHUD();
    
    renderer.render(scene, camera);
}

function updateHUD() {
    const distance = Math.abs(cameraZ / 1000).toFixed(2);
    const distanceEl = document.getElementById('distanceDisplay');
    if (distanceEl) distanceEl.textContent = distance + ' LY';
    
    const coordX = Math.round(camera.position.x);
    const coordY = Math.round(camera.position.y);
    const coordZ = Math.round(cameraZ);
    const coordsEl = document.getElementById('coordsDisplay');
    if (coordsEl) coordsEl.textContent = `X:${coordX} Y:${coordY} Z:${coordZ}`;
    
    const warpFactor = (speed / CONFIG.maxSpeed * 9.9).toFixed(1);
    const speedValEl = document.getElementById('speedValue');
    if (speedValEl) speedValEl.textContent = warpFactor;
    
    const speedFill = document.getElementById('speedFill');
    if (speedFill) {
        speedFill.style.width = (warpIntensity * 100) + '%';
    }
    
    // Update targeting info
    const targetEl = document.getElementById('targetInfo');
    if (targetEl && nearestCluster) {
        const dist = (nearestCluster.distance / 100).toFixed(1);
        targetEl.innerHTML = `
            <div class="target-name">TARGET: ${nearestCluster.name}</div>
            <div class="target-dist">DISTANCE: ${dist} AU</div>
            <div class="target-type">TYPE: ${nearestCluster.type}</div>
        `;
        targetEl.style.opacity = '1';
    }
    
    // Update warp indicator
    const warpIndicator = document.getElementById('warpIndicator');
    if (warpIndicator) {
        warpIndicator.style.opacity = warpIntensity > 0.3 ? '1' : '0';
        warpIndicator.style.transform = `scale(${1 + warpIntensity * 0.5})`;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
