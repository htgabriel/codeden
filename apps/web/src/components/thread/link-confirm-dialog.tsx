import type { LinkSafetyModalProps } from "streamdown";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { copyWithFeedback } from "@/lib/copy";
import { useTranslation } from "@/lib/i18n";

/**
 * A link in Markdown shows where it really goes before it opens (#317): agent replies and
 * GitHub text can label a link with anything.
 */
export function LinkConfirmDialog({ isOpen, onClose, onConfirm, url }: LinkSafetyModalProps) {
  const { t } = useTranslation();
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("workbench.link.title")}</DialogTitle>
          <DialogDescription>{t("workbench.link.description")}</DialogDescription>
        </DialogHeader>
        <p className="break-all rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-[12.5px] text-foreground">
          {url}
        </p>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => void copyWithFeedback(url, t("session.actions.linkCopied"))}
          >
            {t("workbench.link.copy")}
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {t("workbench.link.open")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
