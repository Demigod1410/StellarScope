'use client';

import React, { Suspense, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';

// Custom hook for shared drag logic
function useDragLogic() {
  const { camera, gl } = useThree();
  const [isDragging, setIsDragging] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [earthRotation, setEarthRotation] = useState({ x: 0, y: 0 });
  
  const raycaster = useRef(new THREE.Raycaster());
  const intersectionPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0));
  const mouse = useRef(new THREE.Vector2());

  const handlePointerDown = (event: any) => {
    setIsDragging(true);
    const canvas = gl.domElement;
    const rect = canvas.getBoundingClientRect();
    setMousePosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    });
    event.stopPropagation();
  };

  const handlePointerMove = (event: any) => {
    if (!isDragging) return;
    const canvas = gl.domElement;
    const rect = canvas.getBoundingClientRect();
    const prevMousePosition = mousePosition;
    const newMousePosition = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    
    setMousePosition(newMousePosition);
    
    const deltaX = newMousePosition.x - prevMousePosition.x;
    const deltaY = newMousePosition.y - prevMousePosition.y;
    const rotationSpeed = 0.0005;
    setEarthRotation(prev => ({
      x: prev.x - deltaY * rotationSpeed,
      y: prev.y - deltaX * rotationSpeed
    }));
    
    event.stopPropagation();
  };

  const handlePointerUp = (ref: React.RefObject<any>) => {
    setIsDragging(false);
    if (ref.current) {
      ref.current.position.set(0, 0, 0);
    }
  };

  const updatePosition = (ref: React.RefObject<any>) => {
    if (ref.current && isDragging) {
      const canvas = gl.domElement;
      const rect = canvas.getBoundingClientRect();
      mouse.current.x = (mousePosition.x / rect.width) * 2 - 1;
      mouse.current.y = -(mousePosition.y / rect.height) * 2 + 1;
      
      raycaster.current.setFromCamera(mouse.current, camera);
      const intersectPoint = new THREE.Vector3();
      raycaster.current.ray.intersectPlane(intersectionPlane.current, intersectPoint);
      
      if (intersectPoint) {
        ref.current.position.copy(intersectPoint);
      }
    }
  };

  React.useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (event: MouseEvent) => {
        const canvas = gl.domElement;
        const rect = canvas.getBoundingClientRect();
        const prevMousePosition = mousePosition;
        const newMousePosition = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top
        };
        
        setMousePosition(newMousePosition);
        
        const deltaX = newMousePosition.x - prevMousePosition.x;
        const deltaY = newMousePosition.y - prevMousePosition.y;
        const rotationSpeed = 0.0005;
        setEarthRotation(prev => ({
          x: prev.x - deltaY * rotationSpeed,
          y: prev.y - deltaX * rotationSpeed
        }));
      };

      const handleGlobalMouseUp = () => setIsDragging(false);

      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, mousePosition]);

  return {
    isDragging,
    earthRotation,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    updatePosition
  };
}

// Earth Model Component
function EarthModel() {
  const earthRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/models/Earth.gltf');
  const { isDragging, earthRotation, handlePointerDown, handlePointerMove, handlePointerUp, updatePosition } = useDragLogic();
  
  const earthScene = scene.clone();
  
  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.x = earthRotation.x;
      earthRef.current.rotation.y = earthRotation.y;
      updatePosition(earthRef);
    }
  });
  
  return (
    <group 
      ref={earthRef} 
      scale={[1, 1, 1]} 
      position={[0, 0, 0]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={() => handlePointerUp(earthRef)}
    >
      <primitive object={earthScene} />
    </group>
  );
}

// Fallback Earth Component
function FallbackEarth() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { isDragging, earthRotation, handlePointerDown, handlePointerMove, handlePointerUp, updatePosition } = useDragLogic();
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x = earthRotation.x;
      meshRef.current.rotation.y = earthRotation.y;
      updatePosition(meshRef);
    }
  });

  return (
    <mesh 
      ref={meshRef} 
      scale={[1, 1, 1]} 
      position={[0, 0, 0]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={() => handlePointerUp(meshRef)}
    >
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial
        color="#2E75B6"
        metalness={0.1}
        roughness={0.7}
        emissive="#103a62"
        emissiveIntensity={0.1}
      />
    </mesh>
  );
}

// Camera Controls Component
function CameraControls() {
  const { camera } = useThree();
  const [zoom, setZoom] = useState(8);

  React.useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY * 0.001;
      setZoom(prev => Math.max(4, Math.min(15, prev + delta)));
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  useFrame(() => {
    camera.position.z = zoom;
  });

  return null;
}

// Hero Section Component
export default function HeroSection() {
  return (
    <section className="relative w-full h-screen overflow-hidden">
      {/* 3D Canvas Background */}
      <div className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing">
        <Canvas
          camera={{ 
            position: [0, 0, 8], 
            fov: 45,
            near: 0.1,
            far: 1000 
          }}
          gl={{ 
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
          }}
        >
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight 
            position={[10, 10, 5]} 
            intensity={1.5}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#0ab1ffff" />
          
          {/* Earth Model with Suspense fallback */}
          <Suspense fallback={<FallbackEarth />}>
            <EarthModel />
          </Suspense>
          
          {/* Environment for reflections */}
          <Environment preset="sunset" />
          
          {/* Custom Camera Controls for Zoom */}
          <CameraControls />
        </Canvas>
      </div>

      {/* Content Overlay */}
      <div className="relative z-20 flex items-center justify-between h-full px-8 lg:px-16 pointer-events-none">
        {/* Left Content */}
        <div className="max-w-xl text-white pointer-events-auto">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 mb-6 text-sm font-medium text-blue-300 bg-blue-900/30 backdrop-blur-sm border border-blue-500/30 rounded-full">
            <div className="w-2 h-2 mr-2 bg-blue-400 rounded-full animate-pulse"></div>
            Interactive 3D Experience
          </div>
          
          {/* Main Heading */}
          <h1 className="mb-6 text-5xl lg:text-7xl font-bold leading-tight">
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              StellarScope
            </span>
          </h1>
          
          {/* Subtitle */}
          <h2 className="mb-8 text-xl lg:text-2xl font-light text-gray-300 leading-relaxed">
            An immersive, interactive 3D web experience powered by Three.js, designed to 
            <span className="text-blue-400 font-medium"> educate</span>, 
            <span className="text-purple-400 font-medium"> engage</span>, and 
            <span className="text-pink-400 font-medium"> awe</span> users by showcasing the planets of our solar system.
          </h2>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-full hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25">
              Explore Solar System
            </button>
            <button className="px-8 py-4 text-lg font-semibold text-blue-300 border-2 border-blue-500/50 rounded-full hover:bg-blue-500/10 hover:border-blue-400 transition-all duration-300 backdrop-blur-sm">
              Learn More
            </button>
          </div>
        </div>

        {/* Right Content - Interactive Instructions */}
        <div className="hidden lg:block max-w-xs text-white pointer-events-auto">
          <div className="p-6 bg-black/20 backdrop-blur-md border border-white/10 rounded-2xl">
            <h3 className="mb-4 text-lg font-semibold text-blue-300">
              Interactive Controls
            </h3>
            <div className="space-y-3 text-sm text-gray-300">
              <div className="flex items-center">
                <div className="w-3 h-3 mr-3 bg-blue-400 rounded-full"></div>
                <span>Drag Earth around the screen</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 mr-3 bg-purple-400 rounded-full"></div>
                <span>Scroll to zoom in/out</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 mr-3 bg-pink-400 rounded-full"></div>
                <span>Earth follows your cursor</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 pointer-events-auto">
        <div className="flex flex-col items-center text-white/60 animate-bounce">
          <span className="mb-2 text-sm font-medium">Scroll to explore</span>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>

      {/* Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/40 pointer-events-none z-15"></div>
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-15"></div>
    </section>
  );
}

// Preload the Earth model
useGLTF.preload('/models/Earth.gltf');
