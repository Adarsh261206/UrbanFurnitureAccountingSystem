import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import { money } from "@/lib/format";
import type { Product, ChartOfAccount, Analytical } from "@/types/api";

export interface EditableLine {
  product_id: string;
  account_id: string;
  analytical_id: string;
  quantity: string;
  unit_price: string;
}

export function emptyLine(): EditableLine {
  return { product_id: "", account_id: "", analytical_id: "", quantity: "1", unit_price: "" };
}

/** Shared purchase-side line editor (PO / Bill). A7 field names on submit. */
export function LineEditor({
  lines,
  onChange,
  products,
  accounts,
  analyticals,
}: {
  lines: EditableLine[];
  onChange: (lines: EditableLine[]) => void;
  products: Product[];
  accounts: ChartOfAccount[];
  analyticals: Analytical[];
}) {
  const updateLine = (index: number, patch: Partial<EditableLine>) => {
    const next = lines.slice();
    next[index] = { ...next[index]!, ...patch };
    onChange(next);
  };

  const addLine = () => onChange([...lines, emptyLine()]);
  const removeLine = (index: number) => onChange(lines.filter((_, i) => i !== index));

  const lineTotal = (line: EditableLine) => {
    const qty = Number(line.quantity) || 0;
    const price = Number(line.unit_price) || 0;
    return qty * price;
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Product</th>
              <th className="px-3 py-2 text-left">Account</th>
              <th className="px-3 py-2 text-left">Analytical</th>
              <th className="px-3 py-2 text-right">Qty</th>
              <th className="px-3 py-2 text-right">Unit price</th>
              <th className="px-3 py-2 text-right">Line total</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <tr key={index} className="border-t border-border">
                <td className="px-3 py-2">
                  <Select
                    value={line.product_id}
                    onValueChange={(value) => {
                      const product = products.find((p) => p.id === value);
                      updateLine(index, {
                        product_id: value,
                        unit_price: product ? String(product.cost) : line.unit_price,
                      });
                    }}
                  >
                    <SelectTrigger className="h-9 w-48">
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-3 py-2">
                  <Select
                    value={line.account_id}
                    onValueChange={(value) => updateLine(index, { account_id: value })}
                  >
                    <SelectTrigger className="h-9 w-44">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-3 py-2">
                  <Select
                    value={line.analytical_id || "none"}
                    onValueChange={(value) =>
                      updateLine(index, { analytical_id: value === "none" ? "" : value })
                    }
                  >
                    <SelectTrigger className="h-9 w-40">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {analyticals.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.quantity}
                    onChange={(e) => updateLine(index, { quantity: e.target.value })}
                    className="h-9 w-20 text-right"
                  />
                </td>
                <td className="px-3 py-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={line.unit_price}
                    onChange={(e) => updateLine(index, { unit_price: e.target.value })}
                    className="h-9 w-28 text-right"
                  />
                </td>
                <td className="px-3 py-2 text-right font-medium tabular-nums">
                  {money(lineTotal(line))}
                </td>
                <td className="px-3 py-2 text-right">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={lines.length <= 1}
                    onClick={() => removeLine(index)}
                    aria-label="Remove line"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={addLine}>
        <Plus className="mr-1 size-4" /> Add line
      </Button>
    </div>
  );
}
