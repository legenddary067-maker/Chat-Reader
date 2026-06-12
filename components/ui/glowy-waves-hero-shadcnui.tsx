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
  theme?: 'light' | 'dark';
}

export function GlowyWavesHero({ onLaunchClick, onExploreClick, theme = 'dark' }: GlowyWavesHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<Point>({ x: 0, y: 0 });
  const targetMouseRef = useRef<Point>({ x: 0, y: 0 });
  const isLight = theme === "light";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    let animationId: number;
    let time = 0;

    const computeThemeColors = () => {
      // Toggle top/bottom and wave palettes based on the selected theme (light vs dark)
      return {
        backgroundTop: isLight ? "rgba(255, 255, 255, 1)" : "rgba(8, 8, 8, 1)",
        backgroundBottom: isLight ? "rgba(241, 245, 249, 1)" : "rgba(12, 12, 14, 0.95)",
        wavePalette: [
          {
            offset: 0,
            amplitude: 45,
            frequency: 0.003,
            color: isLight ? "rgba(22, 163, 74, 0.75)" : "rgba(191, 255, 0, 0.8)", // rich emerald or neon lime
            opacity: isLight ? 0.7 : 0.3,
          },
          {
            offset: Math.PI / 2,
            amplitude: 55,
            frequency: 0.0026,
            color: isLight ? "rgba(217, 119, 6, 0.7)" : "rgba(251, 191, 36, 0.7)", // soft amber or glowing gold
            opacity: isLight ? 0.65 : 0.25,
          },
          {
            offset: Math.PI,
            amplitude: 40,
            frequency: 0.0034,
            color: isLight ? "rgba(124, 58, 237, 0.6)" : "rgba(147, 51, 234, 0.65)", // soft violet or neon purple
            opacity: isLight ? 0.6 : 0.2,
          },
          {
            offset: Math.PI * 1.5,
            amplitude: 50,
            frequency: 0.0022,
            color: isLight ? "rgba(34, 197, 94, 0.5)" : "rgba(163, 230, 53, 0.25)",
            opacity: isLight ? 0.5 : 0.15,
          },
          {
            offset: Math.PI * 2,
            amplitude: 35,
            frequency: 0.004,
            color: isLight ? "rgba(148, 163, 184, 0.4)" : "rgba(255, 255, 255, 0.2)",
            opacity: isLight ? 0.4 : 0.1,
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
      if (!isLight) {
        ctx.shadowBlur = 35;
        ctx.shadowColor = wave.color;
      } else {
        ctx.shadowBlur = 0;
      }
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
  }, [theme, isLight]);

  return (
    <section
      id="hero-canvas-section"
      className={`relative isolate flex min-h-[70vh] w-full items-center justify-center overflow-hidden border mb-4 rounded-none transition-colors duration-300 ${
        isLight
          ? "bg-white border-slate-200 shadow-xl"
          : "bg-black/80 border-neutral-900 shadow-2xl"
      }`}
      role="region"
      aria-label="Glowing waves hero section"
    >
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 h-full w-full pointer-events-auto transition-opacity duration-300 ${
          isLight ? "opacity-85" : "opacity-60"
        }`}
        aria-hidden="true"
      />

      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className={`absolute left-1/2 top-0 h-[320px] w-[320px] -translate-x-1/2 rounded-full blur-[100px] transition-colors duration-300 ${
          isLight ? "bg-emerald-500/[0.04]" : "bg-[#bfff00]/[0.025]"
        }`} />
        <div className={`absolute bottom-0 right-0 h-[240px] w-[240px] rounded-full blur-[80px] transition-colors duration-300 ${
          isLight ? "bg-amber-400/[0.03]" : "bg-amber-400/[0.015]"
        }`} />
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
            style={{ 
              textShadow: isLight ? "none" : "0 2px 12px rgba(0,0,0,0.95)" 
            }}
            className={`mb-4 text-[1.65rem] sm:text-3xl md:text-5xl font-black tracking-tight uppercase font-display leading-normal md:leading-normal transition-colors duration-305 ${
              isLight ? "text-slate-900 font-black" : "text-white"
            }`}
          >
            Explore Conversation{" "}
            <span 
              className={`inline-block py-1 px-1 bg-gradient-to-r bg-clip-text text-transparent transition-all duration-300 ${
                isLight
                  ? "from-emerald-700 via-green-600 to-amber-700"
                  : "from-[#bfff00] via-[#dffd40] to-yellow-500"
              }`}
            >
              Archives Instantly
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            style={{ 
              color: isLight ? "#2d3748" : "#f1f5f9",
              textShadow: isLight ? "none" : "0 2px 8px rgba(0,0,0,0.9)"
            }}
            className="mx-auto mb-8 max-w-2xl text-xs sm:text-sm leading-relaxed font-sans transition-colors duration-300 font-semibold"
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
              className={`group gap-2 rounded-none px-6 py-5 font-black font-mono uppercase tracking-widest text-[10px] w-full sm:w-auto cursor-pointer duration-300 ${
                isLight
                  ? "bg-emerald-700 hover:bg-slate-900 text-white"
                  : "bg-[#bfff00] hover:bg-white text-black"
              }`}
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
              className={`rounded-none px-6 py-5 text-[10px] font-mono uppercase tracking-widest backdrop-blur transition-all duration-305 w-full sm:w-auto cursor-pointer ${
                isLight
                  ? "hover:bg-emerald-100"
                  : "border-neutral-500 bg-neutral-950 text-white hover:text-[#bfff00] hover:border-[#bfff00] hover:bg-neutral-900"
              }`}
              style={{
                color: isLight ? "#115e59" : undefined,
                borderColor: isLight ? "#0f766e" : undefined,
                backgroundColor: isLight ? "#f0fdf4" : undefined,
                borderWidth: isLight ? "1px" : undefined
              }}
            >
              Try Simulation Data
            </Button>
          </motion.div>

          <motion.ul
            variants={itemVariants}
            style={{ color: isLight ? "#166534" : "#ffffff" }}
            className="mb-8 flex flex-wrap items-center justify-center gap-3.5 text-[9px] uppercase tracking-[0.2em] font-mono transition-colors duration-300"
          >
            {highlightPills.map((pill) => (
              <li
                key={pill}
                style={{
                  backgroundColor: isLight ? "#f0fdf4" : "rgba(10, 10, 10, 0.95)",
                  borderColor: isLight ? "#86efac" : "#525252",
                  color: isLight ? "#14532d" : "#ffffff",
                  textShadow: isLight ? "none" : "0 1px 2px rgba(0,0,0,0.8)",
                  boxShadow: isLight ? "none" : "0 4px 12px rgba(0,0,0,0.6)"
                }}
                className="rounded-none border px-3 py-1.5 backdrop-blur-md transition-all duration-300 font-extrabold shadow-sm"
              >
                {pill}
              </li>
            ))}
          </motion.ul>

          <motion.div
            variants={statsVariants}
            style={{
              backgroundColor: isLight ? "#f0fdf4" : "rgba(8, 8, 8, 0.95)",
              borderColor: isLight ? "#86efac" : "#404040",
              boxShadow: isLight ? "none" : "0 4px 20px rgba(0,0,0,0.7)"
            }}
            className="grid gap-4 rounded-none border p-5 backdrop-blur-md sm:grid-cols-3 transition-colors duration-300 shadow-sm"
          >
            {heroStats.map((stat) => (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                className="space-y-1 text-center sm:text-left"
              >
                <div 
                  style={{ color: isLight ? "#166534" : "#cbd5e1" }}
                  className="text-[8px] uppercase tracking-[0.25em] font-mono transition-colors duration-300 font-bold"
                >
                  {stat.label}
                </div>
                <div 
                  style={{ 
                    color: isLight ? "#15803d" : "#bfff00",
                    textShadow: isLight ? "none" : "0 1px 3px rgba(0,0,0,0.8)"
                  }}
                  className="text-sm font-extrabold font-mono transition-colors duration-300"
                >
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
