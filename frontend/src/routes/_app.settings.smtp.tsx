import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Mail, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { RequireRole } from "@/components/guards/RouteGuards";
import { PageHeader } from "@/components/common/PageHeader";
import { ErrorState, LoadingState } from "@/components/common/States";
import {
  FormSection,
  Field,
  FormGrid,
  FormActions,
  ErrorBanner,
} from "@/components/common/FormLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { settingsService, type SmtpSettings } from "@/services/settingsService";
import { errorMessage } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/settings/smtp")({
  head: () => ({
    meta: [
      { title: "SMTP Settings — Urban Furniture Accounting" },
      { name: "description", content: "Mail server configuration for Urban Furniture." },
      { property: "og:title", content: "SMTP Settings — Urban Furniture Accounting" },
      { property: "og:description", content: "Mail server configuration." },
    ],
  }),
  component: () => (
    <RequireRole roles={["admin"]}>
      <Page />
    </RequireRole>
  ),
});

function Page() {
  const query = useQuery({
    queryKey: ["settings", "smtp"],
    queryFn: () => settingsService.getSmtp(),
  });

  const [form, setForm] = useState<SmtpSettings | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (query.data) setForm(query.data);
  }, [query.data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      settingsService.updateSmtp({
        host: form?.host,
        port: form?.port,
        secure: form?.secure,
        user: form?.user,
        pass: form?.pass,
        from: form?.from,
      }),
    onSuccess: (updated) => {
      toast.success("SMTP settings saved");
      setForm(updated);
    },
    onError: (error) => setFormError(errorMessage(error)),
  });

  const testMutation = useMutation({
    mutationFn: () => settingsService.testSmtp(testEmail.trim()),
    onSuccess: (res) => {
      toast.success(res.message);
      if (res.dry_run) {
        toast.info("Dry-run: check the server console for the logged email");
      }
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  if (query.isLoading) return <LoadingState label="Loading settings" />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  if (!form) return null;

  function set<K extends keyof SmtpSettings>(key: K, value: SmtpSettings[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="SMTP Settings"
        crumbs={[{ label: "Administration" }, { label: "SMTP Settings" }]}
        description="Configure the mail server used for approvals, password resets and notifications."
      />
      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          setFormError(null);
          saveMutation.mutate();
        }}
        noValidate
      >
        <FormSection title="Mail server">
          <ErrorBanner message={formError} />
          <FormGrid>
            <Field label="SMTP host" htmlFor="smtp_host" hint="e.g. smtp.gmail.com">
              <Input
                id="smtp_host"
                value={form.host}
                onChange={(e) => set("host", e.target.value)}
                placeholder="smtp.gmail.com"
              />
            </Field>
            <Field label="Port" htmlFor="smtp_port" hint="587 (STARTTLS) or 465 (SSL)">
              <Input
                id="smtp_port"
                type="number"
                min={1}
                max={65535}
                value={form.port}
                onChange={(e) => set("port", Number(e.target.value))}
              />
            </Field>
            <Field
              label="Username"
              htmlFor="smtp_user"
              hint="Full email address for most providers"
            >
              <Input
                id="smtp_user"
                value={form.user}
                onChange={(e) => set("user", e.target.value)}
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Password" htmlFor="smtp_pass" hint="App password — never shared">
              <Input
                id="smtp_pass"
                type="password"
                value={form.pass}
                onChange={(e) => set("pass", e.target.value)}
                placeholder={form.has_pass ? "•••••••• (saved)" : ""}
              />
            </Field>
            <Field label="From address" htmlFor="smtp_from" hint="Shown as the sender">
              <Input
                id="smtp_from"
                value={form.from}
                onChange={(e) => set("from", e.target.value)}
                placeholder="Urban Furniture <no-reply@example.com>"
              />
            </Field>
            <Field label="Secure connection (SSL/TLS)" htmlFor="smtp_secure">
              <label className="flex items-center gap-2 text-[13px]">
                <button
                  type="button"
                  role="switch"
                  aria-checked={form.secure}
                  onClick={() => set("secure", !form.secure)}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
                    form.secure ? "bg-primary" : "bg-input",
                  )}
                >
                  <span
                    className={cn(
                      "inline-block size-4 transform rounded-full bg-white shadow transition-transform",
                      form.secure ? "translate-x-6" : "translate-x-1",
                    )}
                  />
                </button>
                <span className="text-muted-foreground">
                  {form.secure ? "Yes (port 465)" : "No (port 587)"}
                </span>
              </label>
            </Field>
          </FormGrid>
          <FormActions>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Save className="size-4" aria-hidden />
              )}
              Save settings
            </Button>
          </FormActions>
        </FormSection>

        <FormSection title="Test email">
          <p className="mb-4 text-sm text-muted-foreground">
            Send a test message to verify the configuration. If no SMTP is configured the email is
            logged to the server console instead (dry-run).
          </p>
          <div className="flex max-w-md items-end gap-2">
            <div className="flex-1">
              <label
                htmlFor="test_to"
                className="mb-1 block text-xs font-medium text-muted-foreground"
              >
                Recipient
              </label>
              <Input
                id="test_to"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={!testEmail.trim() || testMutation.isPending}
              onClick={() => testMutation.mutate()}
            >
              {testMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Send className="size-4" aria-hidden />
              )}
              Send test
            </Button>
          </div>
        </FormSection>
      </form>
    </div>
  );
}
