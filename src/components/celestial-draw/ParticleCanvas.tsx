
"use client";
import React, { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface ParticleCanvasProps {
  maxNumber: number;
  numToDraw: number;
  onNumbersDrawn: (numbers: number[]) => void;
  onSceneLoaded: () => void;
  isDrawingActive: boolean;
}

const PARTICLE_SIZE = 0.25; 
const BOUNDING_BOX_SIZE = 10;
const STAR_COUNT = 5000; // Reduced from 10000
const MAX_PIXEL_RATIO = 1.5; // Cap pixel ratio for performance

export function ParticleCanvas({
  maxNumber,
  numToDraw,
  onNumbersDrawn,
  onSceneLoaded,
  isDrawingActive,
}: ParticleCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const particlesRef = useRef<THREE.Mesh[]>([]);
  const animationFrameIdRef = useRef<number | null>(null);
  const isAnimatingDrawRef = useRef(false);

  const initScene = useCallback(() => {
    if (!mountRef.current) return;

    const currentMount = mountRef.current;

    // Scene
    sceneRef.current = new THREE.Scene();

    // Camera
    cameraRef.current = new THREE.PerspectiveCamera(
      75,
      currentMount.clientWidth / currentMount.clientHeight,
      0.1,
      1000
    );
    cameraRef.current.position.z = 15;

    // Renderer
    rendererRef.current = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current.setSize(currentMount.clientWidth, currentMount.clientHeight);
    // Cap device pixel ratio for performance on mobile devices
    rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
    currentMount.appendChild(rendererRef.current.domElement);

    // Controls
    controlsRef.current = new OrbitControls(cameraRef.current, rendererRef.current.domElement);
    controlsRef.current.enableDamping = true;
    controlsRef.current.dampingFactor = 0.05;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Ambient light is still useful for overall scene visibility if other non-basic materials are added.
    sceneRef.current.add(ambientLight);
    // PointLight removed as particles are MeshBasicMaterial and starfield doesn't use it.

    // Starfield
    const starGeometry = new THREE.BufferGeometry();
    const starVertices = [];
    for (let i = 0; i < STAR_COUNT; i++) { // Use reduced star count
      const x = THREE.MathUtils.randFloatSpread(200);
      const y = THREE.MathUtils.randFloatSpread(200);
      const z = THREE.MathUtils.randFloatSpread(200);
      starVertices.push(x, y, z);
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const starMaterial = new THREE.PointsMaterial({ color: 0xaaaaaa, size: 0.1 });
    const starField = new THREE.Points(starGeometry, starMaterial);
    sceneRef.current.add(starField);
    
    // Particles
    particlesRef.current = [];
    const particleGeometry = new THREE.SphereGeometry(PARTICLE_SIZE, 16, 16);
    for (let i = 1; i <= maxNumber; i++) {
      const particleMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(`hsl(${THREE.MathUtils.randInt(0,360)}, 70%, 70%)`),
      });
      const particle = new THREE.Mesh(particleGeometry, particleMaterial);
      particle.position.set(
        THREE.MathUtils.randFloatSpread(BOUNDING_BOX_SIZE * 0.8),
        THREE.MathUtils.randFloatSpread(BOUNDING_BOX_SIZE * 0.8),
        THREE.MathUtils.randFloatSpread(BOUNDING_BOX_SIZE * 0.8)
      );
      particle.userData = {
        number: i,
        velocity: new THREE.Vector3(
          THREE.MathUtils.randFloatSpread(0.02),
          THREE.MathUtils.randFloatSpread(0.02),
          THREE.MathUtils.randFloatSpread(0.02)
        ),
        isDrawn: false,
        isBeingDrawn: false,
      };
      sceneRef.current.add(particle);
      particlesRef.current.push(particle);
    }

    onSceneLoaded();
  }, [maxNumber, onSceneLoaded]);
  
  const animate = useCallback(() => {
    animationFrameIdRef.current = requestAnimationFrame(animate);

    particlesRef.current.forEach(particle => {
      if (!particle.userData.isBeingDrawn) {
        particle.position.add(particle.userData.velocity);

        // Simple bounding box collision
        ['x', 'y', 'z'].forEach(axis => {
          if (Math.abs(particle.position[axis as keyof THREE.Vector3]) > BOUNDING_BOX_SIZE / 2) {
            particle.userData.velocity[axis as keyof THREE.Vector3] *= -1;
            // Ensure particle stays within bounds after reversing velocity
            particle.position[axis as keyof THREE.Vector3] = 
              Math.max(-BOUNDING_BOX_SIZE / 2, Math.min(BOUNDING_BOX_SIZE / 2, particle.position[axis as keyof THREE.Vector3]));
          }
        });
      }
    });

    controlsRef.current?.update();
    rendererRef.current?.render(sceneRef.current!, cameraRef.current!);
  }, []);

  useEffect(() => {
    initScene();
    animate();

    const handleResize = () => {
      if (mountRef.current && rendererRef.current && cameraRef.current) {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        rendererRef.current.setSize(width, height);
        // Re-apply capped pixel ratio on resize
        rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        sceneRef.current?.traverse(object => {
            if (object instanceof THREE.Mesh) {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    const materials = Array.isArray(object.material) ? object.material : [object.material];
                    materials.forEach(material => material.dispose());
                }
            } else if (object instanceof THREE.Points) {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                     const materials = Array.isArray(object.material) ? object.material : [object.material];
                    materials.forEach(material => material.dispose());
                }
            } else if (object instanceof THREE.Light) {
                object.dispose?.(); // Some lights have dispose methods
            }
        });
        sceneRef.current?.clear(); // Clear the scene
        if(mountRef.current && rendererRef.current.domElement){
             mountRef.current.removeChild(rendererRef.current.domElement);
        }
      }
      particlesRef.current = [];
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
      controlsRef.current = null;
    };
  }, [initScene, animate]);


  useEffect(() => {
    if (isDrawingActive && particlesRef.current.length > 0 && !isAnimatingDrawRef.current) {
      isAnimatingDrawRef.current = true;
      
      particlesRef.current.forEach(p => {
        if (p.userData.isDrawn || p.userData.isBeingDrawn) {
            if (p.material instanceof THREE.MeshBasicMaterial) { 
                 p.material.color.setHSL(THREE.MathUtils.randFloat(0,1), 0.7, 0.7);
            }
        }
        p.userData.isDrawn = false;
        p.userData.isBeingDrawn = false;
      });


      const availableParticles = particlesRef.current.filter(p => !p.userData.isDrawn);
      const numbersToSelect = Math.min(numToDraw, availableParticles.length);
      const selectedForDraw: THREE.Mesh[] = [];
      const drawnValues: number[] = [];

      if (numbersToSelect === 0) {
        onNumbersDrawn([]);
        isAnimatingDrawRef.current = false;
        return;
      }
  
      for (let i = 0; i < numbersToSelect; i++) {
        const randomIndex = Math.floor(Math.random() * availableParticles.length);
        const particle = availableParticles[randomIndex];
        particle.userData.isBeingDrawn = true;
        selectedForDraw.push(particle);
        drawnValues.push(particle.userData.number);
        availableParticles.splice(randomIndex, 1); 
      }
      
      drawnValues.sort((a, b) => a - b);
  
      selectedForDraw.forEach((p, index) => {
        if (p.material instanceof THREE.MeshBasicMaterial) { 
          p.material.color.set(0x6F00ED); // Accent color
        }
      });
  
      // Shorter delay for faster feel
      const drawAnimationTime = 1000 + numbersToSelect * 200;
      setTimeout(() => {
        selectedForDraw.forEach(p => {
          p.userData.isDrawn = true;
          p.userData.isBeingDrawn = false;
        });
        onNumbersDrawn(drawnValues);
        isAnimatingDrawRef.current = false;
      }, drawAnimationTime); 
    }
  }, [isDrawingActive, numToDraw, onNumbersDrawn, maxNumber]);


  return <div ref={mountRef} className="w-full h-full rounded-lg overflow-hidden shadow-2xl" data-ai-hint="galaxy nebula" />;
}

