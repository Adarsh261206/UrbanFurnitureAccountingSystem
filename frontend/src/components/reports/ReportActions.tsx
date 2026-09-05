import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { errorMessage } from "@/lib/api/errors";

/**
 * Back + Print controls for the P&L and Balance Sheet screens
 * (23_MATRIX §15 / §16). Back navigates to /dashboard; Print downloads the
 * backend-generated PDF — nothing is rendered or computed client-side.
 */
export function BackToDashboardButton() {
  const navigate = useNavigate();
  return (
    <Button variant="outline" onClick={() => void navigate({ to: "/dashboard" })}>
      <ArrowLeft className="size-4" aria-hidden />
      Back
    </Button>
  );
}

export function PrintReportButton({
  fetchPdf,
  fileName,
}: {
  fetchPdf: () => Promise<Blob>;
  fileName: string;
}) {
  const [pending, setPending] = useState(false);

  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          const blob = await fetchPdf();
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(url);
          toast.success("Report downloaded");
        } catch (e) {
          toast.error(errorMessage(e));
        } finally {
          setPending(false);
        }
      }}
    >
      <Printer className="size-4" aria-hidden />
      {pending ? "Preparing…" : "Print"}
    </Button>
  );
}
