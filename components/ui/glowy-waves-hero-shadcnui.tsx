import { motion, type Variants } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";

type Point = {
  x: number;
  y: number;
};

interface WaveConfig {
  offset: number;
  amplitude: number;
  frequency: number;
  color: string;
  opacity: number;
}

const highlightPills = [
  "🔒 Fully Sandboxed",
  "⚡ GPU Accelerated Waves",
  "📱 Mobile Responsive",
] as const;

const heroStats: { label: string; value: string }[] = [
  { label: "Parsing latency", value: "< 5ms" },
  { label: "Security rating", value: "Military" },
  { label: "Supported file formats", value: "ZIP, TXT, JSON" },
];

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, staggerChildren: 0.12 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const statsVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.08 },
  },
};

interface GlowyWavesHeroProps {
  onLaunchClick?: () => void;
  onExploreClick?: () => void;
}

export function GlowyWavesHero({ onLaunchClick, onExploreClick }: GlowyWavesHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<Point>({ x: 0, y: 0 });
  const targetMouseRef = useRef<Point>({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    let animationId: number;
    let time = 0;

    const computeThemeColors = () => {
      // Custom palette to align nicely with the glowing green/amber dark theme
      return {
        backgroundTop: "rgba(8, 8, 8, 1)",
        backgroundBottom: "rgba(12, 12, 14, 0.95)",
        wavePalette: [
          {
            offset: 0,
            amplitude: 45,
            frequency: 0.003,
            color: "rgba(191, 255, 0, 0.8)", // neon yellow
            opacity: 0.3,
          },
          {
            offset: Math.PI / 2,
            amplitude: 55,
            frequency: 0.0026,
            color: "rgba(251, 191, 36, 0.7)", // amber
            opacity: 0.25,
          },
          {
            offset: Math.PI,
            amplitude: 40,
            frequency: 0.0034,
            color: "rgba(147, 51, 234, 0.65)", // purple
            opacity: 0.2,
          },
          {
            offset: Math.PI * 1.5,
            amplitude: 50,
            frequency: 0.0022,
            color: "rgba(163, 230, 53, 0.25)",
            opacity: 0.15,
          },
          {
            offset: Math.PI * 2,
            amplitude: 35,
            frequency: 0.004,
            color: "rgba(255, 255, 255, 0.2)",
            opacity: 0.1,
          },
        ] satisfies WaveConfig[],
      };
    };

    let themeColors = computeThemeColors();

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const mouseInfluence = prefersReducedMotion ? 10 : 70;
    const influenceRadius = prefersReducedMotion ? 160 : 320;
    const smoothing = prefersReducedMotion ? 0.04 : 0.1;

    const resizeCanvas = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    const recenterMouse = () => {
      const centerPoint = { x: canvas.width / 2, y: canvas.height / 2 };
      mouseRef.current = centerPoint;
      targetMouseRef.current = centerPoint;
    };

    const handleResize = () => {
      resizeCanvas();
      recenterMouse();
    };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetMouseRef.current = { 
        x: event.clientX - rect.left, 
        y: event.clientY - rect.top 
      };
    };

    const handleMouseLeave = () => {
      recenterMouse();
    };

    resizeCanvas();
    recenterMouse();

    window.addEventListener("resize", handleResize);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    const drawWave = (wave: WaveConfig) => {
      ctx.save();
      ctx.beginPath();

      for (let x = 0; x <= canvas.width; x += 4) {
        const dx = x - mouseRef.current.x;
        const dy = canvas.height / 2 - mouseRef.current.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const influence = Math.max(0, 1 - distance / influenceRadius);
        const mouseEffect =
          influence *
          mouseInfluence *
          Math.sin(time * 0.001 + x * 0.01 + wave.offset);

        const y =
          canvas.height / 2 +
          Math.sin(x * wave.frequency + time * 0.002 + wave.offset) *
            wave.amplitude +
          Math.sin(x * wave.frequency * 0.4 + time * 0.003) *
            (wave.amplitude * 0.45) +
          mouseEffect;

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = wave.color;
      ctx.globalAlpha = wave.opacity;
      ctx.shadowBlur = 35;
      ctx.shadowColor = wave.color;
      ctx.stroke();

      ctx.restore();
    };

    const animate = () => {
      time += 1;

      mouseRef.current.x +=
        (targetMouseRef.current.x - mouseRef.current.x) * smoothing;
      mouseRef.current.y +=
        (targetMouseRef.current.y - mouseRef.current.y) * smoothing;

      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, themeColors.backgroundTop);
      gradient.addColorStop(1, themeColors.backgroundBottom);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      themeColors.wavePalette.forEach(drawWave);

      animationId = window.requestAnimationFrame(animate);
    };

    animationId = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (canvas) {
        canvas.removeEventListener("mousemove", handleMouseMove);
        canvas.removeEventListener("mouseleave", handleMouseLeave);
      }
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <section
      className="relative isolate flex min-h-[70vh] w-full items-center justify-center overflow-hidden bg-black/80 border border-neutral-900 rounded-none mb-4"
      role="region"
      aria-label="Glowing waves hero section"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full opacity-60 pointer-events-auto"
        aria-hidden="true"
      />

      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute left-1/2 top-0 h-[320px] w-[320px] -translate-x-1/2 rounded-full bg-[#bfff00]/[0.025] blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-[240px] w-[240px] rounded-full bg-amber-400/[0.015] blur-[80px]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-4 py-12 text-center md:px-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full"
        >
          <motion.h1
            variants={itemVariants}
            className="mb-4 text-3xl font-black tracking-tight text-white md:text-5xl uppercase font-display italic leading-none"
          >
            Explore Conversation{" "}
            <span className="bg-gradient-to-r from-[#bfff00] via-[#dffd40] to-yellow-500 bg-clip-text text-transparent">
              Archives Instantly
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mx-auto mb-8 max-w-2xl text-xs sm:text-sm text-neutral-400 leading-relaxed font-sans"
          >
            Secure diagnostic parser translates raw WhatsApp logs, iOS chats, or Instagram JSON exports locally.
            No data ever leaves your browser window. Zero storage latency, maximum client-side isolated speed.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="mb-8 flex flex-col items-center justify-center gap-3 sm:flex-row relative z-20"
          >
            <Button
              size="sm"
              onClick={onLaunchClick}
              className="group gap-2 rounded-none px-6 py-5 bg-[#bfff00] hover:bg-white text-black font-black font-mono uppercase tracking-widest text-[10px] w-full sm:w-auto cursor-pointer duration-200"
            >
              Upload Chat Archive
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onExploreClick}
              className="rounded-none border-neutral-800 bg-neutral-950/80 px-6 py-5 text-neutral-300 hover:text-white hover:border-[#bfff00] text-[10px] font-mono uppercase tracking-widest backdrop-blur transition-all duration-200 w-full sm:w-auto cursor-pointer"
            >
              Try Simulation Data
            </Button>
          </motion.div>

          <motion.ul
            variants={itemVariants}
            className="mb-8 flex flex-wrap items-center justify-center gap-3.5 text-[9px] uppercase tracking-[0.2em] font-mono text-neutral-400"
          >
            {highlightPills.map((pill) => (
              <li
                key={pill}
                className="rounded-none border border-neutral-900 bg-neutral-950/50 px-3 py-1.5 backdrop-blur-sm"
              >
                {pill}
              </li>
            ))}
          </motion.ul>

          <motion.div
            variants={statsVariants}
            className="grid gap-4 rounded-none border border-neutral-900 bg-neutral-950/40 p-5 backdrop-blur-sm sm:grid-cols-3"
          >
            {heroStats.map((stat) => (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                className="space-y-1 text-center sm:text-left"
              >
                <div className="text-[8px] uppercase tracking-[0.25em] text-neutral-500 font-mono">
                  {stat.label}
                </div>
                <div className="text-sm font-extrabold text-[#bfff00] font-mono">
                  {stat.value}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
