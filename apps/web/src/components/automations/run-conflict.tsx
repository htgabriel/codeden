import type { ConflictRecord } from "@codeden/contracts";
import { X } from "lucide-react";
import { ConflictCard } from "@/components/project/conflict-card";
import { Button } from "@/components/ui/button";
import { useClient } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import type { RunConflict } from "./use-automation-actions";

/**
 * A run-now that matched running work (§8.4), with the usual wait / skip / join / force
 * choices; the decision retries the run with `conflict`.
 */
export function RunConflictCard({
  conflict,
  projectId,
  onClose,
}: {
  conflict: RunConflict;
  projectId: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const client = useClient();
  const record: ConflictRecord = {
    id: `run:${conflict.automationId}`,
    projectId,
    request: {
      purpose: t("automations.conflict.purpose", { name: conflict.name }),
      workKey: conflict.workKey,
      startedBy: { kind: "user" },
    },
    existing: conflict.existing,
    start: null,
    status: "open",
    resolution: null,
    outcome: null,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
  };
  return (
    <div className="space-y-1" data-testid="run-conflict">
      <ConflictCard
        conflict={record}
        decideWith={async (decision) => {
          const res = await client.automations.run(conflict.automationId, {
            projectId,
            conflict: decision,
          });
          if (res.status === "conflict") throw new Error(t("automations.conflict.stillRunning"));
          return { status: res.status, sessionId: "sessionId" in res ? res.sessionId : null };
        }}
        onResolved={onClose}
      />
      <Button
        size="xs"
        variant="ghost"
        className="text-muted-foreground"
        aria-label={t("automations.conflict.dismissAria")}
        onClick={onClose}
      >
        <X /> {t("automations.conflict.notNow")}
      </Button>
    </div>
  );
}
