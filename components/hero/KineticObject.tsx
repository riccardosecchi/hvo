"use client";

import { useRef, useMemo } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useScroll, MeshTransmissionMaterial, Float } from "@react-three/drei";

export function KineticObject() {
    const meshRef = useRef<THREE.Mesh>(null);
    const scroll = useScroll();

    // Icosahedron with detail = 0 for that brutalist, faceted look
    const geometry = useMemo(() => new THREE.IcosahedronGeometry(1.5, 0), []);

    useFrame((state, delta) => {
        if (!meshRef.current) return;

        // Get scroll offset (0 to 1) safely
        const offset = scroll?.offset ?? 0;
        const t = state.clock.getElapsedTime();

        // Morphing / Kinetic Movement
        // Idle: Slow "breathing" rotation
        // Scroll: Aggressive twist and scale

        // Rotation:
        meshRef.current.rotation.x = Math.sin(t * 0.1) * 0.2 + offset * Math.PI * 2;
        meshRef.current.rotation.y = Math.cos(t * 0.15) * 0.2 + offset * Math.PI;

        // Scale / Unfolding:
        // It gets slightly bigger and more imposing as you scroll
        const pulse = Math.sin(t * 0.5) * 0.05 + 1; // 1 +/- 0.05
        const scrollScale = 1 + offset * 0.8;
        meshRef.current.scale.setScalar(pulse * scrollScale);
    });

    return (
        <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5} floatingRange={[-0.2, 0.2]}>
            <mesh ref={meshRef} geometry={geometry}>
                {/* 
          Obsidian/Chrome Material
          High-end transmission material for dark glass/metal look.
        */}
                <MeshTransmissionMaterial
                    backside
                    samples={4}
                    resolution={128}
                    thickness={0.8}
                    chromaticAberration={0.05}
                    anisotropy={0.3}
                    distortion={0.5}
                    distortionScale={0.5}
                    temporalDistortion={0.1}
                    iridescence={0.8}
                    iridescenceIOR={1}
                    iridescenceThicknessRange={[0, 1400]}
                    color="#000000"
                    background={new THREE.Color("#000000")} // Helps with dark look
                    roughness={0.15}
                    metalness={0.7}
                />

                {/* Neon Wireframe Overlay for "Technological Precision" */}
                {/* We use a slightly larger geometry for the wireframe to prevent z-fighting */}
                <lineSegments scale={1.02}>
                    <edgesGeometry args={[geometry]} />
                    <meshBasicMaterial color="#00E5FF" transparent opacity={0.1} depthWrite={false} />
                </lineSegments>
            </mesh>

            {/* Inner Emissive Core (The "Beat") */}
            <mesh scale={0.4}>
                <icosahedronGeometry args={[1, 1]} />
                <meshStandardMaterial
                    emissive="#7B2FBB" // Ultraviolet
                    emissiveIntensity={3}
                    color="#000000"
                    toneMapped={false}
                />
            </mesh>
        </Float>
    );
}
