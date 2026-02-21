"use client";

import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

type Vec3 = [number, number, number];
type Edge = { a: number; b: number; curve: THREE.QuadraticBezierCurve3; layer: number };

type Pulse = {
  edgeIndex: number;
  t: number; // 0..1 progress on current edge
  speed: number; // progress per second
};

function smoothstep01(x: number) {
  const t = THREE.MathUtils.clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
}

function easeInOut(t: number) {
  // smoother than linear; not “bouncy”
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

function makeRadialTexture(size = 128) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0.0, "rgba(255,255,255,1)");
  g.addColorStop(0.2, "rgba(180,255,255,0.9)");
  g.addColorStop(0.55, "rgba(0,255,220,0.28)");
  g.addColorStop(1.0, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  return tex;
}

const cfg = {
  layers: [4, 6, 8, 6, 4, 2],
  layerSpacing: 1.55,

  // “tunnel” shape: radius changes across layers + twist
  radiusStart: 1.05,
  radiusEnd: 0.55,
  twistPerLayer: 0.55, // radians
  jitter: 0.06, // small, not messy

  // wiring aesthetics
  connectionsPerNode: 3, // keep low -> clean
  curvature: 0.35, // how much edges bow outward

  // nodes + glow
  nodeScale: 0.055,
  haloBase: 0.14,
  haloBoost: 0.55,
  activationDecay: 1.6, // per second, lower = longer glow

  // signal behavior (slow + smooth)
  maxPulses: 24,
  pulsesPerSecond: 0.9,
  edgeTravelSeconds: 1.25, // time to traverse one layer connection

  // global motion
  rotateSpeed: 0.22,
};

function NetworkScene() {
  const groupRef = useRef<THREE.Group>(null);

  const nodesRef = useRef<THREE.InstancedMesh>(null);
  const halosRef = useRef<THREE.InstancedMesh>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const pulsesRef = useRef<THREE.Points>(null);

  const tex = useMemo(() => makeRadialTexture(128), []);

  const {
    nodePositions,
    nodeLayerOffsets,
    edges,
    outEdges,
    linePositions,
    pulsePositions,
    activation,
    appearAt,
  } = useMemo(() => {
    const nodePositions: THREE.Vector3[] = [];
    const appearAt: number[] = [];
    const layerIndices: number[][] = [];
    const nodeLayerOffsets: number[] = []; // map node index -> layer

    const totalWidth = (cfg.layers.length - 1) * cfg.layerSpacing;
    const startX = -totalWidth / 2;

    let idx = 0;
    for (let li = 0; li < cfg.layers.length; li++) {
      const count = cfg.layers[li];
      const x = startX + li * cfg.layerSpacing;

      const u = cfg.layers.length === 1 ? 0 : li / (cfg.layers.length - 1);
      const radius = THREE.MathUtils.lerp(cfg.radiusStart, cfg.radiusEnd, u);
      const twist = li * cfg.twistPerLayer;

      const indices: number[] = [];
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + twist;

        // ring in YZ plane (a “tunnel” down X)
        const y = Math.cos(a) * radius;
        const z = Math.sin(a) * radius;

        const jy = (Math.random() * 2 - 1) * cfg.jitter;
        const jz = (Math.random() * 2 - 1) * cfg.jitter;

        nodePositions.push(new THREE.Vector3(x, y + jy, z + jz));
        appearAt.push(li * 0.18 + i * 0.035);
        nodeLayerOffsets.push(li);

        indices.push(idx++);
      }
      layerIndices.push(indices);
    }

    // helper: compute “angle” around tunnel axis for a node (for clean wiring)
    const angleOf = (v: THREE.Vector3) => Math.atan2(v.z, v.y);

    // edges + adjacency
    const edges: Edge[] = [];
    const outEdges: number[][] = Array.from({ length: nodePositions.length }, () => []);

    for (let li = 0; li < layerIndices.length - 1; li++) {
      const from = layerIndices[li];
      const to = layerIndices[li + 1];

      // Pre-sort next layer by angle for nearest neighbor picking
      const toSorted = [...to].sort((i, j) => angleOf(nodePositions[i]) - angleOf(nodePositions[j]));
      const toAngles = toSorted.map((i) => angleOf(nodePositions[i]));

      for (const a of from) {
        const aAngle = angleOf(nodePositions[a]);

        // find closest in toSorted by angle
        let best = 0;
        let bestDist = Infinity;
        for (let k = 0; k < toAngles.length; k++) {
          const d = Math.abs(THREE.MathUtils.euclideanModulo(toAngles[k] - aAngle + Math.PI, 2 * Math.PI) - Math.PI);
          if (d < bestDist) {
            bestDist = d;
            best = k;
          }
        }

        // connect to closest + neighbors => symmetric, intentional “fan”
        const half = Math.floor(cfg.connectionsPerNode / 2);
        for (let s = -half; s <= half; s++) {
          if (edges.length > 2000) break;
          const bi = toSorted[(best + s + toSorted.length) % toSorted.length];
          const A = nodePositions[a];
          const B = nodePositions[bi];

          // Curve control point: push outward from axis for a nice bow
          const mid = new THREE.Vector3().addVectors(A, B).multiplyScalar(0.5);
          const outward = new THREE.Vector3(0, mid.y, mid.z).normalize().multiplyScalar(cfg.curvature);
          const control = mid.clone().add(outward);

          const curve = new THREE.QuadraticBezierCurve3(A.clone(), control, B.clone());
          const edgeIndex = edges.length;
          edges.push({ a, b: bi, curve, layer: li });
          outEdges[a].push(edgeIndex);
        }
      }
    }

    // lines geometry: sample each curve into small segments (looks smoother than straight lines)
    const SEG = 14; // segments per edge
    const linePositions: number[] = [];
    for (const e of edges) {
      let prev = e.curve.getPoint(0);
      for (let s = 1; s <= SEG; s++) {
        const p = e.curve.getPoint(s / SEG);
        linePositions.push(prev.x, prev.y, prev.z, p.x, p.y, p.z);
        prev = p;
      }
    }

    const pulsePositions = new Float32Array(cfg.maxPulses * 3);
    for (let i = 0; i < pulsePositions.length; i++) pulsePositions[i] = 9999;

    const activation = new Float32Array(nodePositions.length);

    return {
      nodePositions,
      nodeLayerOffsets,
      edges,
      outEdges,
      linePositions: new Float32Array(linePositions),
      pulsePositions,
      activation,
      appearAt,
    };
  }, []);

  const pulses = useRef<Pulse[]>([]);
  const spawnAcc = useRef(0);

  const tmpObj = useMemo(() => new THREE.Object3D(), []);
  const baseColor = useMemo(() => new THREE.Color("#00ff88"), []);
  const hotColor = useMemo(() => new THREE.Color("#66ffff"), []);
  const tmpColor = useMemo(() => new THREE.Color(), []);

  function spawnFromLayer0() {
    // pick a start node in first layer
    const layer0Count = cfg.layers[0];
    const start = Math.floor(Math.random() * layer0Count);
    const outs = outEdges[start];
    if (!outs || outs.length === 0) return;

    const edgeIndex = outs[Math.floor(Math.random() * outs.length)];
    const speed = 1 / cfg.edgeTravelSeconds; // progress per second

    pulses.current.push({ edgeIndex, t: 0, speed });
    activation[start] = Math.min(1, activation[start] + 0.35);
  }

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;

    // Global rotation: smooth, not wobbly
    if (groupRef.current) {
      groupRef.current.rotation.y = t * cfg.rotateSpeed;
      groupRef.current.rotation.x = Math.sin(t * 0.18) * 0.12;
      groupRef.current.rotation.z = Math.sin(t * 0.14) * 0.06;
    }

    // Fade-in lines once, softly
    if (linesRef.current) {
      const mat = linesRef.current.material as THREE.LineBasicMaterial;
      mat.opacity = THREE.MathUtils.clamp(smoothstep01((t - 0.2) / 1.6) * 0.22, 0, 0.22);
    }

    // Smooth activation decay (no blinking)
    const decay = Math.exp(-cfg.activationDecay * delta);
    for (let i = 0; i < activation.length; i++) activation[i] *= decay;

    // Spawn pulses slowly, continuously
    if (t > 0.9) {
      spawnAcc.current += delta * cfg.pulsesPerSecond;
      while (spawnAcc.current >= 1) {
        spawnAcc.current -= 1;
        if (pulses.current.length < cfg.maxPulses) spawnFromLayer0();
      }
    }

    // Update pulse positions
    for (let i = pulses.current.length - 1; i >= 0; i--) {
      const p = pulses.current[i];
      p.t += delta * p.speed;

      const edge = edges[p.edgeIndex];
      const tt = easeInOut(THREE.MathUtils.clamp(p.t, 0, 1));
      const pos = edge.curve.getPoint(tt);

      const o = i * 3;
      nodeSafeWrite(pulsePositions, o, pos.x, pos.y, pos.z);

      if (p.t >= 1) {
        // activate target node
        activation[edge.b] = Math.min(1, activation[edge.b] + 0.9);

        // choose one outgoing edge from that node for continued propagation (smooth chain)
        const outs = outEdges[edge.b];
        if (outs && outs.length > 0 && pulses.current.length < cfg.maxPulses) {
          const nextEdge = outs[Math.floor(Math.random() * outs.length)];
          pulses.current[i] = { edgeIndex: nextEdge, t: 0, speed: 1 / cfg.edgeTravelSeconds };
          // keep the same pulse slot, so we don't “pop”
          continue;
        }

        // if no outgoing, remove pulse
        pulses.current.splice(i, 1);
      }
    }

    // hide unused pulse slots
    for (let i = pulses.current.length; i < cfg.maxPulses; i++) {
      const o = i * 3;
      nodeSafeWrite(pulsePositions, o, 9999, 9999, 9999);
    }

    if (pulsesRef.current) {
      const geo = pulsesRef.current.geometry as THREE.BufferGeometry;
      const attr = geo.getAttribute("position") as THREE.BufferAttribute;
      attr.needsUpdate = true;
    }

    // Update instanced nodes + halos (no sinusoid — only appear + activation)
    const nodes = nodesRef.current;
    const halos = halosRef.current;
    if (nodes && halos) {
      for (let i = 0; i < nodePositions.length; i++) {
        const appear = smoothstep01((t - appearAt[i]) / 0.9);
        const act = activation[i];

        // Node: steady scale, slight activation boost only
        const s = cfg.nodeScale * appear * (1 + act * 0.35);
        tmpObj.position.copy(nodePositions[i]);
        tmpObj.scale.setScalar(s);
        tmpObj.updateMatrix();
        nodes.setMatrixAt(i, tmpObj.matrix);

        tmpColor.copy(baseColor).lerp(hotColor, act * 0.85);
        nodes.setColorAt(i, tmpColor);

        // Halo: scales with activation (this reads as “signal arrived”)
        const hs = cfg.haloBase * appear * (1 + act * cfg.haloBoost);
        tmpObj.scale.setScalar(hs);
        tmpObj.updateMatrix();
        halos.setMatrixAt(i, tmpObj.matrix);

        tmpColor.copy(hotColor).lerp(baseColor, 0.25);
        halos.setColorAt(i, tmpColor);
      }

      nodes.instanceMatrix.needsUpdate = true;
      halos.instanceMatrix.needsUpdate = true;
      if (nodes.instanceColor) nodes.instanceColor.needsUpdate = true;
      if (halos.instanceColor) halos.instanceColor.needsUpdate = true;
    }
  });

  const lineGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
    return geo;
  }, [linePositions]);

  const pulseGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pulsePositions, 3));
    return geo;
  }, [pulsePositions]);

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.55} />
      <pointLight position={[6, 4, 8]} intensity={1.1} />
      <pointLight position={[-6, -3, -6]} intensity={0.6} />

      {/* Connections: smooth sampled curves */}
      <lineSegments ref={linesRef} geometry={lineGeometry}>
        <lineBasicMaterial
          color="#66ffcc"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* Halos (additive) */}
      <instancedMesh ref={halosRef} args={[undefined as any, undefined as any, nodePositions.length]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color="#66ffff"
          transparent
          opacity={0.10}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </instancedMesh>

      {/* Nodes */}
      <instancedMesh ref={nodesRef} args={[undefined as any, undefined as any, nodePositions.length]}>
        <sphereGeometry args={[1, 22, 22]} />
        <meshStandardMaterial
          vertexColors
          emissive="#00ff88"
          emissiveIntensity={0.9}
          roughness={0.35}
          metalness={0.0}
        />
      </instancedMesh>

      {/* Pulses: smooth particles */}
      <points ref={pulsesRef} geometry={pulseGeometry}>
        <pointsMaterial
          map={tex}
          transparent
          opacity={0.95}
          size={0.20}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          color="#c8ffff"
        />
      </points>
    </group>
  );
}

// small safety to avoid out-of-bounds write
function nodeSafeWrite(arr: Float32Array, o: number, x: number, y: number, z: number) {
  if (o + 2 >= arr.length) return;
  arr[o] = x;
  arr[o + 1] = y;
  arr[o + 2] = z;
}

export default function NeuralNetwork3DSmooth() {
  return (
    <div className="neural-network-container">
      <Canvas
        camera={{ position: [0, 0, 6.4], fov: 50 }}
        style={{ background: "transparent" }}
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 2]}
      >
        <NetworkScene />
      </Canvas>
    </div>
  );
}

