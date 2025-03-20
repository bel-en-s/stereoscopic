import * as THREE from 'three';
import { StereoEffect } from 'three/examples/jsm/effects/StereoEffect.js';
import { AnaglyphEffect } from 'three/examples/jsm/effects/AnaglyphEffect.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let camera, scene, renderer, stereoEffect, anaglyphEffect, currentEffect;
const objects = [];

let mouseX = 0, mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

const glbModels = [
    '/assets/cara.glb',
    '/assets/vidriera1.glb',
];

let currentModelIndex = 0;
let currentModel = null;

export function init() {
    scene = new THREE.Scene();

    // Cámara
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10);
    camera.position.z = 5;

    // Cargador de texturas
    const textureLoader = new THREE.TextureLoader();

    // Textura de fondo
    scene.background = textureLoader.load('/assets/water.jpeg');

    // Luces
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 2, 100);
    pointLight.position.set(2, 3, 2);
    scene.add(pointLight);

    // Crear objetos aleatorios con texturas
    createObjects(textureLoader);

    // Crear partículas (estrellas)
    createParticles(textureLoader);

    // Cargar modelo GLB inicial
    loadGLBModel(currentModelIndex);

    // Renderizador
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Efecto estereoscópico
    stereoEffect = new StereoEffect(renderer);
    stereoEffect.setSize(window.innerWidth, window.innerHeight);

    // Efecto anaglifo
    anaglyphEffect = new AnaglyphEffect(renderer);
    anaglyphEffect.setSize(window.innerWidth, window.innerHeight);

    // Efecto predeterminado
    currentEffect = stereoEffect;

    // Mostrar "Presiona T para anaglifo, M para cambiar modelos"
    showTextOverlay("Presiona T para anaglifo, M para cambiar modelos", 3000);

    // Escuchadores de eventos
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('mousemove', onDocumentMouseMove);
    document.addEventListener('keydown', onKeyDown);

    animate();
}

// Función para crear objetos aleatorios
function createObjects(textureLoader) {
    const texturePaths = [
        '/assets/bg.jpeg',
        '/assets/yellow.jpeg',
        '/assets/black.jpeg',

    ];

    for (let i = 0; i < 10; i++) {
        const geometry = Math.random() > 0.5 ? 
            new THREE.SphereGeometry(0.6, 32, 32) : 
            new THREE.BoxGeometry(1, 1, 1);

        const randomTexture = textureLoader.load(texturePaths[Math.floor(Math.random() * texturePaths.length)]);

        const material = new THREE.MeshStandardMaterial({
            map: randomTexture,
            metalness: 0.3,
            roughness: 0.7,
            side: THREE.DoubleSide
        });

        const object = new THREE.Mesh(geometry, material);
        object.position.set(
            Math.random() * 6 - 3, 
            Math.random() * 6 - 3, 
            Math.random() * 6 - 3
        );
        object.rotation.set(
            Math.random() * Math.PI, 
            Math.random() * Math.PI, 
            Math.random() * Math.PI
        );
        
        scene.add(object);
        objects.push(object);
    }
}

// Función para crear partículas (estrellas)
function createParticles(textureLoader) {
    const particleTexture = textureLoader.load('/assets/star.png');

    const particlesGeometry = new THREE.BufferGeometry();
    const positions = [];

    for (let i = 0; i < 500; i++) {
        const x = (Math.random() - 0.5) * 10;
        const y = (Math.random() - 0.5) * 10;
        const z = (Math.random() - 0.5) * 10;
        positions.push(x, y, z);
    }

    particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    const particlesMaterial = new THREE.PointsMaterial({
        size: 0.2,
        map: particleTexture,
        transparent: true,
        depthWrite: false
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);
}

// Función para cargar modelo GLB dinámicamente
function loadGLBModel(index) {
    if (currentModel) {
        scene.remove(currentModel);
    }

    const loader = new GLTFLoader();
    loader.load(glbModels[index], (gltf) => {
        currentModel = gltf.scene;
        currentModel.position.set(0, 0, 0);
        currentModel.scale.set(1, 1, 1);
        scene.add(currentModel);
    });
}

// Función para manejar redimensionamiento
function onWindowResize() {
    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    stereoEffect.setSize(window.innerWidth, window.innerHeight);
    anaglyphEffect.setSize(window.innerWidth, window.innerHeight);
}

// Función para manejar movimiento del mouse
function onDocumentMouseMove(event) {
    mouseX = (event.clientX - windowHalfX) / 100;
    mouseY = (event.clientY - windowHalfY) / 100;
}

// Función para cambiar efectos y modelos GLB
function onKeyDown(event) {
    if (event.key === 't' || event.key === 'T') {
        if (currentEffect === stereoEffect) {
            currentEffect = anaglyphEffect;
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            }
        } else {
            currentEffect = stereoEffect;
            if (document.fullscreenElement) {
                document.exitFullscreen();
            }
        }
        console.log('Efecto cambiado:', currentEffect === stereoEffect ? 'Estereoscópico' : 'Anaglifo');
    }

    if (event.key === 'm' || event.key === 'M') {
        currentModelIndex = (currentModelIndex + 1) % glbModels.length;
        loadGLBModel(currentModelIndex);
        console.log('Cambiando modelo a:', glbModels[currentModelIndex]);
    }
}

// Función para mostrar overlay de texto
function showTextOverlay(text, duration) {
    const overlay = document.createElement('div');
    overlay.innerText = text;
    overlay.style.position = 'fixed';
    overlay.style.top = '10px';
    overlay.style.left = '10px';
    overlay.style.color = 'white';
    overlay.style.fontSize = '20px';
    overlay.style.fontFamily = 'Arial, sans-serif';
    overlay.style.padding = '10px';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.borderRadius = '5px';
    overlay.style.zIndex = '1000';
    document.body.appendChild(overlay);

    setTimeout(() => {
        overlay.remove();
    }, duration);
}

// Bucle de animación
function animate() {
    requestAnimationFrame(animate);
    const timer = 0.0001 * Date.now();

    camera.position.x += (mouseX - camera.position.x) * 0.05;
    camera.position.y += (-mouseY - camera.position.y) * 0.05;
    camera.lookAt(scene.position);

    objects.forEach((obj, i) => {
        obj.rotation.x += 0.01;
        obj.rotation.y += 0.01;
        obj.position.x = 3 * Math.cos(timer + i);
        obj.position.y = 3 * Math.sin(timer + i * 1.1);
    });

    currentEffect.render(scene, camera);
}

