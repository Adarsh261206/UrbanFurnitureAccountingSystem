import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "@/components/common/FormLayout";
import { money } from "@/lib/format";
import type { OrderLineInput, Product, ChartOfAccount, Analytical } from "@/types/api";

export type DraftLine = OrderLineInput & { _key: string; tax_rate?: number };

export function newLine(): DraftLine {
  return {
    _key: crypto.randomUUID(),
    product_id: "",
    account_id: "",
    analytical_id: "",
    quantity: 1,
    unit_price: 0,
    tax_rate: 18,
  };
}

export function lineTotal(line: DraftLine): number {
  return (Number(line.quantity) || 0) * (Number(line.unit_price) || 0);
}

export function lineTaxAmount(line: DraftLine): number {
  return lineTotal(line) * ((Number(line.tax_rate) || 0) / 100);
}

/**
 * Shared order-line editor for Sales Order and Customer Invoice forms.
 * UI-only — totals are preview values; the backend recomputes authoritative amounts.
 */
export function OrderLineEditor({
  lines,
  onChange,
  products,
  accounts,
  analyticals,
}: {
  lines: DraftLine[];
  onChange: (lines: DraftLine[]) => void;
  products: Product[];
  accounts: ChartOfAccount[];
  analyticals: Analytical[];
}) {
  const updateLine = (key: string, patch: Partial<DraftLine>) => {
    onChange(lines.map((l) => (l._key === key ? { ...l, ...patch } : l)));
  };

  const onProductChange = (key: string, productId: string) => {
    const product = products.find((p) => p.id === productId);
    updateLine(key, { product_id: productId, unit_price: product ? product.sales_price : 0 });
  };

  const total = lines.reduce((sum, l) => sum + lineTotal(l), 0);
  const taxTotal = lines.reduce((sum, l) => sum + lineTaxAmount(l), 0);
  const showTax = lines.some((l) => Number(l.tax_rate) > 0);

  return (
    <div className="space-y-3">
      {lines.map((l) => (
        <div
          key={l._key}
          className="grid grid-cols-1 gap-3 rounded-md border p-3 sm:grid-cols-12 sm:items-end"
        >
          <div className="sm:col-span-3">
            <Field label="Product" htmlFor={`product-${l._key}`}>
              <Select value={l.product_id} onValueChange={(v) => onProductChange(l._key, v)}>
                <SelectTrigger id={`product-${l._key}`}>
                  <SelectValue placeholder="Product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Account" htmlFor={`account-${l._key}`}>
              <Select
                value={l.account_id}
                onValueChange={(v) => updateLine(l._key, { account_id: v })}
              >
                <SelectTrigger id={`account-${l._key}`}>
                  <SelectValue placeholder="Account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Analytical" htmlFor={`analytical-${l._key}`}>
              <Select
                value={l.analytical_id || "__none"}
                onValueChange={(v) =>
                  updateLine(l._key, { analytical_id: v === "__none" ? "" : v })
                }
              >
                <SelectTrigger id={`analytical-${l._key}`}>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none">None</SelectItem>
                  {analyticals.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
          <div className="sm:col-span-1">
            <Field label="Qty" htmlFor={`qty-${l._key}`}>
              <Input
                id={`qty-${l._key}`}
                type="number"
                min={0}
                step="0.01"
                value={l.quantity}
                onChange={(e) => updateLine(l._key, { quantity: Number(e.target.value) })}
              />
            </Field>
          </div>
          <div className="sm:col-span-1">
            <Field label="Price" htmlFor={`price-${l._key}`}>
              <Input
                id={`price-${l._key}`}
                type="number"
                min={0}
                step="0.01"
                value={l.unit_price}
                onChange={(e) => updateLine(l._key, { unit_price: Number(e.target.value) })}
              />
            </Field>
          </div>
          <div className="sm:col-span-1">
            <Field label="Tax %" htmlFor={`tax-${l._key}`}>
              <Input
                id={`tax-${l._key}`}
                type="number"
                min={0}
                max={100}
                step="0.01"
                value={l.tax_rate ?? 0}
                onChange={(e) => updateLine(l._key, { tax_rate: Number(e.target.value) })}
              />
            </Field>
          </div>
          <div className="flex items-center justify-between gap-2 sm:col-span-2">
            <span className="text-xs text-muted-foreground">
              {money(lineTotal(l))}
              {Number(l.tax_rate) > 0 ? (
                <span className="block text-[11px] text-amber-600">
                  +{money(lineTaxAmount(l))} tax
                </span>
              ) : null}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={lines.length === 1}
              onClick={() => onChange(lines.filter((x) => x._key !== l._key))}
              aria-label="Remove line"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      ))}
      <div className="mt-3 flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange([...lines, newLine()])}
        >
          <Plus className="mr-1 size-4" /> Add line
        </Button>
        <p className="text-sm font-medium text-foreground">
          Estimated total: {money(total + taxTotal)}
          {showTax ? (
            <span className="block text-xs font-normal text-muted-foreground">
              {money(total)} + {money(taxTotal)} GST
            </span>
          ) : null}
        </p>
      </div>
    </div>
  );
}
