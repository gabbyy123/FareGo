import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

function Car() {
  const group = useRef<THREE.Group>(null);
  const wheels = useRef<THREE.Group[]>([]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime() % 8; // 8-second loop
    
    if (!group.current) return;

    // The car drives from z = -30 to z = 0, stops at z=0 from t=3 to t=5
    // After t=5, it zips off to z = 30
    let z = 0;
    if (t < 3) {
      z = THREE.MathUtils.lerp(-30, 0, t / 3);
      // Easing out
      z = -30 * Math.pow(1 - t/3, 3); 
    } else if (t >= 3 && t < 5) {
      z = 0;
    } else {
      const p = (t - 5) / 3;
      z = 30 * Math.pow(p, 3);
    }
    
    group.current.position.z = z;

    // Spin wheels when moving
    if (t < 3 || t >= 5) {
      wheels.current.forEach((w) => {
        if (w) w.rotation.x += 0.2;
      });
    }
  });

  return (
    <group ref={group} position={[0, 0, 0]}>
      {/* Car Body */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <boxGeometry args={[2.2, 0.8, 5]} />
        <meshStandardMaterial color="#2563eb" roughness={0.2} metalness={0.1} />
      </mesh>
      
      {/* Cabin */}
      <mesh position={[0, 1.4, -0.5]} castShadow>
        <boxGeometry args={[1.8, 0.8, 2.5]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.1} metalness={0.8} />
      </mesh>

      {/* Wheels */}
      {[-1, 1].map((x, i) => (
        [-1.5, 1.5].map((z, j) => (
          <group 
            key={`${i}-${j}`} 
            position={[x * 1.1, 0.4, z]}
            ref={(el) => { if (el) wheels.current.push(el); }}
          >
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.4, 0.4, 0.3, 32]} />
              <meshStandardMaterial color="#1f2937" roughness={0.8} />
            </mesh>
            {/* Hubcap */}
            <mesh rotation={[0, 0, Math.PI / 2]} position={[x > 0 ? 0.16 : -0.16, 0, 0]}>
              <cylinderGeometry args={[0.2, 0.2, 0.05, 16]} />
              <meshStandardMaterial color="#d1d5db" />
            </mesh>
          </group>
        ))
      ))}
    </group>
  );
}

function Passenger() {
  const group = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    const t = state.clock.getElapsedTime() % 8;
    if (!group.current) return;

    // Passenger walks from x=6 to x=3.5 during t=1 to t=3
    let x = 6;
    if (t < 1) {
      x = 6;
    } else if (t >= 1 && t < 3) {
      const p = (t - 1) / 2;
      // easeOut
      x = 6 - 2.5 * Math.sin(p * Math.PI / 2);
    } else if (t >= 3 && t < 5) {
      x = 3.5;
    } else {
      x = 6; // snap back for loop
    }
    
    group.current.position.x = x;

    // Bobbing animation while walking
    if (t >= 1 && t < 3) {
      group.current.position.y = Math.sin(t * 15) * 0.1;
    } else {
      group.current.position.y = 0;
    }
  });

  return (
    <group ref={group} position={[6, 0, 0]}>
      {/* Legs */}
      <mesh position={[-0.2, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 1]} />
        <meshStandardMaterial color="#374151" />
      </mesh>
      <mesh position={[0.2, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 1]} />
        <meshStandardMaterial color="#374151" />
      </mesh>
      
      {/* Torso */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <capsuleGeometry args={[0.3, 0.6]} />
        <meshStandardMaterial color="#f59e0b" />
      </mesh>

      {/* Head */}
      <mesh position={[0, 2.3, 0]} castShadow>
        <sphereGeometry args={[0.3]} />
        <meshStandardMaterial color="#fcd34d" />
      </mesh>
    </group>
  );
}

function EnvironmentScene() {
  return (
    <group>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.01, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#e5e7eb" roughness={1} />
      </mesh>
      
      {/* Road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[6, 100]} />
        <meshStandardMaterial color="#4b5563" roughness={0.9} />
      </mesh>

      {/* Dashed lines */}
      {Array.from({ length: 15 }).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -30 + i * 4]}>
          <planeGeometry args={[0.2, 2]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}

      {/* Abstract Buildings */}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`b1-${i}`} position={[-8, 3 + Math.random()*2, -20 + i * 8]} castShadow receiveShadow>
          <boxGeometry args={[4, 6 + Math.random()*4, 4]} />
          <meshStandardMaterial color="#d1d5db" roughness={0.7} />
        </mesh>
      ))}
      {Array.from({ length: 6 }).map((_, i) => (
        <mesh key={`b2-${i}`} position={[10, 4 + Math.random()*3, -20 + i * 8]} castShadow receiveShadow>
          <boxGeometry args={[4, 8 + Math.random()*6, 4]} />
          <meshStandardMaterial color="#9ca3af" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

export default function AdvancedHeroScene() {
  return (
    <div className="w-full h-[500px] border border-slate-200/50 rounded-3xl overflow-hidden shadow-2xl relative bg-linear-to-b from-blue-50 to-slate-200">
      <Canvas shadows camera={{ position: [12, 8, 12], fov: 35 }}>
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[10, 15, -10]} 
          intensity={1.2} 
          castShadow 
          shadow-mapSize={1024}
        />
        
        <Environment preset="city" />

        <EnvironmentScene />
        <Car />
        <Passenger />
        
        {/* Soft contact shadow on the road */}
        <ContactShadows position={[0, 0.02, 0]} opacity={0.4} scale={20} blur={2} far={10} />
      </Canvas>
    </div>
  );
}
