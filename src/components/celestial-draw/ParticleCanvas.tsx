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

const PARTICLE_SIZE = 0.1;
const BOUNDING_BOX_SIZE = 10;

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
    rendererRef.current.setPixelRatio(window.devicePixelRatio);
    currentMount.appendChild(rendererRef.current.domElement);

    // Controls
    controlsRef.current = new OrbitControls(cameraRef.current, rendererRef.current.domElement);
    controlsRef.current.enableDamping = true;
    controlsRef.current.dampingFactor = 0.05;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    sceneRef.current.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1, 100);
    pointLight.position.set(5, 5, 5);
    sceneRef.current.add(pointLight);

    // Starfield
    const starGeometry = new THREE.BufferGeometry();
    const starVertices = [];
    for (let i = 0; i < 10000; i++) {
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
      const particleMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(`hsl(${THREE.MathUtils.randInt(0,360)}, 70%, 70%)`),
        roughness: 0.5,
        metalness: 0.1,
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
          if (Math.abs(particle.position[axis]) > BOUNDING_BOX_SIZE / 2) {
            particle.userData.velocity[axis] *= -1;
            particle.position[axis] = Math.sign(particle.position[axis]) * (BOUNDING_BOX_SIZE / 2);
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
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
      if (rendererRef.current) {
         // Dispose of Three.js objects
        rendererRef.current.dispose();
        sceneRef.current?.traverse(object => {
            if (object instanceof THREE.Mesh) {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            }
        });
        if(mountRef.current && rendererRef.current.domElement){
             mountRef.current.removeChild(rendererRef.current.domElement);
        }
      }
      particlesRef.current = [];
    };
  }, [initScene, animate]);


  useEffect(() => {
    if (isDrawingActive && particlesRef.current.length > 0 && !isAnimatingDrawRef.current) {
      isAnimatingDrawRef.current = true;
      
      // Reset previous drawn states visually if needed (particles might still be colored)
      particlesRef.current.forEach(p => {
        if (p.userData.isDrawn || p.userData.isBeingDrawn) {
            if (p.material instanceof THREE.MeshStandardMaterial) {
                // Reset color to an original-like state, or store original color
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
        onNumbersDrawn([]); // No numbers to draw
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
        if (p.material instanceof THREE.MeshStandardMaterial) {
          p.material.color.set(0x6F00ED); // Accent color: Electric Indigo
        }
        // Simple animation: move to front. More complex line-up needs target positions.
        // For now, just highlighting.
        const targetZ = (cameraRef.current?.position.z ?? 15) - 5;
        const targetX = (index - (numbersToSelect -1) / 2) * (PARTICLE_SIZE * 5) ; // Spread them out
        
        // Basic "animation" - instantly move for this simplified example
        // In a real scenario, you'd use a tweening library or manual interpolation in animate()
        // p.position.set(targetX, 0, targetZ);
      });
  
      setTimeout(() => {
        selectedForDraw.forEach(p => {
          p.userData.isDrawn = true;
          p.userData.isBeingDrawn = false;
        });
        onNumbersDrawn(drawnValues);
        isAnimatingDrawRef.current = false;
      }, 1500 + numbersToSelect * 300); 
    }
  }, [isDrawingActive, numToDraw, onNumbersDrawn, maxNumber]);


  return <div ref={mountRef} className="w-full h-full rounded-lg overflow-hidden shadow-2xl" data-ai-hint="galaxy nebula" />;
}

