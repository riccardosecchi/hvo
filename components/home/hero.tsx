"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { useRef } from "react";

export function Hero() {
  const t = useTranslations("hero");
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const logoY = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const logoScale = useTransform(scrollYProgress, [0, 1], [1, 0.8]);
  const logoOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, 100]);

  const scrollToEvents = () => {
    document.getElementById("events")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
    >
      {/* Animated gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Cyan orb */}
        <motion.div
          className="absolute w-[600px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(0, 229, 255, 0.15) 0%, transparent 70%)",
            top: "10%",
            left: "20%",
            filter: "blur(60px)",
          }}
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Magenta orb */}
        <motion.div
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(233, 30, 140, 0.12) 0%, transparent 70%)",
            bottom: "20%",
            right: "10%",
            filter: "blur(60px)",
          }}
          animate={{
            x: [0, -40, 0],
            y: [0, -50, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Violet orb */}
        <motion.div
          className="absolute w-[400px] h-[400px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(123, 47, 187, 0.1) 0%, transparent 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            filter: "blur(50px)",
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Logo Container */}
      <motion.div
        style={{ y: logoY, scale: logoScale, opacity: logoOpacity }}
        className="relative z-10"
      >
        {/* Glow ring behind logo */}
        <motion.div
          className="absolute inset-0 -m-8 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(0, 229, 255, 0.2) 0%, transparent 70%)",
            filter: "blur(30px)",
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <Image
            src="/logos/04_HVO.jpg"
            alt="HVO"
            width={400}
            height={400}
            className="w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 object-cover rounded-2xl shadow-2xl"
            style={{
              boxShadow: "0 0 60px rgba(0, 229, 255, 0.3), 0 0 120px rgba(233, 30, 140, 0.15)",
            }}
            priority
          />

          {/* Decorative corner accents */}
          <div className="absolute -top-2 -left-2 w-8 h-8 border-t-2 border-l-2 border-[var(--hvo-cyan)] opacity-60" />
          <div className="absolute -top-2 -right-2 w-8 h-8 border-t-2 border-r-2 border-[var(--hvo-cyan)] opacity-60" />
          <div className="absolute -bottom-2 -left-2 w-8 h-8 border-b-2 border-l-2 border-[var(--hvo-magenta)] opacity-60" />
          <div className="absolute -bottom-2 -right-2 w-8 h-8 border-b-2 border-r-2 border-[var(--hvo-magenta)] opacity-60" />
        </motion.div>
      </motion.div>

      {/* Tagline */}
      <motion.div
        style={{ y: textY }}
        className="relative z-10 mt-12"
      >
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-2xl md:text-3xl lg:text-4xl font-display tracking-[0.2em] text-[var(--hvo-text-secondary)] uppercase"
        >
          {t("tagline")}
        </motion.p>

        {/* Animated underline */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="h-[2px] mt-4 mx-auto"
          style={{
            background: "linear-gradient(90deg, transparent, var(--hvo-cyan), var(--hvo-magenta), transparent)",
            width: "200px",
          }}
        />
      </motion.div>

      {/* Genre Tags */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="relative z-10 mt-8 flex flex-wrap justify-center gap-3"
      >
        {["Tech House", "House", "Latin House", "Techno"].map((genre, i) => (
          <motion.span
            key={genre}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 + i * 0.1 }}
            className="px-4 py-1.5 text-sm font-medium tracking-wider uppercase rounded-full border border-[var(--hvo-border)] text-[var(--hvo-text-muted)] hover:border-[var(--hvo-cyan)] hover:text-[var(--hvo-cyan)] transition-colors duration-300 cursor-default"
          >
            {genre}
          </motion.span>
        ))}
      </motion.div>

      {/* Scroll indicator */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        onClick={scrollToEvents}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[var(--hvo-text-muted)] hover:text-[var(--hvo-cyan)] transition-colors group cursor-pointer"
        aria-label="Scroll to events"
      >
        <span className="text-xs font-display tracking-[0.3em] uppercase opacity-60 group-hover:opacity-100 transition-opacity">
          Explore
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="h-6 w-6" />
        </motion.div>
      </motion.button>

      {/* Bottom fade gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--hvo-void)] to-transparent pointer-events-none" />
    </section>
  );
}
