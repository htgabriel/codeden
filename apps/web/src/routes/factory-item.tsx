import { type FactoryItem, pipelineStep, type ReviewVerdict } from "@codeden/contracts";
import { Link } from "@tanstack/react-router";
import {
  Check,
  ChevronLeft,
  CircleDot,
  Factory,
  GitPullRequest,
  Lightbulb,
  ShieldAlert,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { SectionLabel } from "@/components/common/bits";
import { StatusDot } from "@/components/common/status-dot";
import { FollowUps } from "@/components/factory/follow-ups";
import { capText } from "@/components/factory/item-cost";
import {
  CheckRow,
  CostValue,
  EarlierSessions,
  InvestigationCard,
  ItemActions,
  SessionLink,
} from "@/components/factory/item-parts";
import {
  CHECK_LABEL,
  SOURCE_LABEL,
  STAGE_LABEL,
  stepLabel,
  TYPE_LABEL,
} from "@/components/factory/meta";
import { SpecApprovalCard } from "@/components/factory/spec-approval";
import { SpotCheckSection } from "@/components/factory/spot-check-section";
import { Skeleton } from "@/components/ui/skeleton";
import { useFactoryItem } from "@/lib/factory";
import { ago } from "@/lib/format";
import { useTranslation } from "@/lib/i18n";
import { platform } from "@/lib/platform";
import { useProject } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { PageHeader } from "./page-header";

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-right">{children}</span>
    </div>
  );
}

function Verdict({ review, item }: { review: ReviewVerdict; item: FactoryItem }) {
  const { t } = useTranslation();
  const tone =
    review.verdict === "approve"
      ? "text-status-done"
      : review.verdict === "reject"
        ? "text-status-failed"
        : "text-status-waiting";
  const yes = (ok: boolean) =>
    ok ? (
      <Check className="size-3.5 text-status-done" />
    ) : (
      <X className="size-3.5 text-status-failed" />
    );
  return (
    <div className="rounded-xl border border-border bg-card p-4" data-testid="review-verdict">
      <div className="flex items-center gap-2 text-[13px]">
        <span className={cn("font-medium capitalize", tone)}>
          {review.verdict.replace("_", " ")}
        </span>
        <span className="text-2xs text-muted-foreground">
          {t("factoryView.item.byReviewer", {
            provider: item.reviewerProvider ?? t("factoryView.item.anotherProvider"),
          })}
          {item.reviewerNote && ` · ${item.reviewerNote}`}
        </span>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed">{review.summary}</p>
      <div className="mt-3 grid gap-1.5 text-2xs sm:grid-cols-3">
        <span className="flex items-center gap-1.5">
          {yes(review.vision.aligned)} {t("factoryView.item.fitsVision")}
        </span>
        <span className="flex items-center gap-1.5">
          {yes(review.tests.adequate)}{" "}
          {review.tests.notNeeded
            ? t("factoryView.item.noTestsNeeded")
            : t("factoryView.item.testsAdequate")}
        </span>
        <span className="flex items-center gap-1.5">
          {yes(review.security.concerns.length === 0)}{" "}
          {review.security.concerns.length
            ? t("factoryView.item.securityConcerns", { count: review.security.concerns.length })
            : t("factoryView.item.noSecurityConcerns")}
        </span>
      </div>
      {review.security.concerns.length > 0 && (
        <ul className="mt-2 list-disc pl-5 text-2xs text-status-failed">
          {review.security.concerns.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
      )}
      {review.lessons.length > 0 && (
        <div className="mt-3 text-2xs" data-testid="review-lessons">
          <p className="flex items-center gap-1.5 font-medium text-muted-foreground">
            <Lightbulb className="size-3.5" aria-hidden />{" "}
            {item.lessonsNote
              ? t("factoryView.item.lessonsNotKept")
              : t("factoryView.item.lessonsRecorded")}
          </p>
          {item.lessonsNote && (
            <p className="mt-0.5 text-status-waiting" data-testid="review-lessons-note">
              {item.lessonsNote}
            </p>
          )}
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-foreground/85">
            {review.lessons.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * One factory work item (§10.1): its pipeline, merge checks, the review, its sessions and what
 * it cost.
 */
export function FactoryItemPage({ projectId, itemId }: { projectId: string; itemId: string }) {
  const { t } = useTranslation();
  const project = useProject(projectId);
  const { data, error } = useFactoryItem(projectId, itemId);
  if (error) return <div className="p-8 text-sm text-muted-foreground">{error.message}</div>;
  if (!data || !project) return <Skeleton className="m-6 h-64 rounded-xl" />;
  const { item, cost } = data;
  const cap = capText(cost);
  const stage = STAGE_LABEL[item.stage];
  const step = pipelineStep(item);
  const met = new Map(item.review?.criteria.map((c) => [c.criterion, c]) ?? []);

  return (
    <>
      <PageHeader
        icon={<Factory />}
        title={
          <span className="flex items-center gap-1.5">
            <Link
              to="/projects/$projectId"
              params={{ projectId }}
              className="flex items-center text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="size-4" /> {project.name}
            </Link>
            <span className="text-muted-foreground">/</span> {item.title}
          </span>
        }
        meta={
          <span className="flex items-center gap-1.5" data-testid="factory-item-stage">
            <StatusDot tone={stage.tone} /> {stage.label}
            {item.type && (
              <span className="text-muted-foreground">
                · {t("factoryView.item.pipelineOf", { type: TYPE_LABEL[item.type] })} ·{" "}
                {stepLabel(step, item.type)}
              </span>
            )}
          </span>
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto scroll-thin">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-5">
            {(item.reason || item.note) && item.trust !== "untrusted" && (
              <div className="rounded-lg border border-status-waiting/30 bg-status-waiting/[0.06] px-3 py-2 text-2xs">
                {item.reason ?? item.note}
              </div>
            )}
            {item.trust !== "trusted" && (
              <div className="flex items-start gap-2 rounded-lg border border-status-waiting/30 bg-status-waiting/[0.06] px-3 py-2 text-2xs">
                <ShieldAlert className="mt-px size-3.5 shrink-0 text-status-waiting" />
                <span>
                  {item.trust === "untrusted"
                    ? t("factoryView.item.untrusted", {
                        author: item.author ?? t("factoryView.item.unknown"),
                      })
                    : item.admittedBy === "pm"
                      ? t("factoryView.item.admittedByPm")
                      : t("factoryView.item.admittedByYou")}
                </span>
              </div>
            )}
            <section>
              <SectionLabel className="mb-2">{t("factoryView.item.theIssue")}</SectionLabel>
              <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
                {item.summary || item.title}
              </p>
            </section>
            <InvestigationCard item={item} />
            {item.acceptanceCriteria.length > 0 && (
              <section>
                <SectionLabel className="mb-2">{t("factoryView.item.criteria")}</SectionLabel>
                <ul className="space-y-1.5">
                  {item.acceptanceCriteria.map((c) => {
                    const r = met.get(c);
                    return (
                      <li key={c} className="flex items-start gap-2 text-[13px]">
                        {r ? (
                          r.met ? (
                            <Check className="mt-0.5 size-3.5 shrink-0 text-status-done" />
                          ) : (
                            <X className="mt-0.5 size-3.5 shrink-0 text-status-failed" />
                          )
                        ) : (
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                        )}
                        <span>
                          {c}
                          {r?.note && (
                            <span className="block text-2xs text-muted-foreground">{r.note}</span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
            {/* After the spec and its criteria, so you read what you approve before deciding. */}
            <SpecApprovalCard item={item} projectId={projectId} />
            {item.stage !== "ignored" && (
              <section>
                <SectionLabel className="mb-2">
                  {t("factoryView.item.checksPassed", {
                    n: item.checks.filter((c) => c.state === "pass").length,
                  })}
                  {item.checks.some((c) => c.state === "skipped") &&
                    t("factoryView.item.checksSkipped", {
                      n: item.checks.filter((c) => c.state === "skipped").length,
                    })}
                  {item.checks.some((c) => c.state === "fail") &&
                    t("factoryView.item.checksFailed", {
                      n: item.checks.filter((c) => c.state === "fail").length,
                    })}
                </SectionLabel>
                {item.checks.length === 0 ? (
                  <p className="text-2xs text-muted-foreground">
                    {t("factoryView.item.checksLater", {
                      checks: Object.values(CHECK_LABEL).join(", "),
                    })}
                  </p>
                ) : (
                  <div
                    className="overflow-hidden rounded-xl border border-border bg-card"
                    data-testid="item-checks"
                  >
                    {item.checks.map((c) => (
                      <CheckRow key={c.name} check={c} />
                    ))}
                  </div>
                )}
              </section>
            )}
            {item.review && (
              <section>
                <SectionLabel className="mb-2">
                  {t("factoryView.item.independentReview")}
                </SectionLabel>
                <Verdict review={item.review} item={item} />
              </section>
            )}
            <SpotCheckSection item={item} projectId={projectId} />
            <FollowUps item={item} projectId={projectId} mode={project.autonomyMode} />
          </div>
          <aside className="space-y-3 rounded-xl border border-border bg-card p-4 self-start">
            <ItemActions item={item} projectId={projectId} />
            <Fact label={t("factoryView.item.source")}>
              {SOURCE_LABEL[item.source]}
              {item.area && ` · ${item.area.replace("_", " ")}`}
            </Fact>
            <Fact label={t("factoryView.item.pipeline")}>
              {item.type ? TYPE_LABEL[item.type] : t("factoryView.item.notClassified")}
              {item.classification && (
                <span className="text-muted-foreground">
                  {" "}
                  · {t("factoryView.item.by", { who: item.classification.by })}
                </span>
              )}
            </Fact>
            <Fact label={t("factoryView.item.author")}>
              {item.author ? `@${item.author}` : "—"}
              <span className="text-muted-foreground"> · {item.trust}</span>
            </Fact>
            {item.score !== null && (
              <Fact label={t("factoryView.item.priority")}>{item.score.toFixed(2)}</Fact>
            )}
            <Fact label={t("factoryView.item.workKey")}>
              <code className="font-mono text-2xs">{item.workKey}</code>
            </Fact>
            <Fact label={t("factoryView.sheet.issue")}>
              {item.issue ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                  onClick={() => item.issue && platform.openExternal(item.issue.url)}
                >
                  <CircleDot className="size-3" />#{item.issue.number}
                </button>
              ) : (
                "—"
              )}
            </Fact>
            <Fact label={t("factoryView.sheet.pr")}>
              {item.pr ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                  onClick={() => item.pr && platform.openExternal(item.pr.url)}
                >
                  <GitPullRequest className="size-3" />#{item.pr.number} · {item.pr.state}
                </button>
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
            <EarlierSessions item={item} />
            <Fact label={t("factoryView.sheet.reviseRounds")}>{item.attempts}</Fact>
            <Fact label={t("factoryView.sheet.cost")}>
              <CostValue cost={cost} />
            </Fact>
            {cap && <Fact label={t("factoryView.sheet.spendCap")}>{cap}</Fact>}
            {item.mergeSha && (
              <Fact label={t("factoryView.item.mergeCommit")}>
                <code className="font-mono text-2xs">{item.mergeSha.slice(0, 10)}</code>
              </Fact>
            )}
            {item.revertOf && (
              <Fact label={t("factoryView.item.reverts")}>
                <Link
                  to="/projects/$projectId/factory/$itemId"
                  params={{ projectId, itemId: item.revertOf }}
                  className="text-primary hover:underline"
                >
                  {t("factoryView.item.originalItem")}
                </Link>
              </Fact>
            )}
            <div className="space-y-1 border-t border-border pt-3 text-3xs text-muted-foreground">
              <p>{t("factoryView.item.found", { when: ago(item.createdAt) })}</p>
              {item.mergedAt && <p>{t("factoryView.item.merged", { when: ago(item.mergedAt) })}</p>}
              {item.finishedAt && (
                <p>{t("factoryView.item.finished", { when: ago(item.finishedAt) })}</p>
              )}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
