"use client"

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type ColumnFiltersState,
  type VisibilityState,
} from "@tanstack/react-table"
import { useState } from "react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslation } from "react-i18next"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
  globalFilter?: string
  onGlobalFilterChange?: (value: string) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search...",
  globalFilter,
  onGlobalFilterChange,
}: DataTableProps<TData, TValue>) {
  const { t } = useTranslation()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [globalFilterValue, setGlobalFilterValue] = useState<string>("")

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: onGlobalFilterChange || setGlobalFilterValue,
    globalFilterFn: (row, columnId, value) => {
      const search = value.toLowerCase();
      const rowData = row.original as any;
      
      // Search across multiple fields
      const searchableFields = [
        rowData.first_name?.toLowerCase() || '',
        rowData.last_name?.toLowerCase() || '',
        rowData.email?.toLowerCase() || '',
        rowData.role?.toLowerCase() || '',
        rowData.phone?.toLowerCase() || '',
      ];
      
      return searchableFields.some(field => field.includes(search));
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter: globalFilter || globalFilterValue,
    },
  })

  return (
    <div className="w-full">
      {/* Search and Column Visibility Controls */}
      <div className="flex items-center py-4 space-x-2">
        <Input
          placeholder={searchPlaceholder || t('dataTable.searchPlaceholder')}
          value={globalFilter || globalFilterValue}
          onChange={(event) => {
            const value = event.target.value
            if (onGlobalFilterChange) {
              onGlobalFilterChange(value)
            } else {
              setGlobalFilterValue(value)
            }
          }}
          className="max-w-sm"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              {t('dataTable.columns')} <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                // Get translated column name
                const getColumnTranslation = (columnId: string) => {
                  const columnTranslations: Record<string, string> = {
                    'title': t('workAssignments.fieldTitle'),
                    'workTypeName': t('workAssignments.workType'),
                    'assignedTeamName': t('workAssignments.assignedTo'),
                    'landName': t('workAssignments.land'),
                    'priorityLevel': t('workAssignments.priority'),
                    'status': t('workAssignments.status'),
                    'dueDate': t('workAssignments.dueDate'),
                    'createdAt': t('workAssignments.createdAt'),
                    'actions': t('workAssignments.actions')
                  };
                  return columnTranslations[columnId] || columnId;
                };

                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {getColumnTranslation(column.id)}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {t('dataTable.noResults')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} {t('dataTable.of')} {" "}
          {table.getCoreRowModel().rows.length} {t('dataTable.rowsTotal')}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
            {t('dataTable.previous')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {t('dataTable.next')}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}