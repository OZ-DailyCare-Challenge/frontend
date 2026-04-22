"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Bubble = {
  id: number;
  emoji: string;
  hint: string;
  title: string;
  summary: string;
  detail: string;
};

type PhysicsBubble = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  size: number;
  interactive: boolean;
  data?: Bubble;
  depth: number;
};

type StaticBubble = {
  id: number;
  x: number;
  y: number;
  size: number;
  depth: number;
  driftDuration: number;
};

type PopParticle = {
  id: string;
  bubbleId: number;
  x: number;
  y: number;
  size: number;
  dx: number;
  dy: number;
  delay: number;
};

type PopBurst = {
  id: string;
  bubbleId: number;
  x: number;
  y: number;
  size: number;
  particles: PopParticle[];
};

type Props = {
  bubbles: Bubble[];
  onOpen: (bubble: Bubble) => void;
  onHover?: (target: { x: number; y: number } | null) => void;
};

const SAFE_PADDING = 20;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

function circleRectCollision(
  cx: number,
  cy: number,
  radius: number,
  rect: { x: number; y: number; width: number; height: number }
) {
  const closestX = clamp(cx, rect.x, rect.x + rect.width);
  const closestY = clamp(cy, rect.y, rect.y + rect.height);
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy < radius * radius;
}

function normalize(dx: number, dy: number) {
  const len = Math.hypot(dx, dy) || 0.0001;
  return { x: dx / len, y: dy / len };
}

const sparkleLayout = [
  { left: "20%", top: "28%", size: 4, delay: 0.0 },
  { left: "74%", top: "24%", size: 3.5, delay: 0.35 },
];

function createBurst(
  bubbleId: number,
  centerX: number,
  centerY: number,
  size: number
): PopBurst {
  const particleCount = 6;
  const radius = size * 0.36;

  const particles: PopParticle[] = Array.from(
    { length: particleCount },
    (_, i) => {
      const angle = (Math.PI * 2 * i) / particleCount;
      const jitter = (i % 2 === 0 ? 1 : -1) * 0.14;
      const finalAngle = angle + jitter;
      const distance = radius * (0.82 + (i % 2) * 0.12);

      return {
        id: `particle-${bubbleId}-${Date.now()}-${i}`,
        bubbleId,
        x: centerX,
        y: centerY,
        size: i % 2 === 0 ? 6 : 5,
        dx: Math.cos(finalAngle) * distance,
        dy: Math.sin(finalAngle) * distance,
        delay: i * 0.01,
      };
    }
  );

  return {
    id: `burst-${bubbleId}-${Date.now()}`,
    bubbleId,
    x: centerX,
    y: centerY,
    size,
    particles,
  };
}

function BubbleShell({
  bubbleId,
  interactive,
}: {
  bubbleId: number;
  interactive: boolean;
}) {
  return (
    <>
      {interactive && (
        <>
          <motion.div
            className="pointer-events-none absolute left-[-16%] top-[52%] h-[16%] w-[40%] -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.00),rgba(255,255,255,0.08),rgba(255,255,255,0.18),rgba(255,255,255,0.00))] blur-md"
            animate={{
              opacity: [0.18, 0.32, 0.18],
              scaleX: [0.95, 1.05, 0.95],
            }}
            transition={{
              duration: 3.8 + bubbleId * 0.15,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {sparkleLayout.map((s, idx) => (
            <motion.span
              key={`${bubbleId}-sparkle-${idx}`}
              className="pointer-events-none absolute rounded-full bg-white/80 blur-[1px]"
              style={{
                left: s.left,
                top: s.top,
                width: s.size,
                height: s.size,
              }}
              animate={{
                opacity: [0.16, 0.62, 0.16],
                scale: [0.9, 1.18, 0.9],
              }}
              transition={{
                duration: 2,
                delay: s.delay + bubbleId * 0.06,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}

          <motion.div
            className="pointer-events-none absolute inset-[-12%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.05)_38%,transparent_72%)] blur-xl"
            animate={{
              opacity: [0.24, 0.4, 0.24],
              scale: [0.99, 1.03, 0.99],
            }}
            transition={{
              duration: 3.4 + bubbleId * 0.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </>
      )}

      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_55%,rgba(180,220,205,0.16)_0%,rgba(255,255,255,0.03)_54%,rgba(255,255,255,0.01)_100%)]" />
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_28%_22%,rgba(255,255,255,0.48),rgba(255,255,255,0.14)_24%,rgba(190,250,225,0.08)_46%,rgba(155,220,255,0.05)_70%,rgba(255,255,255,0.015)_100%)]" />
      <div className="absolute inset-0 rounded-full border border-white/36 bg-white/[0.016] backdrop-blur-[1px]" />
      <div className="absolute inset-[1px] rounded-full border border-white/12" />
      <div className="absolute inset-0 rounded-full opacity-90 [background:conic-gradient(from_12deg,rgba(255,185,205,0.16),rgba(160,230,255,0.14),rgba(195,255,215,0.16),rgba(255,238,175,0.14),rgba(255,185,205,0.16))] [mask:radial-gradient(circle,transparent_70%,black_78%,black_100%)]" />

      {interactive && (
        <div className="absolute inset-[6%] rounded-full border border-white/14" />
      )}

      <div className="absolute left-[11%] top-[9%] h-[32%] w-[28%] rounded-full bg-white/58 blur-md" />
      <div className="absolute left-[17%] top-[15%] h-[14%] w-[34%] rotate-[-18deg] rounded-full border-t border-white/56 opacity-85" />
      <div className="absolute right-[16%] bottom-[14%] h-[10%] w-[10%] rounded-full bg-white/16 blur-md" />
      <div className="absolute inset-[10%] rounded-full [box-shadow:inset_0_-8px_16px_rgba(70,120,95,0.06)]" />
    </>
  );
}

export default function FloatingBubbles({
  bubbles,
  onOpen,
  onHover,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  const [interactiveBubbles, setInteractiveBubbles] = useState<PhysicsBubble[]>(
    []
  );
  const [decorativeBubbles, setDecorativeBubbles] = useState<StaticBubble[]>([]);
  const [popBursts, setPopBursts] = useState<PopBurst[]>([]);
  const [poppingIds, setPoppingIds] = useState<number[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const buildBubbles = () => {
      if (!containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      const mainSize = clamp(width * 0.105, 136, 196);
      const decoSize = clamp(width * 0.06, 74, 108);

      const mouthX = width * 0.73;
      const mouthY = height * 0.43;

      const interactive: PhysicsBubble[] = [
        {
          id: 1,
          x: mouthX - mainSize * 0.62,
          y: mouthY - mainSize * 0.95,
          vx: -0.46,
          vy: -0.2,
          ax: 0,
          ay: 0,
          size: mainSize,
          interactive: true,
          data: bubbles[0],
          depth: 50,
        },
        {
          id: 2,
          x: mouthX - mainSize * 0.15,
          y: mouthY - mainSize * 1.58,
          vx: -0.22,
          vy: -0.34,
          ax: 0,
          ay: 0,
          size: mainSize * 1.02,
          interactive: true,
          data: bubbles[1],
          depth: 50,
        },
        {
          id: 3,
          x: mouthX - mainSize * 1.46,
          y: mouthY - mainSize * 0.24,
          vx: -0.38,
          vy: -0.12,
          ax: 0,
          ay: 0,
          size: mainSize * 0.96,
          interactive: true,
          data: bubbles[2],
          depth: 50,
        },
        {
          id: 4,
          x: mouthX + mainSize * 0.08,
          y: mouthY + mainSize * 0.06,
          vx: -0.26,
          vy: -0.16,
          ax: 0,
          ay: 0,
          size: mainSize,
          interactive: true,
          data: bubbles[3],
          depth: 50,
        },
      ];

      const decorative: StaticBubble[] = [
        {
          id: 101,
          x: width * 0.22,
          y: height * 0.16,
          size: decoSize,
          depth: 25,
          driftDuration: 7.2,
        },
        {
          id: 102,
          x: width * 0.9,
          y: height * 0.12,
          size: decoSize * 0.92,
          depth: 25,
          driftDuration: 8.1,
        },
        {
          id: 103,
          x: width * 0.64,
          y: height * 0.74,
          size: decoSize * 1.02,
          depth: 25,
          driftDuration: 7.6,
        },
      ];

      setInteractiveBubbles(interactive);
      setDecorativeBubbles(decorative);
    };

    buildBubbles();

    const handleResize = () => buildBubbles();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [bubbles]);

  useEffect(() => {
    let lastTime = performance.now();

    const animateFrame = (time: number) => {
      const dtRaw = (time - lastTime) / 16.666;
      const dt = Math.min(Math.max(dtRaw, 0.7), 1.35);
      lastTime = time;

      setInteractiveBubbles((prev) => {
        if (!containerRef.current) return prev;

        const rect = containerRef.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        const noGoZones = [
          {
            x: width * 0.62,
            y: height * 0.34,
            width: width * 0.2,
            height: height * 0.46,
          },
          {
            x: width * 0.11,
            y: height * 0.7,
            width: 170,
            height: 72,
          },
        ];

        const next = prev.map((b) => ({ ...b, ax: 0, ay: 0 }));

        for (let i = 0; i < next.length; i++) {
          const b = next[i];
          const t = time * 0.00045 + b.id * 0.72;
          b.ax += Math.sin(t) * 0.006;
          b.ay += Math.cos(t * 1.05) * 0.006;
        }

        for (let i = 0; i < next.length; i++) {
          const b = next[i];
          const cx = b.x + b.size / 2;
          const cy = b.y + b.size / 2;
          const radius = b.size / 2;

          for (const zone of noGoZones) {
            if (circleRectCollision(cx, cy, radius + 8, zone)) {
              const zoneCx = zone.x + zone.width / 2;
              const zoneCy = zone.y + zone.height / 2;
              const away = normalize(cx - zoneCx, cy - zoneCy);
              b.ax += away.x * 0.11;
              b.ay += away.y * 0.11;
            }
          }
        }

        for (let i = 0; i < next.length; i++) {
          for (let j = i + 1; j < next.length; j++) {
            const a = next[i];
            const b = next[j];

            const ax = a.x + a.size / 2;
            const ay = a.y + a.size / 2;
            const bx = b.x + b.size / 2;
            const by = b.y + b.size / 2;

            const dx = bx - ax;
            const dy = by - ay;
            const dist = Math.hypot(dx, dy) || 0.0001;
            const minDist = a.size / 2 + b.size / 2;

            if (dist < minDist + 3) {
              const n = normalize(dx, dy);
              const strength = (minDist + 3 - dist) * 0.0036;

              a.ax -= n.x * strength;
              a.ay -= n.y * strength;
              b.ax += n.x * strength;
              b.ay += n.y * strength;

              if (dist < minDist) {
                const overlap = minDist - dist;
                a.x -= n.x * overlap * 0.18;
                a.y -= n.y * overlap * 0.18;
                b.x += n.x * overlap * 0.18;
                b.y += n.y * overlap * 0.18;
              }
            }
          }
        }

        for (let i = 0; i < next.length; i++) {
          const b = next[i];

          if (b.x < SAFE_PADDING + 10) b.ax += 0.03;
          if (b.x + b.size > width - SAFE_PADDING - 10) b.ax -= 0.03;
          if (b.y < SAFE_PADDING + 10) b.ay += 0.03;
          if (b.y + b.size > height - SAFE_PADDING - 10) b.ay -= 0.03;
        }

        for (let i = 0; i < next.length; i++) {
          const b = next[i];

          b.vx += b.ax * dt;
          b.vy += b.ay * dt;

          const maxSpeed = 0.76;
          const speed = Math.hypot(b.vx, b.vy);

          if (speed > maxSpeed) {
            const ratio = maxSpeed / speed;
            b.vx *= ratio;
            b.vy *= ratio;
          }

          b.vx *= 0.9975;
          b.vy *= 0.9975;

          b.x += b.vx * dt;
          b.y += b.vy * dt;

          if (b.x < SAFE_PADDING) {
            b.x = SAFE_PADDING;
            b.vx = Math.abs(b.vx) * 0.9;
          }
          if (b.x + b.size > width - SAFE_PADDING) {
            b.x = width - SAFE_PADDING - b.size;
            b.vx = -Math.abs(b.vx) * 0.9;
          }
          if (b.y < SAFE_PADDING) {
            b.y = SAFE_PADDING;
            b.vy = Math.abs(b.vy) * 0.9;
          }
          if (b.y + b.size > height - SAFE_PADDING) {
            b.y = height - SAFE_PADDING - b.size;
            b.vy = -Math.abs(b.vy) * 0.9;
          }
        }

        return next;
      });

      animationRef.current = requestAnimationFrame(animateFrame);
    };

    animationRef.current = requestAnimationFrame(animateFrame);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const popCleanup = useMemo(() => new Map<string, number>(), []);

  useEffect(() => {
    return () => {
      popCleanup.forEach((timeoutId) => window.clearTimeout(timeoutId));
      popCleanup.clear();
    };
  }, [popCleanup]);

  const handleInteractiveBubbleClick = (bubble: PhysicsBubble) => {
    if (!bubble.data) return;

    const centerX = bubble.x + bubble.size / 2;
    const centerY = bubble.y + bubble.size / 2;

    setPoppingIds((prev) => [...prev, bubble.id]);

    const burst = createBurst(bubble.id, centerX, centerY, bubble.size);
    setPopBursts((prev) => [...prev, burst]);

    const cleanupKey = burst.id;
    const cleanupId = window.setTimeout(() => {
      setPopBursts((prev) => prev.filter((b) => b.id !== burst.id));
      setPoppingIds((prev) => prev.filter((id) => id !== bubble.id));
      popCleanup.delete(cleanupKey);
    }, 640);

    popCleanup.set(cleanupKey, cleanupId);

    window.setTimeout(() => {
      onOpen(bubble.data!);
    }, 160);
  };

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-[60] overflow-hidden"
    >
      {decorativeBubbles.map((bubble) => (
        <motion.div
          key={bubble.id}
          className="absolute rounded-full opacity-95"
          style={{
            left: bubble.x,
            top: bubble.y,
            width: bubble.size,
            height: bubble.size,
            zIndex: bubble.depth,
          }}
          animate={{
            y: [0, -6, 0],
            x: [0, 4, 0],
            scale: [1, 1.01, 1],
          }}
          transition={{
            duration: bubble.driftDuration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <BubbleShell bubbleId={bubble.id} interactive={false} />
        </motion.div>
      ))}

      {interactiveBubbles.map((bubble) => {
        const isPopping = poppingIds.includes(bubble.id);

        return (
          <motion.button
            key={bubble.id}
            type="button"
            onClick={() => handleInteractiveBubbleClick(bubble)}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              onHover?.({
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
              });
            }}
            onMouseLeave={() => onHover?.(null)}
            whileHover={!isPopping ? { scale: 1.06, y: -1 } : {}}
            whileTap={!isPopping ? { scale: 0.96 } : {}}
            animate={
              isPopping
                ? {
                    scale: [1, 1.06, 0.84],
                    opacity: [1, 0.76, 0],
                  }
                : {
                    scale: 1,
                    opacity: 1,
                  }
            }
            transition={{
              duration: isPopping ? 0.32 : 0.18,
              ease: isPopping ? [0.22, 1, 0.36, 1] : "easeOut",
            }}
            className="absolute pointer-events-auto flex items-center justify-center rounded-full"
            style={{
              left: bubble.x,
              top: bubble.y,
              width: bubble.size,
              height: bubble.size,
              zIndex: bubble.depth,
            }}
            aria-label={bubble.data?.title ?? "bubble"}
          >
            <motion.div
              className="pointer-events-none absolute inset-[-10%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.08)_36%,transparent_70%)] blur-xl"
              initial={{ opacity: 0.3, scale: 0.97 }}
              whileHover={{ opacity: 0.72, scale: 1.08 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            />

            <motion.div
              className="pointer-events-none absolute inset-[7%] rounded-full border border-white/24"
              initial={{ opacity: 0.14, scale: 0.92 }}
              whileHover={{ opacity: 0.28, scale: 1.02 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            />

            <BubbleShell bubbleId={bubble.id} interactive />
          </motion.button>
        );
      })}

      <AnimatePresence>
        {popBursts.map((burst) => (
          <motion.div
            key={burst.id}
            className="pointer-events-none absolute"
            style={{
              left: burst.x,
              top: burst.y,
              zIndex: 90,
            }}
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80"
              style={{
                width: burst.size * 0.3,
                height: burst.size * 0.3,
                boxShadow: "0 0 18px rgba(255,255,255,0.28)",
              }}
              initial={{ scale: 0.7, opacity: 0.82 }}
              animate={{ scale: 1.6, opacity: 0 }}
              transition={{ duration: 0.36, ease: "easeOut" }}
            />

            {burst.particles.map((particle) => (
              <motion.span
                key={particle.id}
                className="absolute rounded-full border border-white/70 bg-white/25 backdrop-blur-sm"
                style={{
                  width: particle.size,
                  height: particle.size,
                  left: 0,
                  top: 0,
                  boxShadow: "0 0 10px rgba(255,255,255,0.2)",
                }}
                initial={{
                  x: -particle.size / 2,
                  y: -particle.size / 2,
                  opacity: 0.95,
                  scale: 0.95,
                }}
                animate={{
                  x: particle.dx - particle.size / 2,
                  y: particle.dy - particle.size / 2,
                  opacity: 0,
                  scale: 0.58,
                }}
                transition={{
                  duration: 0.46,
                  delay: particle.delay,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            ))}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}