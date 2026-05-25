import { getTranslations } from "next-intl/server";
import { BootText } from "@/components/BootText";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { PanelsRoot } from "@/features/panels";
import { Scene, TimeOfDayControl } from "@/features/scene";

export default async function Home() {
  const t = await getTranslations("hero");

  return (
    <main className="relative h-full w-full overflow-hidden bg-charcoal">
      <Scene />

      <BootText />

      <div className="pointer-events-none absolute bottom-4 left-4 z-10 max-w-xs font-mono text-[10px] leading-relaxed text-cream/40">
        {t("instructions")}
      </div>

      <div className="absolute right-4 top-4 z-10 flex items-center gap-4">
        <TimeOfDayControl />
        <LocaleSwitcher />
      </div>

      <PanelsRoot />
    </main>
  );
}
