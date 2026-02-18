
import React, { useRef } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { TargetData } from '../types';

interface TargetProps {
  data: TargetData;
  textureUrl: string | null;
  onHit: (id: string) => void;
}

const Target: React.FC<TargetProps> = ({ data, textureUrl, onHit }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Default target color/look if no image is provided
  const texture = textureUrl ? useLoader(THREE.TextureLoader, textureUrl) : null;

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y = data.position[1] + Math.sin(state.clock.elapsedTime * 2 + data.id.length) * 0.1;
      // Always face the center (camera)
      meshRef.current.lookAt(0, 1.6, 0); 
    }
  });

  return (
    // Fixed JSX intrinsic element errors by removing the global JSX namespace override that shadowed standard HTML elements.
    <mesh
      ref={meshRef}
      position={data.position}
      onPointerDown={(e) => {
        // Stop the event from reaching the background miss-detectors
        e.stopPropagation();
        onHit(data.id);
      }}
    >
      <circleGeometry args={[data.size, 32]} />
      {texture ? (
        <meshBasicMaterial map={texture} side={THREE.DoubleSide} transparent />
      ) : (
        <meshStandardMaterial color="#ff3333" emissive="#ff0000" emissiveIntensity={0.5} side={THREE.DoubleSide} />
      )}
      
      {/* Target Border */}
      <mesh>
        <ringGeometry args={[data.size, data.size + 0.05, 32]} />
        <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
      </mesh>
    </mesh>
  );
};

export default Target;
