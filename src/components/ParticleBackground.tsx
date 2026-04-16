import { motion } from 'framer-motion';

function emberNoise(seed: number) {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
}

export function ParticleBackground() {
  const particles = Array.from({ length: 56 }, (_, i) => ({
    id: i,
    x: emberNoise(i + 1) * 100,
    originY: 82 + emberNoise(i + 17) * 24,
    size: 1.5 + emberNoise(i + 29) * 3.5,
    duration: 5 + emberNoise(i + 37) * 6,
    delay: emberNoise(i + 43) * 8,
    opacity: 0.14 + emberNoise(i + 53) * 0.22,
    drift: (emberNoise(i + 61) - 0.5) * 44,
    rise: 420 + emberNoise(i + 71) * 420,
    blur: emberNoise(i + 83) * 2.5,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Controls-page atmospheric base */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at top left, rgba(255,133,17,0.16), transparent 32%), radial-gradient(circle at bottom right, rgba(54,104,252,0.14), transparent 30%), #050812',
        }}
      />

      {/* Warm fire glow near the horizon */}
      <div className="absolute right-[-10%] bottom-[-22%] h-[26vh] w-[40vw] rounded-full bg-phoenix-400/[0.035] blur-[130px]" />

      {/* Floating particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-phoenix-400/85"
          style={{
            left: `${p.x}%`,
            top: `${p.originY}%`,
            width: p.size,
            height: p.size * 1.8,
            filter: `blur(${p.blur}px)`,
            boxShadow: `0 0 ${p.size * 10}px rgba(255,160,56,0.34)`,
          }}
          animate={{
            y: [12, -p.rise],
            x: [0, p.drift * 0.45, p.drift],
            opacity: [0, p.opacity, p.opacity * 0.55, 0],
            scale: [0.35, 1, 0.72, 0.25],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear',
            times: [0, 0.16, 0.65, 1],
          }}
        />
      ))}
    </div>
  );
}
