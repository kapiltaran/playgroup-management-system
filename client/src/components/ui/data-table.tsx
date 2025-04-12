import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DataTableProps<T> {
  data: T[];
  columns: {
    accessorKey: string;
    header: string;
    cell?: (item: T) => React.ReactNode;
  }[];
  isLoading?: boolean;
  searchKey?: string;
  searchFunction?: (item: T, query: string) => boolean;
  className?: string;
  mobileDataLabels?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  isLoading = false,
  searchKey,
  searchFunction,
  className,
  mobileDataLabels = true,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter data based on search query
  const filteredData = searchQuery
    ? data.filter((item) => {
        if (searchFunction) {
          // Use custom search function if provided
          return searchFunction(item, searchQuery);
        } else if (searchKey) {
          // Use default search if only searchKey is provided
          return String(item[searchKey])
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        }
        return true;
      })
    : data;

  return (
    <div className="w-full">
      {searchKey && (
        <div className="flex items-center mb-4">
          <Input
            placeholder={`Search by ${searchKey}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>
      )}

      <div className={cn("rounded-md border", className)}>
        <Table className="mobile-card-view">
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.accessorKey}>{column.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No data available
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((column) => (
                    <TableCell
                      key={`${rowIndex}-${column.accessorKey}`}
                      data-label={mobileDataLabels ? column.header : undefined}
                    >
                      {column.cell
                        ? column.cell(row)
                        : row[column.accessorKey]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
