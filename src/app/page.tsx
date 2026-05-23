import { Scene } from "@/features/scene";

export default function Home() {
  return (
    <main className="relative h-full w-full overflow-hidden bg-charcoal">
      <Scene />

      <div className="pointer-events-none absolute left-4 top-4 z-10 font-mono text-xs uppercase tracking-[0.2em] text-cream/70">
        café zack · booting…
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 z-10 max-w-xs font-mono text-[10px] leading-relaxed text-cream/40">
        a portfolio simulation in algiers · drag to orbit · v0.0.1
      </div>
    </main>
  );
}
