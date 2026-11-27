import { passwordProblem } from "@codeden/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, KeyRound, Sparkles } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClient } from "@/lib/api";
import { copyWithFeedback } from "@/lib/copy";
import { useTranslation } from "@/lib/i18n";

export const NETWORK_KEY = ["network"] as const;

/** A generated passphrase, shown once with a copy button. */
function GeneratedPassword({ value, onDone }: { value: string; onDone: () => void }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  return (
    <div
      className="rounded-lg border border-primary/30 bg-primary/[0.06] p-3"
      data-testid="generated-password"
    >
      <div className="text-2xs font-medium text-primary">
        {t("prefs.network.password.newPassword")}
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <code className="min-w-0 flex-1 font-mono text-[15px] break-all select-all">{value}</code>
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            void copyWithFeedback(value, t("prefs.network.password.copiedToast")).then((ok) =>
              setCopied(ok),
            )
          }
        >
          {copied ? <Check /> : <Copy />}{" "}
          {copied ? t("prefs.network.password.copied") : t("prefs.network.password.copy")}
        </Button>
      </div>
      <p className="mt-2 text-2xs text-muted-foreground">
        {t("prefs.network.password.saveIt")}{" "}
        <button type="button" className="underline underline-offset-2" onClick={onDone}>
          {t("prefs.network.password.saved")}
        </button>
      </p>
    </div>
  );
}

/** Set or generate the network access password (this computer only). */
export function NetworkPassword({ passwordSet }: { passwordSet: boolean }) {
  const { t } = useTranslation();
  const client = useClient();
  const queryClient = useQueryClient();
  const [password, setPassword] = useState("");
  const [generated, setGenerated] = useState<string | null>(null);
  const problem = password ? passwordProblem(password) : null;

  const save = useMutation({
    mutationFn: (input: { password: string } | { generate: true }) =>
      client.network.setPassword(input),
    onSuccess: (res) => {
      queryClient.setQueryData(NETWORK_KEY, res.status);
      setPassword("");
      setGenerated(res.generated);
      toast.success(
        passwordSet
          ? t("prefs.network.password.changedToast")
          : t("prefs.network.password.setToast"),
      );
    },
    onError: (e) => toast.error(t("prefs.network.password.notSaved"), { description: e.message }),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!password || problem) return;
    save.mutate({ password });
  }

  return (
    <div className="space-y-3">
      {generated && <GeneratedPassword value={generated} onDone={() => setGenerated(null)} />}
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="password"
          autoComplete="new-password"
          placeholder={
            passwordSet
              ? t("prefs.network.password.newPlaceholder")
              : t("prefs.network.password.choosePlaceholder")
          }
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-label={t("prefs.network.password.label")}
          aria-invalid={problem ? true : undefined}
          className="sm:flex-1"
          data-testid="network-password-input"
        />
        <div className="flex gap-2">
          <Button
            type="submit"
            className="flex-1 sm:flex-none"
            disabled={!password || Boolean(problem) || save.isPending}
          >
            <KeyRound />{" "}
            {passwordSet ? t("prefs.network.password.change") : t("prefs.network.password.set")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1 sm:flex-none"
            disabled={save.isPending}
            onClick={() => save.mutate({ generate: true })}
          >
            <Sparkles /> {t("prefs.network.password.generate")}
          </Button>
        </div>
      </form>
      <p
        className={problem ? "text-2xs text-destructive" : "text-2xs text-muted-foreground"}
        role={problem ? "alert" : undefined}
      >
        {/* passwordProblem's text is shared with the server and stays in English. */}
        {problem ?? t("prefs.network.password.rule")}
        {!problem && passwordSet && t("prefs.network.password.signsOut")}
      </p>
    </div>
  );
}
