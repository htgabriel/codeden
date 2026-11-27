import type { SecretKey } from "@codeden/contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClient } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";

export const secretsKey = ["secrets"] as const;

/** Which keychain secrets are set (values are never sent to the browser). */
export function useSecrets() {
  const client = useClient();
  return useQuery({ queryKey: secretsKey, queryFn: () => client.secrets.status() });
}

/**
 * An API key field backed by the OS keychain (`/api/secrets`). Shows whether a key is stored,
 * replaces it on save and can remove it. `onChange` runs after either (e.g. re-check engines).
 */
export function SecretField({
  secret,
  label,
  onChange,
}: {
  secret: SecretKey;
  label: string;
  onChange?: () => void;
}) {
  const { t } = useTranslation();
  const client = useClient();
  const queryClient = useQueryClient();
  const status = useSecrets();
  const isSet = status.data?.keys.find((k) => k.key === secret)?.set ?? false;
  const [value, setValue] = useState("");
  const done = () => {
    void queryClient.invalidateQueries({ queryKey: secretsKey });
    onChange?.();
  };
  const save = useMutation({
    mutationFn: () => client.secrets.set(secret, value.trim()),
    onSuccess: () => {
      setValue("");
      done();
      toast.success(t("prefs.secret.saved", { label }), {
        description:
          status.data?.backend === "memory" ? t("prefs.secret.memory") : t("prefs.secret.keychain"),
      });
    },
    onError: (e) => toast.error(t("prefs.secret.notSaved", { label }), { description: e.message }),
  });
  const remove = useMutation({
    mutationFn: () => client.secrets.remove(secret),
    onSuccess: () => {
      done();
      toast.success(t("prefs.secret.removed", { label }));
    },
  });
  return (
    <div className="flex w-80 items-center gap-2">
      <Input
        type="password"
        autoComplete="off"
        aria-label={label}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={isSet ? t("prefs.secret.stored") : t("prefs.secret.paste")}
        className="h-8 font-mono text-xs"
      />
      <Button
        size="sm"
        variant="outline"
        disabled={!value.trim() || save.isPending}
        onClick={() => save.mutate()}
      >
        <KeyRound /> {t("prefs.secret.save")}
      </Button>
      {isSet && (
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={t("prefs.secret.remove", { label })}
          onClick={() => remove.mutate()}
        >
          <Trash2 />
        </Button>
      )}
    </div>
  );
}
