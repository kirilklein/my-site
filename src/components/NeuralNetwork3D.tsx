"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface NetworkConfig {
  layers: number[];
  layerSpacing: number;
  nodeSpacing: number;
}

const config: NetworkConfig = {
  layers: [4, 6, 8, 6, 4, 2],
  layerSpacing: 1.8,
  nodeSpacing: 0.7,
};

function Node({ position, delay }: { position: [number, number, number]; delay: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const initialScale = useRef(0);
  const appeared = useRef(false);

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.elapsedTime;

    // Delayed appearance
    if (time > delay && !appeared.current) {
      appeared.current = true;
    }

    if (appeared.current) {
      // Animate scale in
      initialScale.current = Math.min(initialScale.current + 0.05, 1);

      // Subtle pulse
      const pulse = 1 + Math.sin(time * 2 + delay * 10) * 0.1;
      meshRef.current.scale.setScalar(initialScale.current * pulse * 0.12);
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial color="#00ff00" transparent opacity={0.9} />
    </mesh>
  );
}

function Connections({ nodes }: { nodes: [number, number, number][][] }) {
  const linesRef = useRef<THREE.LineSegments>(null);

  const geometry = useMemo(() => {
    const positions: number[] = [];

    // Connect nodes between adjacent layers
    for (let layer = 0; layer < nodes.length - 1; layer++) {
      const currentLayer = nodes[layer];
      const nextLayer = nodes[layer + 1];

      for (const currentNode of currentLayer) {
        for (const nextNode of nextLayer) {
          positions.push(...currentNode, ...nextNode);
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, [nodes]);

  useFrame((state) => {
    if (!linesRef.current) return;
    const material = linesRef.current.material as THREE.LineBasicMaterial;

    // Fade in effect
    const time = state.clock.elapsedTime;
    material.opacity = Math.min(time * 0.3, 0.15);
  });

  return (
    <lineSegments ref={linesRef} geometry={geometry}>
      <lineBasicMaterial color="#00ff00" transparent opacity={0} />
    </lineSegments>
  );
}

function Signal({ nodes, speed = 0.8 }: { nodes: [number, number, number][][]; speed?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const pathIndex = useRef(0);
  const progress = useRef(0);
  const currentPath = useRef<{ from: [number, number, number]; to: [number, number, number] } | null>(null);

  // Generate random paths through the network
  const paths = useMemo(() => {
    const allPaths: { from: [number, number, number]; to: [number, number, number] }[] = [];

    for (let layer = 0; layer < nodes.length - 1; layer++) {
      const currentLayer = nodes[layer];
      const nextLayer = nodes[layer + 1];

      // Pick random connections
      const fromIdx = Math.floor(Math.random() * currentLayer.length);
      const toIdx = Math.floor(Math.random() * nextLayer.length);

      allPaths.push({
        from: currentLayer[fromIdx],
        to: nextLayer[toIdx],
      });
    }

    return allPaths;
  }, [nodes]);

  useFrame((state, delta) => {
    if (!meshRef.current || paths.length === 0) return;

    const time = state.clock.elapsedTime;

    // Wait before starting
    if (time < 1.5) {
      meshRef.current.visible = false;
      return;
    }

    meshRef.current.visible = true;

    // Get current path segment
    if (!currentPath.current) {
      currentPath.current = paths[pathIndex.current];
    }

    // Animate along path
    progress.current += delta * speed;

    if (progress.current >= 1) {
      progress.current = 0;
      pathIndex.current = (pathIndex.current + 1) % paths.length;

      // Reset to beginning when we complete the network
      if (pathIndex.current === 0) {
        // Generate new random path
        for (let i = 0; i < paths.length; i++) {
          const layer = i;
          const currentLayer = nodes[layer];
          const nextLayer = nodes[layer + 1];
          const fromIdx = Math.floor(Math.random() * currentLayer.length);
          const toIdx = Math.floor(Math.random() * nextLayer.length);
          paths[i] = { from: currentLayer[fromIdx], to: nextLayer[toIdx] };
        }
      }

      currentPath.current = paths[pathIndex.current];
    }

    // Interpolate position
    const from = currentPath.current.from;
    const to = currentPath.current.to;

    meshRef.current.position.x = from[0] + (to[0] - from[0]) * progress.current;
    meshRef.current.position.y = from[1] + (to[1] - from[1]) * progress.current;
    meshRef.current.position.z = from[2] + (to[2] - from[2]) * progress.current;

    // Pulse effect
    const pulse = 1 + Math.sin(time * 10) * 0.3;
    meshRef.current.scale.setScalar(0.15 * pulse);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshBasicMaterial color="#00ffff" transparent opacity={0.9} />
    </mesh>
  );
}

function NetworkScene() {
  const groupRef = useRef<THREE.Group>(null);

  // Generate node positions
  const nodes = useMemo(() => {
    const nodePositions: [number, number, number][][] = [];
    const totalWidth = (config.layers.length - 1) * config.layerSpacing;
    const startX = -totalWidth / 2;

    config.layers.forEach((nodeCount, layerIndex) => {
      const layerNodes: [number, number, number][] = [];
      const x = startX + layerIndex * config.layerSpacing;
      const totalHeight = (nodeCount - 1) * config.nodeSpacing;
      const startY = -totalHeight / 2;

      for (let i = 0; i < nodeCount; i++) {
        const y = startY + i * config.nodeSpacing;
        layerNodes.push([x, y, 0]);
      }

      nodePositions.push(layerNodes);
    });

    return nodePositions;
  }, []);

  // Rotate the network slowly
  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.3;
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
  });

  return (
    <group ref={groupRef}>
      <Connections nodes={nodes} />

      {nodes.map((layer, layerIndex) =>
        layer.map((position, nodeIndex) => (
          <Node
            key={`${layerIndex}-${nodeIndex}`}
            position={position}
            delay={layerIndex * 0.15 + nodeIndex * 0.05}
          />
        ))
      )}

      <Signal nodes={nodes} speed={1.2} />
      <Signal nodes={nodes} speed={0.9} />
      <Signal nodes={nodes} speed={1.5} />
    </group>
  );
}

export default function NeuralNetwork3D() {
  return (
    <div className="neural-network-container">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        style={{ background: "transparent" }}
        gl={{ alpha: true, antialias: true }}
      >
        <NetworkScene />
      </Canvas>
    </div>
  );
}
