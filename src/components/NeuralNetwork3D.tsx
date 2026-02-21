"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

type Edge = {
  from: number;
  to: number;
  curve: THREE.QuadraticBezierCurve3;
};

type Pulse = {
  edgeIndex: number;
  t: number;
};

const cfg = {
  layers: [5, 8, 8, 6, 3],
  layerSpacing: 1.35,
  verticalSpan: 2.5,
  depthOffset: 0.12,
  nodeRadius: 0.07,
  edgeFanout: 2,
  curveDepth: 0.14,
  maxPulses: 28,
  pulsesPerSecond: 1.1,
  edgeTravelSeconds: 0.95,
  activationDecay: 1.9,
};

function clamp01(x: number) {
  return THREE.MathUtils.clamp(x, 0, 1);
}

function smoothstep01(x: number) {
  const t = clamp01(x);
  return t * t * (3 - 2 * t);
}

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function makeRadialTexture(size = 128) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return new THREE.Texture();
  }

  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0.0, "rgba(255,255,255,1)");
  g.addColorStop(0.24, "rgba(178,255,240,0.95)");
  g.addColorStop(0.55, "rgba(0,255,190,0.33)");
  g.addColorStop(1.0, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

function buildNetworkGraph() {
  const nodePositions: THREE.Vector3[] = [];
  const appearAt: number[] = [];
  const layers: number[][] = [];
  const outEdges: number[][] = [];

  const totalWidth = (cfg.layers.length - 1) * cfg.layerSpacing;
  const startX = -totalWidth / 2;

  let nodeIndex = 0;
  for (let li = 0; li < cfg.layers.length; li++) {
    const count = cfg.layers[li];
    const x = startX + li * cfg.layerSpacing;
    const layerNodeIndices: number[] = [];

    for (let i = 0; i < count; i++) {
      const normalized = count === 1 ? 0.5 : i / (count - 1);
      const y = (normalized - 0.5) * cfg.verticalSpan;
      const z = (li % 2 === 0 ? 1 : -1) * cfg.depthOffset;

      nodePositions.push(new THREE.Vector3(x, y, z));
      appearAt.push(li * 0.14 + i * 0.03);
      layerNodeIndices.push(nodeIndex);
      outEdges.push([]);
      nodeIndex += 1;
    }

    layers.push(layerNodeIndices);
  }

  const edges: Edge[] = [];
  for (let li = 0; li < layers.length - 1; li++) {
    const from = layers[li];
    const to = layers[li + 1];

    for (let i = 0; i < from.length; i++) {
      const fromNode = from[i];
      const normalized = from.length === 1 ? 0.5 : i / (from.length - 1);
      const center = Math.round(normalized * (to.length - 1));
      const candidates = [center];

      if (cfg.edgeFanout > 1) {
        candidates.push(Math.max(0, center - 1));
      }

      for (const next of candidates) {
        const target = to[next];
        const a = nodePositions[fromNode];
        const b = nodePositions[target];
        const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
        const control = mid.clone().add(
          new THREE.Vector3(0, 0, li % 2 === 0 ? cfg.curveDepth : -cfg.curveDepth)
        );

        const edgeIndex = edges.length;
        edges.push({
          from: fromNode,
          to: target,
          curve: new THREE.QuadraticBezierCurve3(a.clone(), control, b.clone()),
        });
        outEdges[fromNode].push(edgeIndex);
      }
    }
  }

  const linePositions: number[] = [];
  for (const edge of edges) {
    const segments = 8;
    let prev = edge.curve.getPoint(0);
    for (let s = 1; s <= segments; s++) {
      const p = edge.curve.getPoint(s / segments);
      linePositions.push(prev.x, prev.y, prev.z, p.x, p.y, p.z);
      prev = p;
    }
  }

  return {
    nodePositions,
    appearAt,
    edges,
    outEdges,
    linePositions: new Float32Array(linePositions),
  };
}

function NetworkScene() {
  const groupRef = useRef<THREE.Group>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const pulsesRef = useRef<THREE.Points>(null);
  const nodeRefs = useRef<Array<THREE.Mesh | null>>([]);
  const spawnAccumulatorRef = useRef(0);
  const spawnCursorRef = useRef(0);
  const pulsesRefData = useRef<Pulse[]>([]);

  const graph = useMemo(() => buildNetworkGraph(), []);
  const sourceNodes = useMemo(
    () =>
      graph.nodePositions
        .map((_, i) => i)
        .filter((idx) => idx < cfg.layers[0] && graph.outEdges[idx] && graph.outEdges[idx].length > 0),
    [graph.nodePositions, graph.outEdges]
  );
  const activationRef = useRef<Float32Array>(new Float32Array(graph.nodePositions.length));
  const pulseBufferRef = useRef<Float32Array>(new Float32Array(cfg.maxPulses * 3).fill(9999));
  const pulseTexture = useMemo(() => makeRadialTexture(128), []);

  const lineGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(graph.linePositions, 3));
    return geo;
  }, [graph.linePositions]);

  const pulseGeometry = useMemo(() => new THREE.BufferGeometry(), []);

  useEffect(() => {
    pulseGeometry.setAttribute("position", new THREE.BufferAttribute(pulseBufferRef.current, 3));
  }, [pulseGeometry]);

  const baseColor = useMemo(() => new THREE.Color("#00ff88"), []);
  const hotColor = useMemo(() => new THREE.Color("#9dfbff"), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  const spawnPulse = () => {
    if (sourceNodes.length === 0) {
      return;
    }

    const startNode = sourceNodes[spawnCursorRef.current % sourceNodes.length];
    spawnCursorRef.current += 1;
    const options = graph.outEdges[startNode];
    if (!options || options.length === 0) {
      return;
    }

    const edgeIndex = options[spawnCursorRef.current % options.length];
    pulsesRefData.current.push({ edgeIndex, t: 0 });
    activationRef.current[startNode] = Math.min(1, activationRef.current[startNode] + 0.45);
  };

  useFrame((state, delta) => {
    const elapsed = state.clock.elapsedTime;

    if (groupRef.current) {
      groupRef.current.rotation.x = -0.06;
      groupRef.current.rotation.y = Math.sin(elapsed * 0.24) * 0.06;
      groupRef.current.position.y = Math.sin(elapsed * 0.35) * 0.04;
    }

    if (linesRef.current) {
      const lineMaterial = linesRef.current.material as THREE.LineBasicMaterial;
      lineMaterial.opacity = THREE.MathUtils.clamp(smoothstep01((elapsed - 0.3) / 1.5) * 0.28, 0, 0.28);
    }

    const decay = Math.exp(-cfg.activationDecay * delta);
    const activations = activationRef.current;
    for (let i = 0; i < activations.length; i++) {
      activations[i] *= decay;
    }

    spawnAccumulatorRef.current += delta * cfg.pulsesPerSecond;
    while (spawnAccumulatorRef.current >= 1 && pulsesRefData.current.length < cfg.maxPulses) {
      spawnAccumulatorRef.current -= 1;
      spawnPulse();
    }

    const pulseBuffer = pulseBufferRef.current;
    for (let i = pulsesRefData.current.length - 1; i >= 0; i--) {
      const pulse = pulsesRefData.current[i];
      pulse.t += delta / cfg.edgeTravelSeconds;

      const edge = graph.edges[pulse.edgeIndex];
      const p = edge.curve.getPoint(easeInOut(clamp01(pulse.t)));
      const offset = i * 3;
      pulseBuffer[offset] = p.x;
      pulseBuffer[offset + 1] = p.y;
      pulseBuffer[offset + 2] = p.z;

      if (pulse.t >= 1) {
        activations[edge.to] = Math.min(1, activations[edge.to] + 0.9);
        const nextEdges = graph.outEdges[edge.to];
        if (nextEdges && nextEdges.length > 0) {
          const next = nextEdges[(spawnCursorRef.current + i) % nextEdges.length];
          pulsesRefData.current[i] = { edgeIndex: next, t: 0 };
        } else {
          pulsesRefData.current.splice(i, 1);
        }
      }
    }

    for (let i = pulsesRefData.current.length; i < cfg.maxPulses; i++) {
      const offset = i * 3;
      pulseBuffer[offset] = 9999;
      pulseBuffer[offset + 1] = 9999;
      pulseBuffer[offset + 2] = 9999;
    }

    if (pulsesRef.current) {
      const attr = pulsesRef.current.geometry.getAttribute("position") as THREE.BufferAttribute;
      attr.needsUpdate = true;
    }

    for (let i = 0; i < graph.nodePositions.length; i++) {
      const mesh = nodeRefs.current[i];
      if (!mesh) {
        continue;
      }

      const appear = smoothstep01((elapsed - graph.appearAt[i]) / 0.85);
      const activation = activations[i];
      const scale = cfg.nodeRadius * appear * (1 + activation * 0.45);
      mesh.scale.setScalar(scale);

      const material = mesh.material as THREE.MeshStandardMaterial;
      tmpColor.copy(baseColor).lerp(hotColor, activation);
      material.color.copy(tmpColor);
      material.emissive.copy(tmpColor);
      material.emissiveIntensity = 0.35 + activation * 0.9;
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.55} />
      <pointLight position={[2, 2, 5]} intensity={0.9} />
      <pointLight position={[-3, -1, -4]} intensity={0.45} />

      <lineSegments ref={linesRef} geometry={lineGeometry}>
        <lineBasicMaterial
          color="#75ffd4"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {graph.nodePositions.map((position, index) => (
        <mesh
          key={index}
          ref={(mesh) => {
            nodeRefs.current[index] = mesh;
          }}
          position={position}
          scale={0.001}
        >
          <sphereGeometry args={[1, 18, 18]} />
          <meshStandardMaterial
            color="#00ff88"
            emissive="#00ff88"
            emissiveIntensity={0.35}
            roughness={0.38}
            metalness={0}
          />
        </mesh>
      ))}

      <points ref={pulsesRef} geometry={pulseGeometry}>
        <pointsMaterial
          map={pulseTexture}
          transparent
          opacity={0.95}
          size={0.18}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          color="#d2ffff"
        />
      </points>
    </group>
  );
}

export default function NeuralNetwork3D() {
  return (
    <div className="neural-network-container">
      <Canvas
        camera={{ position: [0, 0, 7.2], fov: 46 }}
        style={{ background: "transparent" }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
      >
        <NetworkScene />
      </Canvas>
    </div>
  );
}
