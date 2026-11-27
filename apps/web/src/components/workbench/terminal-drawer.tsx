import { Plus, SquareTerminal, X } from "lucide-react";
import { useState } from "react";
import { TerminalView } from "@/components/on-demand";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useLayoutStore } from "@/stores/layout";

/** Optional bottom terminal drawer with multiple tabs (§13). */
export function TerminalDrawer({ sessionId }: { sessionId: string | null }) {
  const { t } = useTranslation();
  const toggle = useLayoutStore((s) => s.toggleDrawer);
  const [tabs, setTabs] = useState([1]);
  const [active, setActive] = useState(1);

  return (
    <div className="flex h-full flex-col bg-panel">
      <div className="flex h-8 shrink-0 items-center gap-1 border-b border-border px-2">
        {tabs.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setActive(n)}
            className={cn(
              "flex h-6 items-center gap-1.5 rounded-md px-2 text-2xs text-muted-foreground hover:text-foreground",
              active === n && "bg-accent text-foreground",
            )}
          >
            <SquareTerminal className="size-3" /> {t("workbench.terminal.tab", { n })}
          </button>
        ))}
        <Button
          variant="ghost"
          size="icon-xs"
          className="text-muted-foreground"
          aria-label={t("workbench.terminal.new")}
          onClick={() => {
            const next = Math.max(...tabs) + 1;
            setTabs([...tabs, next]);
            setActive(next);
          }}
        >
          <Plus />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          className="ml-auto text-muted-foreground"
          aria-label={t("workbench.terminal.closeDrawer")}
          onClick={() => toggle(false)}
        >
          <X />
        </Button>
      </div>
      <div className="relative min-h-0 flex-1">
        {tabs.map((n) => (
          <div key={n} className={cn("absolute inset-0", active !== n && "invisible")}>
            <TerminalView sessionId={sessionId} slot={`drawer-${n}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
