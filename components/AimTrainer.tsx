
import React, { useState, useEffect, useCallback } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { PointerLockControls, Sky, Stars, Grid, Environment } from '@react-three/drei';
import * as THREE from 'three';
import Target from './Target';
import { TargetData, GameStatus, GameSettings } from '../types';

interface AimTrainerProps {
  status: GameStatus;
  targetImage: string | null;
  onHit: () => void;
  onMiss: () => void;
  settings: GameSettings;
  onUnlock: () => void;
  onLockChange?: (isLocked: boolean) => void;
}

const Scene: React.FC<AimTrainerProps> = ({ status, targetImage, onHit, onMiss, settings, onUnlock, onLockChange }) => {
  const [targets, setTargets] = useState<TargetData[]>([]);
  const { camera, gl } = useThree();
  
  useEffect(() => {
    const aspect = gl.domElement.clientWidth / gl.domElement.clientHeight;
    const hFovRad = (settings.fov * Math.PI) / 180;
    const vFovRad = 2 * Math.atan(Math.tan(hFovRad / 2) / aspect);
    const vFovDeg = (vFovRad * 180) / Math.PI;
    
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = vFovDeg;
      camera.updateProjectionMatrix();
    }
  }, [settings.fov, gl.domElement.clientWidth, gl.domElement.clientHeight, camera]);

  const spawnTarget = useCallback(() => {
    const x = (Math.random() - 0.5) * 14;
    const y = 1.0 + Math.random() * 4;
    const z = -8 - Math.random() * 8;

    const baseSize = settings.targetSize * 0.4;
    
    const newTarget: TargetData = {
      id: Math.random().toString(36).substr(2, 9),
      position: [x, y, z],
      size: baseSize
    };
    setTargets(prev => [...prev, newTarget]);
  }, [settings.targetSize]);

  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      if (targets.length === 0) {
        for(let i=0; i<4; i++) spawnTarget();
      }
    } else if (status === GameStatus.IDLE || status === GameStatus.COUNTDOWN) {
      setTargets([]);
    }
  }, [status, spawnTarget, targets.length]);

  const handleTargetHit = (id: string) => {
    if (status !== GameStatus.PLAYING || !document.pointerLockElement) return;
    setTargets(prev => prev.filter(t => t.id !== id));
    onHit();
    spawnTarget();
  };

  const handleMiss = () => {
    if (status === GameStatus.PLAYING && document.pointerLockElement) {
      onMiss();
    }
  };

  const isNight = settings.environmentPreset === 'night';
  const isSunset = settings.environmentPreset === 'sunset';

  const isControlsActive = status === GameStatus.PLAYING || status === GameStatus.COUNTDOWN;

  return (
    <>
      {isControlsActive && (
        <PointerLockControls 
          pointerSpeed={settings.sensitivity} 
          makeDefault
          onUnlock={() => {
            onUnlock();
            onLockChange?.(false);
          }}
          onLock={() => {
            onLockChange?.(true);
            try {
              (gl.domElement as any).requestPointerLock({ unadjustedMovement: true });
            } catch (e) {
              gl.domElement.requestPointerLock();
            }
          }}
        />
      )}
      
      <Sky 
        sunPosition={isSunset ? [100, 2, 100] : isNight ? [0, -10, 0] : [100, 20, 100]} 
        turbidity={isSunset ? 10 : 0.1}
        rayleigh={isSunset ? 3 : 0.1}
      />
      
      {isNight && <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />}
      
      <ambientLight intensity={isNight ? 0.2 : 0.5} />
      <pointLight position={[10, 10, 10]} intensity={isNight ? 0.8 : 1.5} />
      
      <Environment preset={settings.environmentPreset as any} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} onPointerDown={handleMiss}>
        <planeGeometry args={[2000, 2000]} />
        <meshStandardMaterial color="#050505" />
      </mesh>
      
      <mesh onPointerDown={handleMiss}>
        <sphereGeometry args={[100, 32, 32]} />
        <meshBasicMaterial side={THREE.BackSide} transparent opacity={0} />
      </mesh>

      <Grid infiniteGrid fadeDistance={60} sectionColor="#333" cellColor="#111" />

      {targets.map(target => (
        <Target 
          key={target.id} 
          data={target} 
          textureUrl={targetImage} 
          onHit={handleTargetHit} 
        />
      ))}
    </>
  );
};

export const CrosshairDisplay: React.FC<{ settings: GameSettings['crosshair'] }> = ({ settings }) => {
  const { length, width, gap, color, dot } = settings;
  return (
    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
      <div className="absolute bottom-[calc(50%)]" style={{ height: `${length}px`, width: `${width}px`, backgroundColor: color, marginBottom: `${gap}px`, transform: 'translateX(-50%)' }} />
      <div className="absolute top-[calc(50%)]" style={{ height: `${length}px`, width: `${width}px`, backgroundColor: color, marginTop: `${gap}px`, transform: 'translateX(-50%)' }} />
      <div className="absolute right-[calc(50%)]" style={{ height: `${width}px`, width: `${length}px`, backgroundColor: color, marginRight: `${gap}px`, transform: 'translateY(-50%)' }} />
      <div className="absolute left-[calc(50%)]" style={{ height: `${width}px`, width: `${length}px`, backgroundColor: color, marginLeft: `${gap}px`, transform: 'translateY(-50%)' }} />
      {dot && <div className="absolute" style={{ height: `${width}px`, width: `${width}px`, backgroundColor: color, transform: 'translate(-50%, -50%)' }} />}
    </div>
  );
};

const AimTrainer: React.FC<AimTrainerProps> = (props) => {
  return (
    <div className="w-full h-full bg-black">
      <Canvas shadows camera={{ position: [0, 1.6, 0] }} onCreated={({ gl }) => { gl.setClearColor('#000000'); }}>
        <Scene {...props} />
      </Canvas>
      <CrosshairDisplay settings={props.settings.crosshair} />
    </div>
  );
};

export default AimTrainer;
