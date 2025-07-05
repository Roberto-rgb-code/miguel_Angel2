import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Variables principales
let scene, camera, renderer, controls;
let robotArmModel = null;
let humanModel = null;
let armMixer = null;
let humanMixer = null;
const clock = new THREE.Clock();
let scrollY = 0;
let currentScrollY = 0;

// Configuración de secciones
const sections = ['genesis', 'encounter', 'evolution', 'future'];
let currentSection = 0;

// Configuración del encuentro - Nueva paleta
const CREATION_CONFIG = {
    initialPositions: {
        arm: { x: -3, y: 0, z: 1 },
        human: { x: 3, y: -2.5, z: 0 }
    },
    finalPositions: {
        arm: { x: -15, y: 6, z: -5 },
        human: { x: 15, y: -8, z: 8 }
    },
    touchRotations: {
        arm: { x: -0.3, y: Math.PI * 0.15, z: -0.1 },
        human: { x: 0.4, y: -Math.PI * 0.2, z: 0.1 }
    },
    touchMoment: {
        arm: { x: -1.5, y: -0.5, z: 0.5 },
        human: { x: 1.5, y: -1.5, z: 0 },
        fingerDistance: 0.5
    }
};

// Funciones auxiliares
const lerp = (start, end, factor) => start + (end - start) * factor;
const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

// Inicialización
init();
animate();
setupScrollEffects();
setupNavigation();

function init() {
    // Crear escena
    scene = new THREE.Scene();
    
    // Fondo moderno con gradiente dark
    const gradientTexture = createModernBackground();
    scene.background = gradientTexture;
    scene.fog = new THREE.Fog(0x0a0a0f, 20, 80);

    // Configurar cámara
    camera = new THREE.PerspectiveCamera(
        65,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, -4, 30);
    camera.lookAt(0, -4.5, 0);

    // Configurar renderer moderno
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        precision: "mediump",
        stencil: false,
        depth: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x0a0a0f, 0.1);
    
    // Configurar sombras
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    
    // Tone mapping moderno
    if (renderer.capabilities.isWebGL2) {
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.4;
    } else {
        renderer.toneMapping = THREE.LinearToneMapping;
        renderer.toneMappingExposure = 1.2;
    }
    
    document.body.appendChild(renderer.domElement);

    // Configurar controles
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enableZoom = true;
    controls.enablePan = false;
    controls.maxPolarAngle = Math.PI / 1.4;
    controls.minDistance = 15;
    controls.maxDistance = 50;
    controls.autoRotate = false;
    controls.target.set(0, 0, 0);

    // Configurar iluminación moderna
    setupModernLighting();

    // Crear elementos de respaldo modernos
    createModernFallbackScene();

    // Cargar modelos
    loadCreationModels();

    // Event listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('scroll', onScroll);
}

function createModernBackground() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const context = canvas.getContext('2d');
    
    // Gradiente dark moderno
    const gradient = context.createRadialGradient(512, 300, 0, 512, 300, 700);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.4, '#16213e');
    gradient.addColorStop(0.7, '#0f172a');
    gradient.addColorStop(1, '#0a0a0f');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 1024, 1024);
    
    // Partículas tech sutiles
    context.globalAlpha = 0.3;
    context.fillStyle = '#6366f1';
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 500;
        const radius = Math.random() * 3 + 1;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

function setupModernLighting() {
    // Luz ambiental moderna
    const ambientLight = new THREE.AmbientLight(0x6366f1, 0.3);
    scene.add(ambientLight);

    // Luz principal tech
    const mainLight = new THREE.DirectionalLight(0x00d4ff, 2.0);
    mainLight.position.set(0, 25, 15);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 80;
    mainLight.shadow.camera.left = -25;
    mainLight.shadow.camera.right = 25;
    mainLight.shadow.camera.top = 25;
    mainLight.shadow.camera.bottom = -25;
    scene.add(mainLight);

    // Luz cyber para el brazo
    const techLight = new THREE.PointLight(0x6366f1, 1.6, 40);
    techLight.position.set(-8, 8, 12);
    techLight.castShadow = true;
    scene.add(techLight);

    // Luz warm para el humano
    const humanLight = new THREE.PointLight(0xf472b6, 1.4, 35);
    humanLight.position.set(8, 4, 12);
    humanLight.castShadow = true;
    scene.add(humanLight);

    // Luz del encuentro
    const meetingLight = new THREE.SpotLight(0x00d4ff, 2.5);
    meetingLight.position.set(0, 12, 15);
    meetingLight.target.position.set(0, 0, 0);
    meetingLight.angle = Math.PI / 6;
    meetingLight.penumbra = 0.4;
    meetingLight.decay = 1.2;
    meetingLight.distance = 45;
    meetingLight.castShadow = true;
    scene.add(meetingLight);
    scene.add(meetingLight.target);
}

function createModernFallbackScene() {
    // Plataforma tech
    const platformGeometry = new THREE.CylinderGeometry(20, 22, 2, 32);
    const platformMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x1a1a2e,
        transparent: true,
        opacity: 0.3,
        roughness: 0.1,
        metalness: 0.8,
        clearcoat: 1.0
    });
    
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(0, -12, 0);
    platform.receiveShadow = true;
    scene.add(platform);

    // Crear brazo robótico moderno
    createModernRoboticArm();

    // Respaldo humano
    const humanGeometry = new THREE.CapsuleGeometry(1.2, 5, 12, 24);
    const humanMaterial = new THREE.MeshPhysicalMaterial({
        color: 0xf472b6,
        roughness: 0.4,
        metalness: 0.1,
        clearcoat: 0.6,
        emissive: 0x331122,
        emissiveIntensity: 0.2
    });
    
    const humanFallback = new THREE.Mesh(humanGeometry, humanMaterial);
    humanFallback.position.copy(CREATION_CONFIG.initialPositions.human);
    humanFallback.rotation.set(...Object.values(CREATION_CONFIG.touchRotations.human));
    humanFallback.userData.isFallbackHuman = true;
    humanFallback.castShadow = true;
    humanFallback.receiveShadow = true;
    scene.add(humanFallback);

    // Partículas tech
    createTechParticles();
}

function createModernRoboticArm() {
    const armGroup = new THREE.Group();
    
    // Base moderna
    const baseGeometry = new THREE.CylinderGeometry(1.2, 1.8, 0.8, 16);
    const baseMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x1a1a2e,
        metalness: 0.9,
        roughness: 0.1,
        clearcoat: 1.0,
        emissive: 0x6366f1,
        emissiveIntensity: 0.1
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(0, -2.5, 0);
    armGroup.add(base);
    
    // Brazo principal
    const armSegment1Geometry = new THREE.CylinderGeometry(0.4, 0.5, 5, 12);
    const armMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x6366f1,
        metalness: 1.0,
        roughness: 0.05,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        emissive: 0x1e1b4b,
        emissiveIntensity: 0.3
    });
    const armSegment1 = new THREE.Mesh(armSegment1Geometry, armMaterial);
    armSegment1.position.set(0, 0, 0);
    armGroup.add(armSegment1);
    
    // Articulación
    const jointGeometry = new THREE.SphereGeometry(0.6, 20, 20);
    const jointMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x00d4ff,
        metalness: 1.0,
        roughness: 0.1,
        emissive: 0x003d4d,
        emissiveIntensity: 0.4
    });
    const joint = new THREE.Mesh(jointGeometry, jointMaterial);
    joint.position.set(0, 2.8, 0);
    armGroup.add(joint);
    
    // Antebrazo
    const forearmGeometry = new THREE.CylinderGeometry(0.3, 0.4, 4, 12);
    const forearm = new THREE.Mesh(forearmGeometry, armMaterial);
    forearm.position.set(1.5, 4.8, 0);
    forearm.rotation.z = Math.PI * 0.3;
    armGroup.add(forearm);
    
    // Mano tech
    const handGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.4);
    const hand = new THREE.Mesh(handGeometry, jointMaterial);
    hand.position.set(2.8, 6.2, 0);
    armGroup.add(hand);
    
    // Dedos tech
    const fingerGeometry = new THREE.BoxGeometry(0.08, 0.8, 0.1);
    
    const finger1 = new THREE.Mesh(fingerGeometry, jointMaterial);
    finger1.position.set(3.3, 6.6, 0.15);
    finger1.rotation.z = Math.PI * 0.1;
    armGroup.add(finger1);
    
    const finger2 = new THREE.Mesh(fingerGeometry, jointMaterial);
    finger2.position.set(3.3, 6.6, -0.15);
    finger2.rotation.z = Math.PI * 0.1;
    armGroup.add(finger2);
    
    // Configurar grupo
    armGroup.position.copy(CREATION_CONFIG.initialPositions.arm);
    armGroup.rotation.set(...Object.values(CREATION_CONFIG.touchRotations.arm));
    armGroup.userData.isRoboticArm = true;
    armGroup.userData.isGeometryArm = true;
    
    // Sombras
    armGroup.children.forEach(child => {
        child.castShadow = true;
        child.receiveShadow = true;
    });
    
    scene.add(armGroup);
    robotArmModel = armGroup;
}

function createTechParticles() {
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 200;
    const posArray = new Float32Array(particlesCount * 3);
    const colorArray = new Float32Array(particlesCount * 3);

    for(let i = 0; i < particlesCount * 3; i += 3) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 30 + 5;
        const height = (Math.random() - 0.5) * 25;
        
        posArray[i] = Math.cos(angle) * radius;
        posArray[i + 1] = height;
        posArray[i + 2] = Math.sin(angle) * radius;
        
        // Colores tech modernos
        const colorChoice = Math.random();
        if (colorChoice < 0.4) {
            // Púrpura
            colorArray[i] = 0.39;
            colorArray[i + 1] = 0.40;
            colorArray[i + 2] = 0.95;
        } else if (colorChoice < 0.7) {
            // Cyan
            colorArray[i] = 0.0;
            colorArray[i + 1] = 0.83;
            colorArray[i + 2] = 1.0;
        } else {
            // Rosa
            colorArray[i] = 0.96;
            colorArray[i + 1] = 0.45;
            colorArray[i + 2] = 0.71;
        }
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));

    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.025,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        vertexColors: true
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);
}

function loadCreationModels() {
    const loader = new FBXLoader();
    
    // Cargar brazo robótico
    loader.load(
        'base.fbx',
        (object) => {
            console.log('✅ base.fbx cargado exitosamente');
            setupRobotArm(object);
        },
        (progress) => {
            if (progress.lengthComputable) {
                const percentComplete = (progress.loaded / progress.total) * 100;
                console.log(`📈 Cargando base.fbx: ${percentComplete.toFixed(1)}%`);
            }
        },
        (error) => {
            console.log('📝 base.fbx no disponible, usando brazo moderno');
        }
    );

    // Cargar personaje humano
    loader.load(
        'Floating.fbx',
        (object) => {
            console.log('✅ Floating.fbx cargado exitosamente');
            setupHumanModel(object);
        },
        (progress) => {
            if (progress.lengthComputable) {
                const percentComplete = (progress.loaded / progress.total) * 100;
                console.log(`📈 Cargando Floating.fbx: ${percentComplete.toFixed(1)}%`);
            }
        },
        (error) => {
            console.log('📝 Floating.fbx no disponible, usando respaldo');
        }
    );
}

function setupRobotArm(object) {
    if (robotArmModel && robotArmModel.userData.isGeometryArm) {
        scene.remove(robotArmModel);
    }

    object.scale.setScalar(0.08);
    object.position.copy(CREATION_CONFIG.initialPositions.arm);
    object.rotation.set(...Object.values(CREATION_CONFIG.touchRotations.arm));
    
    // Aplicar materiales tech modernos
    object.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            if (child.material) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                
                materials.forEach((material) => {
                    if (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial) {
                        material.metalness = 0.9;
                        material.roughness = 0.1;
                        material.color.setHex(0x6366f1);
                        material.emissive.setHex(0x1e1b4b);
                        material.emissiveIntensity = 0.2;
                        
                        if (material.isMeshPhysicalMaterial) {
                            material.clearcoat = 1.0;
                            material.clearcoatRoughness = 0.1;
                        }
                    } else {
                        material.color.setHex(0x6366f1);
                        if (material.emissive !== undefined) {
                            material.emissive.setHex(0x1e1b4b);
                        }
                    }
                    
                    material.transparent = false;
                    material.opacity = 1.0;
                    material.needsUpdate = true;
                });
            }
        }
    });
    
    if (object.animations && object.animations.length > 0) {
        armMixer = new THREE.AnimationMixer(object);
        object.animations.forEach((clip) => {
            const action = armMixer.clipAction(clip);
            action.setLoop(THREE.LoopRepeat);
            action.clampWhenFinished = false;
            action.setEffectiveTimeScale(0.6);
            action.setEffectiveWeight(1.0);
            action.play();
        });
    }
    
    object.userData.isRobotArm = true;
    robotArmModel = object;
    scene.add(object);
}

function setupHumanModel(object) {
    const fallback = scene.children.find(child => child.userData.isFallbackHuman);
    if (fallback) scene.remove(fallback);

    object.scale.setScalar(8.0);
    object.position.copy(CREATION_CONFIG.initialPositions.human);
    object.rotation.set(...Object.values(CREATION_CONFIG.touchRotations.human));
    
    // Aplicar materiales humanos modernos
    object.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            if (child.material) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                
                materials.forEach((material) => {
                    if (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial) {
                        material.metalness = 0.1;
                        material.roughness = 0.6;
                        material.color.setHex(0xf472b6);
                        material.emissive.setHex(0x331122);
                        material.emissiveIntensity = 0.1;
                        
                        if (material.isMeshPhysicalMaterial) {
                            material.clearcoat = 0.4;
                            material.clearcoatRoughness = 0.6;
                        }
                    } else {
                        material.color.setHex(0xf472b6);
                        if (material.emissive !== undefined) {
                            material.emissive.setHex(0x331122);
                        }
                    }
                    
                    material.transparent = false;
                    material.opacity = 1.0;
                    material.needsUpdate = true;
                });
            }
        }
    });
    
    if (object.animations && object.animations.length > 0) {
        humanMixer = new THREE.AnimationMixer(object);
        object.animations.forEach((clip) => {
            const action = humanMixer.clipAction(clip);
            action.setLoop(THREE.LoopRepeat);
            action.clampWhenFinished = false;
            action.setEffectiveTimeScale(0.4);
            action.setEffectiveWeight(1.0);
            action.play();
        });
    }
    
    object.userData.isHumanModel = true;
    humanModel = object;
    scene.add(object);
}

function onScroll() {
    scrollY = window.pageYOffset;
    updateCurrentSection();
}

function updateCurrentSection() {
    const windowHeight = window.innerHeight;
    const newSection = Math.floor(scrollY / windowHeight);
    
    if (newSection !== currentSection && newSection < sections.length) {
        currentSection = newSection;
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateScrollAnimations() {
    const maxScroll = (sections.length - 1) * window.innerHeight;
    const scrollProgress = Math.min(scrollY / maxScroll, 1);
    
    // Actualizar barra de progreso
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        progressBar.style.transform = `scaleX(${scrollProgress})`;
    }

    currentScrollY = lerp(currentScrollY, scrollY, 0.06);
    const smoothProgress = Math.min(currentScrollY / maxScroll, 1);
    const easedProgress = easeInOutCubic(smoothProgress);

    const deltaTime = clock.getDelta();
    
    if (armMixer) {
        armMixer.update(deltaTime * 0.8);
    }
    
    if (humanMixer) {
        humanMixer.update(deltaTime * 0.7);
    }

    animateCreationSeparation(easedProgress);
    animateFallbackElements();
    animateModernCamera(smoothProgress);
    animateModernLights();
}

function animateCreationSeparation(progress) {
    const time = clock.getElapsedTime();
    
    let currentArmPos, currentHumanPos;
    
    if (progress <= 0.3) {
        const phase1Progress = progress / 0.3;
        const armStart = CREATION_CONFIG.initialPositions.arm;
        const armTouch = CREATION_CONFIG.touchMoment.arm;
        const humanStart = CREATION_CONFIG.initialPositions.human;
        const humanTouch = CREATION_CONFIG.touchMoment.human;
        
        currentArmPos = {
            x: lerp(armStart.x, armTouch.x, phase1Progress),
            y: lerp(armStart.y, armTouch.y, phase1Progress),
            z: lerp(armStart.z, armTouch.z, phase1Progress)
        };
        
        currentHumanPos = {
            x: lerp(humanStart.x, humanTouch.x, phase1Progress),
            y: lerp(humanStart.y, humanTouch.y, phase1Progress),
            z: lerp(humanStart.z, humanTouch.z, phase1Progress)
        };
        
    } else if (progress <= 0.7) {
        currentArmPos = { ...CREATION_CONFIG.touchMoment.arm };
        currentHumanPos = { ...CREATION_CONFIG.touchMoment.human };
        
        const touchIntensity = Math.sin(time * 4) * 0.02;
        
        currentArmPos.x += touchIntensity;
        currentArmPos.y += Math.sin(time * 3) * 0.01;
        currentHumanPos.x -= touchIntensity;
        currentHumanPos.y -= Math.sin(time * 3) * 0.01;
        
        // Efectos tech durante el toque
        if (robotArmModel && robotArmModel.userData.isGeometryArm) {
            robotArmModel.children.forEach((child) => {
                if (child.material && child.material.emissive) {
                    const glowPulse = Math.sin(time * 5) * 0.5 + 0.3;
                    child.material.emissiveIntensity = glowPulse;
                }
            });
        }
        
    } else {
        const phase3Progress = (progress - 0.7) / 0.3;
        const armTouch = CREATION_CONFIG.touchMoment.arm;
        const armFinal = CREATION_CONFIG.finalPositions.arm;
        const humanTouch = CREATION_CONFIG.touchMoment.human;
        const humanFinal = CREATION_CONFIG.finalPositions.human;
        
        currentArmPos = {
            x: lerp(armTouch.x, armFinal.x, phase3Progress),
            y: lerp(armTouch.y, armFinal.y, phase3Progress),
            z: lerp(armTouch.z, armFinal.z, phase3Progress)
        };
        
        currentHumanPos = {
            x: lerp(humanTouch.x, humanFinal.x, phase3Progress),
            y: lerp(humanTouch.y, humanFinal.y, phase3Progress),
            z: lerp(humanTouch.z, humanFinal.z, phase3Progress)
        };
    }
    
    // Aplicar posiciones al brazo robótico
    if (robotArmModel) {
        robotArmModel.position.copy(currentArmPos);
        
        const baseRotation = CREATION_CONFIG.touchRotations.arm;
        robotArmModel.rotation.x = baseRotation.x + Math.sin(time * 0.3) * 0.05;
        robotArmModel.rotation.y = baseRotation.y + (progress * Math.PI * 0.15);
        robotArmModel.rotation.z = baseRotation.z + Math.sin(time * 0.4) * 0.08;
        
        if (robotArmModel.userData.isGeometryArm) {
            robotArmModel.children.forEach((child, index) => {
                if (child.isMesh) {
                    child.rotation.y = Math.sin(time * 0.3 + index * 0.5) * 0.05;
                    
                    if (child.material && child.material.color && child.material.emissive) {
                        const intensity = progress > 0.3 && progress < 0.7 ? 
                            0.3 + Math.sin(time * 3) * 0.2 : 0.2;
                        child.material.emissiveIntensity = intensity;
                    }
                }
            });
        }
    }
    
    // Aplicar posiciones al humano
    if (humanModel) {
        humanModel.position.copy(currentHumanPos);
        
        const baseRotation = CREATION_CONFIG.touchRotations.human;
        humanModel.rotation.x = baseRotation.x + Math.cos(time * 0.35) * 0.06;
        humanModel.rotation.y = baseRotation.y - (progress * Math.PI * 0.12);
        humanModel.rotation.z = baseRotation.z + Math.sin(time * 0.25) * 0.04;
    }
    
    // Animar respaldo humano si no hay modelo FBX
    const humanFallback = scene.children.find(child => child.userData.isFallbackHuman);
    if (humanFallback && !humanModel) {
        humanFallback.position.copy(currentHumanPos);
        
        const baseRotation = CREATION_CONFIG.touchRotations.human;
        humanFallback.rotation.x = baseRotation.x + Math.cos(time * 0.35) * 0.06;
        humanFallback.rotation.y = baseRotation.y - (progress * Math.PI * 0.12);
        humanFallback.rotation.z = baseRotation.z;
        
        const breathScale = 1 + Math.sin(time * 1.2) * 0.02;
        humanFallback.scale.setScalar(breathScale);
        
        // Efectos de glow en el respaldo
        if (humanFallback.material && humanFallback.material.emissive) {
            const glowIntensity = progress > 0.3 && progress < 0.7 ? 
                0.2 + Math.sin(time * 2) * 0.1 : 0.1;
            humanFallback.material.emissiveIntensity = glowIntensity;
        }
    }
}

function animateFallbackElements() {
    const time = clock.getElapsedTime();
    
    // Animar partículas tech
    scene.children.forEach((child) => {
        if (child.isPoints) {
            child.rotation.y = time * 0.015;
            child.rotation.x = Math.sin(time * 0.1) * 0.08;
            
            const positions = child.geometry.attributes.position.array;
            const colors = child.geometry.attributes.color.array;
            
            for (let i = 0; i < positions.length; i += 3) {
                // Movimiento flotante tech
                positions[i + 1] += Math.sin(time * 0.5 + i * 0.1) * 0.003;
                
                // Pulsos de color tech
                const colorIndex = i;
                const pulse = Math.sin(time * 2 + i * 0.2) * 0.3 + 0.7;
                
                // Mantener colores tech
                if (colors[colorIndex] > 0.5) { // Púrpura
                    colors[colorIndex] = 0.39 * pulse;
                    colors[colorIndex + 1] = 0.40 * pulse;
                    colors[colorIndex + 2] = 0.95 * pulse;
                } else if (colors[colorIndex + 2] > 0.8) { // Cyan
                    colors[colorIndex] = 0.0;
                    colors[colorIndex + 1] = 0.83 * pulse;
                    colors[colorIndex + 2] = 1.0 * pulse;
                } else { // Rosa
                    colors[colorIndex] = 0.96 * pulse;
                    colors[colorIndex + 1] = 0.45 * pulse;
                    colors[colorIndex + 2] = 0.71 * pulse;
                }
            }
            
            child.geometry.attributes.position.needsUpdate = true;
            child.geometry.attributes.color.needsUpdate = true;
            
            // Tamaño pulsante tech
            child.material.size = 0.025 + Math.sin(time * 1.5) * 0.008;
        }
        
        // Animar plataforma tech
        if (child.geometry && child.geometry.type === 'CylinderGeometry' && child.material.transparent) {
            child.rotation.y = time * 0.008;
            child.material.opacity = 0.3 + Math.sin(time * 0.4) * 0.1;
            
            // Efecto de ondas tech en la plataforma
            if (child.material.emissive) {
                const waveIntensity = Math.sin(time * 0.8) * 0.1 + 0.05;
                child.material.emissiveIntensity = waveIntensity;
            }
        }
    });
}

function animateModernCamera(progress) {
    // Movimiento de cámara tech futurista
    const initialPos = { x: 0, y: -4, z: 30 };
    const touchMomentPos = { x: 0, y: -4, z: 16 }; // Más cercano para el momento tech
    const finalPos = { x: 0, y: 0, z: 50 }; // Vista épica final
    
    let targetPos;
    
    if (progress <= 0.3) {
        // Zoom dramático al momento del contacto
        const phase1 = progress / 0.3;
        targetPos = {
            x: lerp(initialPos.x, touchMomentPos.x, phase1),
            y: lerp(initialPos.y, touchMomentPos.y, phase1),
            z: lerp(initialPos.z, touchMomentPos.z, phase1)
        };
    } else if (progress <= 0.7) {
        // Vista íntima del momento tech
        targetPos = { ...touchMomentPos };
        
        // Movimiento orbital sutil durante el contacto
        const orbitMovement = Math.sin(clock.getElapsedTime() * 0.6) * 0.8;
        targetPos.x += orbitMovement;
        targetPos.z = 16 + Math.sin(clock.getElapsedTime() * 0.4) * 3;
    } else {
        // Retroceso épico para mostrar la separación completa
        const phase3 = (progress - 0.7) / 0.3;
        targetPos = {
            x: lerp(touchMomentPos.x, finalPos.x, phase3),
            y: lerp(touchMomentPos.y, finalPos.y, phase3),
            z: lerp(touchMomentPos.z, finalPos.z, phase3)
        };
    }
    
    // Aplicar movimiento suave de cámara
    camera.position.x = lerp(camera.position.x, targetPos.x, 0.025);
    camera.position.y = lerp(camera.position.y, targetPos.y, 0.025);
    camera.position.z = lerp(camera.position.z, targetPos.z, 0.025);
    
    // Punto de enfoque dinámico
    const focusPoint = new THREE.Vector3(0, -3, 0);
    camera.lookAt(focusPoint);
}

function animateModernLights() {
    const time = clock.getElapsedTime();
    
    // Animación de luces tech
    scene.children.forEach((child) => {
        if (child.isPointLight) {
            // Intensidad pulsante tech
            const baseIntensity = child.color.r > 0.8 ? 1.6 : 1.4; // Cyan vs Rosa
            child.intensity = baseIntensity + Math.sin(time * 0.8 + child.position.x) * 0.3;
            
            // Movimiento flotante
            child.position.y += Math.sin(time * 0.4) * 0.08;
        }
        
        if (child.isSpotLight) {
            // Luz del encuentro con pulsos tech
            const baseIntensity = 2.5;
            const techPulse = Math.sin(time * 1.2) * 0.4;
            child.intensity = baseIntensity + techPulse;
            
            // Movimiento sutil del spotlight
            child.position.x = Math.sin(time * 0.25) * 1.5;
        }
        
        if (child.isDirectionalLight) {
            // Luz principal con variación tech
            child.intensity = 2.0 + Math.sin(time * 0.5) * 0.2;
        }
    });
}

function setupScrollEffects() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -80px 0px'
    });

    document.querySelectorAll('.detail-item, .stage, .vision-card').forEach((element) => {
        observer.observe(element);
    });
}

function setupNavigation() {
    document.querySelectorAll('.nav-link').forEach((link) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach((section) => {
            const element = document.getElementById(section);
            if (element) {
                const rect = element.getBoundingClientRect();
                if (rect.top <= 120) {
                    current = section;
                }
            }
        });
        
        document.querySelectorAll('.nav-link').forEach((link) => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

function animate() {
    requestAnimationFrame(animate);

    // Actualizar todas las animaciones
    updateScrollAnimations();

    // Actualizar controles suaves
    controls.update();

    // Renderizar la escena tech
    renderer.render(scene, camera);
}