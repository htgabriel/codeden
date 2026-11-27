import { KeyRound, TerminalSquare } from "lucide-react";
import { Trans, useTranslation } from "@/lib/i18n";
import { Logo } from "./logo";

const code = <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs" />;

/**
 * Shown after a 401: this browser has no valid CodeDen cookie. The token only arrives through
 * the authenticated link the CLI prints and opens (§15), so point the user back to it.
 */
export function UnauthorizedScreen() {
  const { t } = useTranslation();
  return (
    <div className="relative flex min-h-dvh items-center justify-center bg-background px-6 text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(50%_100%_at_50%_0%,var(--glow),transparent)]"
      />
      <div className="relative w-full max-w-md text-center" data-testid="unauthorized">
        <Logo className="mx-auto mb-5 size-12" />
        <h1 className="text-xl font-semibold tracking-tight">{t("shell.unauthorized.title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("shell.unauthorized.body")}</p>
        <div className="mt-6 space-y-2 rounded-xl border border-border bg-card p-4 text-left text-[13px]">
          <div className="flex items-start gap-2.5">
            <TerminalSquare className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              <Trans i18nKey="shell.unauthorized.rerun" components={{ code }} />
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <KeyRound className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              <Trans i18nKey="shell.unauthorized.link" components={{ code }} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
