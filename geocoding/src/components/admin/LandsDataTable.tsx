import { useState, useMemo } from 'react';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  type VisibilityState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Bell,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useTranslation } from 'react-i18next';
import { getTranslatedPlantType, getTranslatedCategory } from '@/utils/translationUtils';
import { formatLandSizeToThaiUnits } from '@/utils/areaCalculator';

// Define Land type that matches the actual API response from backend
interface Land {
  id: number;
  land_name: string;
  land_code: string;
  land_number: string;
  location: string;
  province: string;
  district: string;
  city: string;
  plant_type_id: number;
  category_id: number;
  plant_type_name: string;
  category_name: string;
  category_color: string;
  plant_type_translation_key?: string;
  category_translation_key?: string;
  plant_date: string;
  harvest_cycle_days: number;
  next_harvest_date: string | null;
  previous_harvest_date?: string;
  coordinations: string;
  geometry: string;
  size: number;
  palm_area?: number;
  owner_name: string;
  tree_count?: number;
  notes: string;
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
  harvest_status: 'overdue' | 'due_soon' | 'normal';
}

interface LandsDataTableProps {
  data: Land[];
  userNames: Record<number, string>;
  onViewLand: (landId: number) => void;
  onEditLand: (land: Land) => void;
  onCreateNotification: (landId: number) => void;
  canManageLands: boolean;
}

function LandsDataTable({
  data,
  userNames,
  onViewLand,
  onEditLand,
  onCreateNotification,
  canManageLands,
}: LandsDataTableProps) {
  const { t } = useTranslation();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    harvest_status: false,
    location: false,
    created_by: false,
  });
  const [rowSelection, setRowSelection] = useState({});
  const [globalFilter, setGlobalFilter] = useState("");

  const getHarvestStatusBadge = (status: string) => {
    switch (status) {
      case 'overdue':
        return <Badge variant="destructive">{t('badges.overdue')}</Badge>;
      case 'due_soon':
        return <Badge variant="secondary">{t('badges.dueSoon')}</Badge>;
      default:
        return <Badge variant="outline">{t('badges.normal')}</Badge>;
    }
  };

  const columns: ColumnDef<Land>[] = useMemo(
    () => [
      {
        accessorKey: "land_name",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-0 font-semibold"
            >
              {t('labels.landName')}
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue("land_name")}</div>
        ),
      },
      {
        accessorKey: "land_code",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-0 font-semibold"
            >
              {t('labels.landCode')}
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => (
          <div className="font-mono text-sm">{row.getValue("land_code")}</div>
        ),
      },
      {
        accessorKey: "size",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-0 font-semibold"
            >
              {t('labels.size')}
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const size = parseFloat(row.getValue("size"));
          return <div className="text-right">{formatLandSizeToThaiUnits(size, t)}</div>;
        },
      },
      {
        accessorKey: "plant_type_name",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-0 font-semibold"
            >
              {t('labels.plantType')}
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const land = row.original;
          return (
            <div>
              {getTranslatedPlantType(t, land.plant_type_name, land.plant_type_translation_key)}
            </div>
          );
        },
      },
      {
        accessorKey: "category_name",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-0 font-semibold"
            >
              {t('labels.category')}
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const land = row.original;
          return (
            <div className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: land.category_color }}
              />
              <span>
                {getTranslatedCategory(t, land.category_name, land.category_translation_key)}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "previous_harvest_date",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-0 font-semibold"
            >
              {t('labels.previousHarvest')}
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const land = row.original;
          if (land.previous_harvest_date) {
            return <div>{new Date(land.previous_harvest_date).toLocaleDateString()}</div>;
          }
          return <div className="text-gray-400">-</div>;
        },
      },
      {
        accessorKey: "next_harvest_date",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-0 font-semibold"
            >
              {t('labels.nextHarvest')}
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const nextHarvestDate = row.getValue("next_harvest_date") as string | null;
          if (!nextHarvestDate || nextHarvestDate === 'null' || nextHarvestDate === '') {
            return <div className="text-gray-400">-</div>;
          }
          const date = new Date(nextHarvestDate);
          return <div>{date.toLocaleDateString()}</div>;
        },
      },
      {
        accessorKey: "harvest_status",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-0 font-semibold"
            >
              {t('labels.harvestStatus')}
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          return getHarvestStatusBadge(row.getValue("harvest_status"));
        },
      },
      {
        accessorKey: "location",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-0 font-semibold"
            >
              {t('labels.location')}
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const land = row.original;
          return (
            <div className="text-sm text-gray-600">
              {land.location}, {land.city}, {land.district}, {land.province}
            </div>
          );
        },
      },
      {
        accessorKey: "created_by",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-auto p-0 font-semibold"
            >
              {t('labels.createdBy')}
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="ml-2 h-4 w-4" />
              ) : (
                <ArrowUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const userId = row.getValue("created_by") as number;
          return (
            <div className="text-sm">
              {userNames[userId] || `User #${userId}`}
            </div>
          );
        },
      },
      {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
          const land = row.original;
          return (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewLand(land.id)}
                title={t('dashboard.lands.viewDetailsTooltip')}
              >
                <Eye className="h-4 w-4" />
              </Button>
              {canManageLands && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditLand(land)}
                  title={t('buttons.edit')}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onCreateNotification(land.id)}
                title={t('buttons.createNotification')}
              >
                <Bell className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [t, userNames, onViewLand, onEditLand, onCreateNotification, canManageLands]
  );

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
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, value) => {
      const land = row.original;
      const searchValue = value.toLowerCase();
      
      return (
        land.land_name.toLowerCase().includes(searchValue) ||
        land.land_code.toLowerCase().includes(searchValue) ||
        land.location.toLowerCase().includes(searchValue) ||
        land.city.toLowerCase().includes(searchValue) ||
        land.district.toLowerCase().includes(searchValue) ||
        land.province.toLowerCase().includes(searchValue) ||
        land.plant_type_name.toLowerCase().includes(searchValue) ||
        land.category_name.toLowerCase().includes(searchValue) ||
        getTranslatedPlantType(t, land.plant_type_name, land.plant_type_translation_key).toLowerCase().includes(searchValue) ||
        getTranslatedCategory(t, land.category_name, land.category_translation_key).toLowerCase().includes(searchValue) ||
        userNames[land.created_by]?.toLowerCase().includes(searchValue)
      );
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  });

  return (
    <div className="w-full space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={t('dashboard.lands.searchPlaceholder')}
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(String(event.target.value))}
            className="pl-10"
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              <Filter className="mr-2 h-4 w-4" />
              {t('buttons.columns')}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Data Table */}
      <div className="rounded-md border">
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
                  );
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
                  {t('dashboard.lands.noResults')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} {t('dashboard.lands.of')} {data.length} {t('dashboard.lands.lands')}
        </div>
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">{t('dashboard.lands.rowsPerPage')}</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">{t('buttons.goToPreviousPage')}</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            {t('dashboard.lands.page')} {table.getState().pagination.pageIndex + 1} {t('dashboard.lands.of')} {table.getPageCount()}
          </div>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">{t('buttons.goToNextPage')}</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default LandsDataTable;