"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ScrollControls, Environment, PerspectiveCamera, Stars, useScroll } from "@react-three/drei";
import { Suspense, useRef } from "react";
import * as THREE from "three";
import { KineticObject } from "./KineticObject";

export function Scene3D() {
    return (
        <div className="absolute inset-0 z-0 h-screen w-full">
            <Canvas
                dpr={[1, 1.5]} // Cap dpr to 1.5 for performance
                gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
                shadows
            >
                <Suspense fallback={null}>
                    {/* ScrollControls links the DOM scroll to the 3D scene. 
                Using pages=1.5 allows for some scroll travel within the hero if needed, 
                or we assume the scene is part of a larger scroll context.
                damping={0.2} gives it that smooth, heavy fluid feel.
            */}
                    <ScrollControls pages={0} damping={0.2}>
                        <SceneContent />
                    </ScrollControls>

                    <Environment preset="city" />
                </Suspense>
            </Canvas>
        </div>
    );
}

function SceneContent() {
    return (
        <>
            <DynamicLights />
            <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={35} />

            {/* Starfield for depth */}
            <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={0.5} />

            {/* Main Object */}
            <KineticObject />
        </>
    )
}

function DynamicLights() {
    const scroll = useScroll();
    const spotLightRef = useRef<THREE.SpotLight>(null);
    const ambientRef = useRef<THREE.AmbientLight>(null);
    const pointLightRef = useRef<THREE.PointLight>(null);

    useFrame((state) => {
        const offset = scroll?.offset ?? 0;

        // As we scroll, lighting becomes more dramatic
        if (spotLightRef.current) {
            spotLightRef.current.intensity = 2 + offset * 10; // Intense burst
            // Color shift? Maybe subtly
        }

        if (pointLightRef.current) {
            // Move the rim light
            pointLightRef.current.position.x = -10 + offset * 20; // Pans across
        }

        // Camera moves slightly closer ("Dolly In")
        // We can access camera via state.camera
        // But better to keep it subtle if we don't control the full camera rig
        state.camera.position.z = 6 - offset * 3; // Moves from 6 to 3
    });

    return (
        <>
            <ambientLight ref={ambientRef} intensity={0.2} />
            <spotLight
                ref={spotLightRef}
                position={[10, 10, 5]}
                angle={0.5}
                penumbra={1}
                intensity={2}
                color="#00e5ff" // Electric Kinetic Green/Cyan
                castShadow
            />
            <pointLight
                ref={pointLightRef}
                position={[-10, 0, -5]}
                intensity={3}
                color="#E91E8C" // Neon Magenta
            />
        </>
    );
}
