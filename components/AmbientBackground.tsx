export function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden select-none"
    >
      {/* Primary emerald floating orb */}
      <div className="animate-ambient-slow absolute -top-24 -left-20 size-[32rem] rounded-full bg-emerald-500/14 blur-[90px] will-change-transform sm:size-[44rem] sm:blur-[130px]" />

      {/* Secondary cyan/ice floating orb */}
      <div className="animate-ambient-reverse absolute top-1/4 -right-24 size-[28rem] rounded-full bg-sky-400/10 blur-[80px] will-change-transform sm:size-[40rem] sm:blur-[120px]" />

      {/* Tertiary deep emerald breathing glow */}
      <div className="animate-ambient-pulse absolute top-2/3 left-1/10 size-[30rem] rounded-full bg-emerald-600/8 blur-[100px] will-change-transform sm:size-[42rem] sm:blur-[140px]" />

      {/* Specular overhead glass refraction crest */}
      <div className="absolute inset-x-0 top-0 h-96 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(16,185,129,0.12),transparent_70%)]" />

      {/* Micro-noise glass texture — avoids OLED color banding and adds physical glass tactile quality */}
      <div
        className="absolute inset-0 opacity-[0.028] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Edge vignette to ground the page in deep obsidian */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,#09090b_95%)]" />
    </div>
  );
}
