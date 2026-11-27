import type { FactoryItem } from "@codeden/contracts";
import { Link } from "@tanstack/react-router";
import { Check, CircleDot, ExternalLink, GitPullRequest } from "lucide-react";
import type { ReactNode } from "react";
import { SectionLabel } from "@/components/common/bits";
import { capText } from "@/components/factory/item-cost";
import { CheckRow, CostValue, SessionLink } from "@/components/factory/item-parts";
import { PR_STATE_LABEL, STAGE_LABEL, stepLabel } from "@/components/factory/meta";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useFactoryItem } from "@/lib/factory";
import { ago } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";
import { platform } from "@/lib/platform";
import { cn } from "@/lib/utils";
import { NeedActions } from "./need-actions";
import { cardNumber, cardStateLabel, type ViewCard } from "./stages";
import { stepTrail } from "./step-trail";
import { StateMarker, TypeBadge } from "./view-card";

function Trail({ item, card }: { item: FactoryItem; card: ViewCard }) {
  const { t } = useTranslation();
  const trail = stepTrail({ type: item.type, step: card.item.step, stage: card.item.stage });
  return (
    <ol className="flex flex-col gap-1" aria-label={t("factoryView.sheet.pipelineSteps")}>
      {trail.map(({ step, mark, note }) => (
        <li
          key={step}
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1 text-[12.5px]",
            mark === "current" && "bg-primary/10 font-medium text-foreground",
            mark === "next" && "text-muted-foreground",
          )}
          aria-current={mark === "current" ? "step" : undefined}
        >
          {mark === "done" ? (
            <Check className="size-3.5 text-status-done" aria-hidden />
          ) : (
            <span
              aria-hidden
              className={cn(
                "mx-[3px] size-2 rounded-full",
                mark === "current" ? "bg-primary" : "border border-muted-foreground/50",
              )}
            />
          )}
          <span>
            {stepLabel(step, item.type)}
            {note && (
              <span className="block text-2xs font-normal text-muted-foreground">{note}</span>
            )}
          </span>
          {mark === "current" && (
            <span className="sr-only">{t("factoryView.sheet.currentStep")}</span>
          )}
        </li>
      ))}
    </ol>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right">{children}</span>
    </div>
  );
}

function ExternalButton({ url, children }: { url: string; children: ReactNode }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 text-primary hover:underline"
      onClick={() => platform.openExternal(url)}
    >
      {children}
    </button>
  );
}

function Body({ projectId, card }: { projectId: string; card: ViewCard }) {
  const { t } = useTranslation();
  const { data, error } = useFactoryItem(projectId, card.item.id);
  if (error) return <p className="px-4 text-2xs text-muted-foreground">{error.message}</p>;
  if (!data) return <Skeleton className="mx-4 h-48 rounded-xl" />;
  const { item } = data;
  // The item's own figure; the card's (from the status) if the item came without one.
  const cost = data.cost ?? card.item.cost;
  const cap = capText(cost);
  const passed = item.checks.filter((c) => c.state === "pass").length;
  // A rebuild has no PR of its own until it opens one: the factory still owns the original.
  const pr = item.pr ?? card.pr?.pr ?? card.item.ownedPr;
  return (
    <div className="flex flex-col gap-5 px-4 pb-6">
      {(item.reason || card.activity) && (
        <p
          className={cn(
            "rounded-lg border px-3 py-2 text-2xs",
            card.state === "failed"
              ? "border-status-failed/30 bg-status-failed/[0.06]"
              : card.state === "person"
                ? "border-status-waiting/30 bg-status-waiting/[0.06]"
                : "border-border bg-surface",
          )}
        >
          {card.activity}
        </p>
      )}
      {card.need && (
        <NeedActions
          card={card}
          projectId={projectId}
          className="rounded-lg border border-status-waiting/30 bg-status-waiting/[0.06] px-3 py-2"
        />
      )}
      <section>
        <SectionLabel className="mb-1.5">{t("factoryView.sheet.steps")}</SectionLabel>
        <Trail item={item} card={card} />
      </section>
      <section className="space-y-2 rounded-xl border border-border bg-card p-3">
        <Fact label={t("factoryView.sheet.issue")}>
          {item.issue ? (
            <ExternalButton url={item.issue.url}>
              <CircleDot className="size-3" />#{item.issue.number}
            </ExternalButton>
          ) : (
            "—"
          )}
        </Fact>
        <Fact label={!item.pr && pr ? t("factoryView.sheet.prRebuilt") : t("factoryView.sheet.pr")}>
          {pr ? (
            <ExternalButton url={pr.url}>
              <GitPullRequest className="size-3" />#{pr.number}
              {card.pr?.pr.number === pr.number
                ? ` · ${PR_STATE_LABEL[card.pr.state].label}`
                : ` · ${pr.state}`}
            </ExternalButton>
          ) : (
            "—"
          )}
        </Fact>
        <Fact label={t("factoryView.sheet.builder")}>
          <SessionLink
            id={item.builderSessionId}
            label={item.builderProvider ?? t("factoryView.sheet.session")}
          />
        </Fact>
        <Fact label={t("factoryView.sheet.reviewer")}>
          <SessionLink
            id={item.reviewerSessionId}
            label={item.reviewerProvider ?? t("factoryView.sheet.session")}
          />
        </Fact>
        <Fact label={t("factoryView.sheet.stage")}>{STAGE_LABEL[item.stage].label}</Fact>
        {item.attempts > 0 && (
          <Fact label={t("factoryView.sheet.reviseRounds")}>{item.attempts}</Fact>
        )}
        <Fact label={t("factoryView.sheet.cost")}>
          <CostValue cost={cost} />
        </Fact>
        {cap && <Fact label={t("factoryView.sheet.spendCap")}>{cap}</Fact>}
        <Fact label={t("factoryView.sheet.inThisStep")}>{ago(card.since)}</Fact>
      </section>
      <section>
        <SectionLabel className="mb-1.5">
          {t("factoryView.sheet.mergeChecks")}
          {item.checks.length > 0 &&
            ` · ${t("factoryView.sheet.passedOf", { passed, total: item.checks.length })}`}
        </SectionLabel>
        {item.checks.length === 0 ? (
          <p className="text-2xs text-muted-foreground">
            {item.pr ? t("factoryView.sheet.noChecks") : t("factoryView.sheet.checksLater")}
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {item.checks.map((c) => (
              <CheckRow key={c.name} check={c} />
            ))}
          </div>
        )}
      </section>
      {item.review && (
        <section>
          <SectionLabel className="mb-1.5">{t("factoryView.sheet.review")}</SectionLabel>
          <p className="text-2xs leading-relaxed">
            <span className="font-medium capitalize">{item.review.verdict.replace("_", " ")}</span>
            {" · "}
            {item.review.summary.length > 400
              ? `${item.review.summary.slice(0, 400)}…`
              : item.review.summary}
          </p>
        </section>
      )}
      <Link
        to="/projects/$projectId/factory/$itemId"
        params={{ projectId, itemId: item.id }}
        className="inline-flex items-center gap-1 text-2xs text-primary hover:underline"
      >
        <ExternalLink className="size-3" /> {t("factoryView.sheet.openFull")}
      </Link>
    </div>
  );
}

/** A card's details, beside the pipeline: its steps, PR, checks and sessions. */
export function ItemSheet({
  projectId,
  card,
  onClose,
}: {
  projectId: string;
  card: ViewCard | null;
  onClose: () => void;
}) {
  return (
    <Sheet open={card !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="gap-0 overflow-y-auto scroll-thin data-[side=right]:w-full data-[side=right]:sm:max-w-md"
        data-testid="factory-view-sheet"
      >
        {card && (
          <>
            <SheetHeader className="pb-3">
              <SheetTitle className="flex items-start gap-2 pr-6 text-[15px] leading-snug">
                <span className="shrink-0 font-mono whitespace-nowrap text-muted-foreground">
                  {cardNumber(card.item)}
                </span>
                <span>{card.item.title}</span>
              </SheetTitle>
              <SheetDescription className="flex items-center gap-1.5 text-2xs">
                <StateMarker state={card.state} />
                {cardStateLabel(card)}
                <TypeBadge type={card.item.type} />
              </SheetDescription>
            </SheetHeader>
            <Body projectId={projectId} card={card} />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
