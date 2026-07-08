import { cn } from "@/lib/cn";

/**
 * The accessible twin behind every chart (docs/10 §6): the same data as a
 * real <table>. Screen readers land here via the Chart/Table tabs.
 */

export interface ChartTableColumn<Row> {
  key: string;
  label: string;
  format: (row: Row) => string;
  align?: "left" | "right";
}

export function ChartTable<Row>({
  caption,
  columns,
  rows,
  className,
}: {
  caption: string;
  columns: ChartTableColumn<Row>[];
  rows: Row[];
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full min-w-[480px] border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-2">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={cn(
                  "px-3 py-2 font-medium",
                  c.align === "right" && "text-right",
                )}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-line/60 last:border-0">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn(
                    "px-3 py-2 tabular-nums",
                    c.align === "right" && "text-right",
                  )}
                >
                  {c.format(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
