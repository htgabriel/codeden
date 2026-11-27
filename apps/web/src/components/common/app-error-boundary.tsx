import type { ReactNode } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

export function AppErrorBoundary({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <ErrorBoundary
      fallback={
        <main role="alert" className="grid min-h-dvh place-content-center gap-4 p-6 text-center">
          <h1 className="text-xl font-semibold">{t("shell.common.couldNotLoad")}</h1>
          <Button variant="outline" onClick={() => window.location.reload()}>
            {t("shell.configEditor.reload")}
          </Button>
        </main>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
