"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
// import { ParticleBackground } from "@/components/effects/particles"; // Deprioritized for 3D Scene
import { Scene3D } from "@/components/hero/Scene3D";

export function Hero() {
  const t = useTranslations("hero");

  const scrollToEvents = () => {
    document.getElementById("events")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
      {/* 3D Scene Background - The "Visualized Kinetic Sound" */}
      <div className="absolute inset-0 z-0">
        <Scene3D />
      </div>

      {/* Content Overlay - Must be z-10 or higher to sit above Canvas */}
      <div className="relative z-10 flex flex-col items-center pointer-events-none">

        {/* Pointer events auto for interactive elements */}
        <div className="pointer-events-auto">
          {/* Stylized HVO Logo - Text-based, harmonious with background */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            {/* Outer Glow - Very soft, blends with background */}
            <motion.div
              animate={{
                opacity: [0.3, 0.5, 0.3],
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 -m-16"
              style={{
                background: "radial-gradient(ellipse at center, rgba(0, 229, 255, 0.2) 0%, rgba(233, 30, 140, 0.15) 40%, transparent 70%)",
                filter: "blur(50px)",
              }}
            />

            {/* Main Logo Text */}
            <motion.div
              className="relative"
              style={{
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            >
              {/* Background glow layer for depth */}
              <span
                className="absolute inset-0 text-8xl sm:text-9xl md:text-[11rem] lg:text-[14rem] font-black tracking-[0.15em] pl-[0.15em] text-center select-none"
                style={{
                  background: "linear-gradient(180deg, rgba(0, 229, 255, 0.4) 0%, rgba(233, 30, 140, 0.4) 50%, rgba(123, 47, 187, 0.3) 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  filter: "blur(20px)",
                  transform: "scale(1.02)",
                }}
                aria-hidden="true"
              >
                HVO
              </span>

              {/* Main text with gradient - slightly more transparent to show 3D behind? */}
              <h1
                className="relative text-8xl sm:text-9xl md:text-[11rem] lg:text-[14rem] font-black tracking-[0.15em] pl-[0.15em] text-center mix-blend-overlay opacity-90"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, #00E5FF 30%, #E91E8C 60%, #7B2FBB 80%, rgba(255,255,255,0.9) 100%)",
                  backgroundSize: "300% 300%",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  animation: "gradient-shift 10s ease infinite",
                  textShadow: "0 0 80px rgba(0, 229, 255, 0.3), 0 0 120px rgba(233, 30, 140, 0.2)",
                }}
              >
                HVO
              </h1>

            </motion.div>
          </motion.div>

          {/* Tagline with reveal animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-8 overflow-hidden text-center"
          >
            <motion.p
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.8, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-sm sm:text-base md:text-lg tracking-[0.5em] uppercase font-light"
              style={{
                background: "linear-gradient(90deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.4) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {t("tagline")}
            </motion.p>
          </motion.div>

          {/* Genre Tags */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="mt-10 flex flex-wrap justify-center gap-3"
          >
            {["TECH HOUSE", "HOUSE", "TECHNO", "LATIN HOUSE"].map((genre, i) => (
              <motion.span
                key={genre}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2 + i * 0.1, duration: 0.5 }}
                className="px-5 py-2.5 text-[10px] sm:text-xs tracking-[0.3em] font-medium border rounded-full backdrop-blur-md transition-all duration-500 cursor-default"
                style={{
                  background: "rgba(0, 0, 0, 0.4)", // Darker backdrop for tags
                  borderColor: "rgba(255, 255, 255, 0.15)",
                  color: "rgba(255, 255, 255, 0.7)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(0, 229, 255, 0.4)";
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.9)";
                  e.currentTarget.style.background = "rgba(0, 229, 255, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.08)";
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.5)";
                  e.currentTarget.style.background = "rgba(0, 0, 0, 0.4)";
                }}
              >
                {genre}
              </motion.span>
            ))}
          </motion.div>
        </div>

      </div>

      {/* Scroll Indicator */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.8 }}
        onClick={scrollToEvents}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 z-20 group cursor-pointer pointer-events-auto"
        aria-label="Scroll to events"
      >
        <span className="text-[10px] tracking-[0.5em] uppercase font-medium text-white/30 group-hover:text-white/70 transition-colors duration-300">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="relative"
        >
          <ChevronDown className="w-5 h-5 text-white/30 group-hover:text-cyan-400 transition-colors duration-300" />
          <div className="absolute inset-0 blur-lg bg-cyan-400/0 group-hover:bg-cyan-400/40 transition-all duration-300" />
        </motion.div>
      </motion.button>

      {/* Vignette/Depth Overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-[5]"
        style={{
          background: `
            radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.4) 100%),
            linear-gradient(to bottom, transparent 80%, #000 100%)
          `,
        }}
      />
    </section>
  );
}
