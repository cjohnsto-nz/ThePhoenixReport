import { motion } from 'framer-motion';

export function ParticleBackground() {
  // Create an array of particles with deterministic positions
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: (i * 2.618 * 100) % 100, // Golden ratio distribution
    y: (i * 1.618 * 100) % 100,
    size: 1 + (i % 3),
    duration: 15 + (i % 20),
    delay: (i * 0.5) % 10,
    opacity: 0.05 + (i % 5) * 0.03,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Radial gradient base */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-navy-900/50 via-navy-950 to-navy-950" />

      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-phoenix-500/[0.03] rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-navy-600/[0.05] rounded-full blur-[100px]" />

      {/* Floating particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-phoenix-400"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [p.opacity, p.opacity * 2, p.opacity],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}
