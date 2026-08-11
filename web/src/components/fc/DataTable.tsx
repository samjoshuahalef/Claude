import React from "react";
import { cn } from "./cn";

export type Column<T> = {
  key: string;
  header: string;
  /** Numbers right-align and get tabular figures so columns scan vertically. */
  numeric?: boolean;
  width?: string;
  render: (row: T) => React.ReactNode;
};

/**
 * The hairline grid applied to dense data. Rows are 36/32px rather than the
 * 40px nav row — a dealer scanning 200 listings needs the density.
 */
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  density = "comfortable",
  className,
}: {
  columns: Array<Column<T>>;
  rows: T[];
  getRowKey: (row: T) => string;
  density?: "comfortable" | "compact";
  className?: string;
}) {
  const rowHeight =
    density === "compact" ? "h-(--fc-row-compact)" : "h-(--fc-row-comfortable)";

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-1 border-border-faint">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                style={column.width ? { width: column.width } : undefined}
                className={cn(
                  "h-(--fc-row-compact) px-12 text-label-x-small whitespace-nowrap text-black-alpha-56",
                  column.numeric ? "text-right" : "text-left",
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={getRowKey(row)}
              className="border-b-1 border-border-faint transition last:border-b-0 hover:bg-background-lighter"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    rowHeight,
                    "px-12 text-body-small whitespace-nowrap text-accent-black",
                    column.numeric && "tnum text-right",
                  )}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
