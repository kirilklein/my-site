"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

type Edge = {
  from: number;
  to: number;
  curve: THREE.QuadraticBezierCurve3;
  weight: number;
};

type EdgeVertexRange = {
  start: number;
  count: number;
};

type TravelingSignal = {
  edgeIndex: number;
  progress: number;
  strength: number;
};

type WaveState = {
  layer: number;
  activeNodes: number[];
  activeStrengths: number[];
  signals: TravelingSignal[];
};

const cfg = {
  layers: [7, 5, 4, 5, 7],
  layerSpacing: 1.35,
  nodeGap: 0.34,
  depthOffset: 0.04,
  nodeRadius: 0.07,
  edgeFanout: 4,
  maxBranchPerNode: 3,
  curveDepth: 0.12,
  maxSignals: 220,
  edgeTravelSeconds: 1.25,
  activationDecay: 1.45,
  edgeActivationDecay: 2.35,
  waveCooldown: 1.0,
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

function hash01(a: number, b: number) {
  const x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function makeRadialTexture(size = 128) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.Texture();

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
  const nodeLayer: number[] = [];
  const outEdges: number[][] = [];

  const totalWidth = (cfg.layers.length - 1) * cfg.layerSpacing;
  const startX = -totalWidth / 2;

  let nodeIndex = 0;
  for (let li = 0; li < cfg.layers.length; li++) {
    const count = cfg.layers[li];
    const x = startX + li * cfg.layerSpacing;
    const layerNodeIndices: number[] = [];

    for (let i = 0; i < count; i++) {
      const y = (i - (count - 1) / 2) * cfg.nodeGap;
      const z = (li - (cfg.layers.length - 1) / 2) * cfg.depthOffset;

      nodePositions.push(new THREE.Vector3(x, y, z));
      appearAt.push(li * 0.12 + i * 0.03);
      nodeLayer.push(li);
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
      const radius = Math.floor((cfg.edgeFanout - 1) / 2);
      const candidates = new Set<number>();

      for (let off = -radius; off <= radius; off++) {
        candidates.add(THREE.MathUtils.clamp(center + off, 0, to.length - 1));
      }
      if (cfg.edgeFanout % 2 === 0) {
        candidates.add(THREE.MathUtils.clamp(center + radius + 1, 0, to.length - 1));
      }

      for (const next of candidates) {
        const target = to[next];
        const a = nodePositions[fromNode];
        const b = nodePositions[target];
        const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
        const control = mid.clone().add(
          new THREE.Vector3(0, 0, li % 2 === 0 ? cfg.curveDepth : -cfg.curveDepth)
        );

        const centerDistance = Math.abs(next - center) / Math.max(1, to.length - 1);
        const proximity = 1 - centerDistance;
        const noise = hash01(fromNode + 1, target + 1) * 0.15;
        const weight = THREE.MathUtils.clamp(0.45 + proximity * 0.45 + noise, 0.2, 1);

        const edgeIndex = edges.length;
        edges.push({
          from: fromNode,
          to: target,
          curve: new THREE.QuadraticBezierCurve3(a.clone(), control, b.clone()),
          weight,
        });
        outEdges[fromNode].push(edgeIndex);
      }
    }
  }

  const linePositions: number[] = [];
  const edgeVertexRanges: EdgeVertexRange[] = [];
  let vertexCursor = 0;
  for (const edge of edges) {
    const segments = 8;
    const start = vertexCursor;
    let prev = edge.curve.getPoint(0);
    for (let s = 1; s <= segments; s++) {
      const p = edge.curve.getPoint(s / segments);
      linePositions.push(prev.x, prev.y, prev.z, p.x, p.y, p.z);
      prev = p;
      vertexCursor += 2;
    }
    edgeVertexRanges.push({ start, count: segments * 2 });
  }

  return {
    nodePositions,
    appearAt,
    layers,
    nodeLayer,
    edges,
    edgeVertexRanges,
    outEdges,
    linePositions: new Float32Array(linePositions),
  };
}

function pickRandomUnique(arr: number[], n: number) {
  const pool = [...arr];
  const picked: number[] = [];
  while (picked.length < n && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return picked;
}

function NetworkScene() {
  const groupRef = useRef<THREE.Group>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const pulsesRef = useRef<THREE.Points>(null);
  const nodeRefs = useRef<Array<THREE.Mesh | null>>([]);

  const graph = useMemo(() => buildNetworkGraph(), []);
  const sourceNodes = useMemo(
    () => graph.layers[0].filter((nodeIdx) => graph.outEdges[nodeIdx].length > 0),
    [graph.layers, graph.outEdges]
  );

  const activationRef = useRef<Float32Array>(new Float32Array(graph.nodePositions.length));
  const edgeActivationRef = useRef<Float32Array>(new Float32Array(graph.edges.length));
  const waveRef = useRef<WaveState | null>(null);
  const nextWaveAtRef = useRef(0.8);
  const signalBufferRef = useRef<Float32Array>(new Float32Array(cfg.maxSignals * 3).fill(9999));
  const lineColorBufferRef = useRef<Float32Array>(new Float32Array(graph.linePositions.length));

  const pulseTexture = useMemo(() => makeRadialTexture(128), []);
  const lineGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(graph.linePositions, 3));
    return geo;
  }, [graph.linePositions]);
  const pulseGeometry = useMemo(() => new THREE.BufferGeometry(), []);

  useEffect(() => {
    pulseGeometry.setAttribute("position", new THREE.BufferAttribute(signalBufferRef.current, 3));
  }, [pulseGeometry]);
  useEffect(() => {
    lineGeometry.setAttribute("color", new THREE.BufferAttribute(lineColorBufferRef.current, 3));
  }, [lineGeometry]);

  const baseColor = useMemo(() => new THREE.Color("#00ff88"), []);
  const hotColor = useMemo(() => new THREE.Color("#b5ffff"), []);
  const edgeBaseColor = useMemo(() => new THREE.Color("#1f6a52"), []);
  const edgeHotColor = useMemo(() => new THREE.Color("#b8fff0"), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  const activateNodes = (nodes: number[], strengths: number[]) => {
    const activations = activationRef.current;
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const strength = strengths[i] ?? 0;
      activations[node] = Math.min(1, activations[node] + strength);
    }
  };

  const buildSignalsForLayer = (layer: number, nodes: number[], strengths: number[]) => {
    const signals: TravelingSignal[] = [];
    if (layer >= cfg.layers.length - 1) return signals;

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      const nodeStrength = strengths[i] ?? 0;
      if (nodeStrength <= 0) continue;

      const outgoing = graph.outEdges[node]
        .filter((edgeIndex) => graph.nodeLayer[graph.edges[edgeIndex].to] === layer + 1)
        .sort((a, b) => graph.edges[b].weight - graph.edges[a].weight)
        .slice(0, cfg.maxBranchPerNode);

      for (const edgeIndex of outgoing) {
        const signalStrength = nodeStrength * graph.edges[edgeIndex].weight;
        if (signalStrength < 0.05) continue;
        signals.push({
          edgeIndex,
          progress: 0,
          strength: signalStrength,
        });
      }
    }

    return signals.slice(0, cfg.maxSignals);
  };

  const startNewWave = () => {
    if (sourceNodes.length === 0) return;

    const startCount = Math.min(sourceNodes.length, 1 + Math.floor(Math.random() * 3));
    const chosen = pickRandomUnique(sourceNodes, startCount);
    const strengths = chosen.map(() => 0.45 + Math.random() * 0.45);
    activateNodes(chosen, strengths);

    const signals = buildSignalsForLayer(0, chosen, strengths);
    waveRef.current = {
      layer: 0,
      activeNodes: chosen,
      activeStrengths: strengths,
      signals,
    };
  };

  useFrame((state, delta) => {
    const elapsed = state.clock.elapsedTime;

    if (groupRef.current) {
      groupRef.current.rotation.x = -0.05;
    }

    if (linesRef.current) {
      const lineMaterial = linesRef.current.material as THREE.LineBasicMaterial;
      lineMaterial.opacity = THREE.MathUtils.clamp(smoothstep01((elapsed - 0.3) / 1.5) * 0.23, 0, 0.23);
    }

    const activations = activationRef.current;
    const edgeActivations = edgeActivationRef.current;
    const decay = Math.exp(-cfg.activationDecay * delta);
    for (let i = 0; i < activations.length; i++) {
      activations[i] *= decay;
    }
    const edgeDecay = Math.exp(-cfg.edgeActivationDecay * delta);
    for (let i = 0; i < edgeActivations.length; i++) {
      edgeActivations[i] *= edgeDecay;
    }

    if (!waveRef.current && elapsed >= nextWaveAtRef.current) {
      startNewWave();
    }

    const wave = waveRef.current;
    const signalBuffer = signalBufferRef.current;

    if (wave) {
      const arrived = new Map<number, number>();
      const stillTraveling: TravelingSignal[] = [];
      let signalWriteCount = 0;

      for (const signal of wave.signals) {
        signal.progress += delta / cfg.edgeTravelSeconds;
        const edge = graph.edges[signal.edgeIndex];
        const t = easeInOut(clamp01(signal.progress));
        const pos = edge.curve.getPoint(t);

        if (signalWriteCount < cfg.maxSignals) {
          const off = signalWriteCount * 3;
          signalBuffer[off] = pos.x;
          signalBuffer[off + 1] = pos.y;
          signalBuffer[off + 2] = pos.z;
          signalWriteCount += 1;
        }
        edgeActivations[signal.edgeIndex] = Math.max(
          edgeActivations[signal.edgeIndex],
          clamp01(signal.strength)
        );

        if (signal.progress >= 1) {
          const prev = arrived.get(edge.to) ?? 0;
          arrived.set(edge.to, prev + signal.strength);
        } else {
          stillTraveling.push(signal);
        }
      }

      wave.signals = stillTraveling;

      for (let i = signalWriteCount; i < cfg.maxSignals; i++) {
        const off = i * 3;
        signalBuffer[off] = 9999;
        signalBuffer[off + 1] = 9999;
        signalBuffer[off + 2] = 9999;
      }

      if (wave.signals.length === 0) {
        if (arrived.size === 0) {
          waveRef.current = null;
          nextWaveAtRef.current = elapsed + cfg.waveCooldown;
        } else {
          const nextNodes = Array.from(arrived.keys());
          const nextStrengths = nextNodes.map((node) => clamp01(arrived.get(node) ?? 0));
          activateNodes(nextNodes, nextStrengths);

          if (wave.layer >= cfg.layers.length - 2) {
            waveRef.current = null;
            nextWaveAtRef.current = elapsed + cfg.waveCooldown;
          } else {
            const forwardStrengths = nextStrengths.map((s) => s * 0.92);
            waveRef.current = {
              layer: wave.layer + 1,
              activeNodes: nextNodes,
              activeStrengths: forwardStrengths,
              signals: buildSignalsForLayer(wave.layer + 1, nextNodes, forwardStrengths),
            };
          }
        }
      }
    } else {
      for (let i = 0; i < cfg.maxSignals; i++) {
        const off = i * 3;
        signalBuffer[off] = 9999;
        signalBuffer[off + 1] = 9999;
        signalBuffer[off + 2] = 9999;
      }
    }

    if (pulsesRef.current) {
      const attr = pulsesRef.current.geometry.getAttribute("position") as THREE.BufferAttribute;
      attr.needsUpdate = true;
    }
    const lineColors = lineColorBufferRef.current;
    for (let edgeIdx = 0; edgeIdx < graph.edgeVertexRanges.length; edgeIdx++) {
      const range = graph.edgeVertexRanges[edgeIdx];
      const intensity = clamp01(edgeActivations[edgeIdx]);
      tmpColor.copy(edgeBaseColor).lerp(edgeHotColor, intensity);
      for (let v = range.start; v < range.start + range.count; v++) {
        const off = v * 3;
        lineColors[off] = tmpColor.r;
        lineColors[off + 1] = tmpColor.g;
        lineColors[off + 2] = tmpColor.b;
      }
    }
    const lineColorAttr = lineGeometry.getAttribute("color") as THREE.BufferAttribute;
    lineColorAttr.needsUpdate = true;

    for (let i = 0; i < graph.nodePositions.length; i++) {
      const mesh = nodeRefs.current[i];
      if (!mesh) continue;

      const appear = smoothstep01((elapsed - graph.appearAt[i]) / 0.8);
      const activation = activations[i];
      mesh.scale.setScalar(cfg.nodeRadius * appear * (1 + activation * 0.5));

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
          vertexColors
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
          size={0.19}
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
