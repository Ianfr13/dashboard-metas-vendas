import { useMemo, useState, useRef, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Filter } from "lucide-react";
import { FACEBOOK_METRICS, formatMetricValue } from "@/lib/facebook-metrics";
import { cn } from "@/lib/utils";

interface FacebookAdsTableProps {
    data: any[];
    selectedMetrics: string[];
    level: 'campaign' | 'adset' | 'ad';
    onSort?: (key: string) => void;
}

const MIN_COLUMN_WIDTH = 100;
const DEFAULT_COLUMN_WIDTH = 140;

export default function FacebookAdsTable({ data, selectedMetrics, level, onSort }: FacebookAdsTableProps) {
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
        name: 300,
        status: 100,
        campaign: 200,
        adset: 200,
    });
    const [resizing, setResizing] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    const columns = useMemo(() => {
        return selectedMetrics.map(key => FACEBOOK_METRICS.find(m => m.key === key)!).filter(Boolean);
    }, [selectedMetrics]);

    // Internal sorting
    const sortedData = useMemo(() => {
        if (!sortConfig) return data;
        return [...data].sort((a, b) => {
            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig]);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'desc'; // Default to desc for metrics (higher is usually better/more relevant)

        if (sortConfig && sortConfig.key === key) {
            direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
        } else if (key === 'name' || key === 'status') {
            direction = 'asc'; // Default to asc for text
        }

        setSortConfig({ key, direction });
        onSort?.(key);
    };

    const handleResizeStart = (column: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setResizing(column);

        const startX = e.clientX;
        const startWidth = columnWidths[column] || DEFAULT_COLUMN_WIDTH;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const currentX = moveEvent.clientX;
            const delta = currentX - startX;
            setColumnWidths(prev => ({
                ...prev,
                [column]: Math.max(MIN_COLUMN_WIDTH, startWidth + delta)
            }));
        };

        const handleMouseUp = () => {
            setResizing(null);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const getColumnWidth = (key: string) => columnWidths[key] || DEFAULT_COLUMN_WIDTH;

    // Custom Status Component
    const StatusCell = ({ status }: { status: string }) => {
        const s = status?.toUpperCase();
        let colorClass = "bg-gray-400";
        let text = "Unknown";

        if (s === 'ACTIVE') {
            colorClass = "bg-green-500";
            text = "Active";
        } else if (s === 'PAUSED') {
            colorClass = "bg-gray-400";
            text = "Off";
        } else if (s === 'ARCHIVED') {
            colorClass = "bg-slate-300";
            text = "Archived";
        } else if (s?.includes('ERROR') || s?.includes('REJECTED')) {
            colorClass = "bg-red-500";
            text = "Error";
        }

        return (
            <div className="flex items-center gap-2">
                <div className={cn("w-2 h-2 rounded-full", colorClass)} />
                <span className="text-xs font-medium text-muted-foreground">{text}</span>
            </div>
        );
    };

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground bg-white border border-dashed rounded-lg">
                <div className="p-4 bg-gray-50 rounded-full mb-3">
                    <Search className="w-6 h-6 text-gray-400" />
                </div>
                <p className="font-medium">Nenhum resultado encontrado</p>
                <p className="text-sm">Tente ajustar os filtros ou o período de data.</p>
            </div>
        );
    }

    const resizeHandleStyle = "absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 z-30 transition-colors";

    // Header Cell Common Styles
    const headerClass = "h-9 px-3 text-xs font-semibold uppercase text-gray-500 bg-gray-50 border-r border-b select-none relative group whitespace-nowrap";
    const cellClass = "h-10 px-3 text-xs border-r border-b truncate";

    return (
        <div className="border rounded shadow-sm bg-white flex flex-col h-[600px] overflow-hidden">
            <div className="overflow-auto flex-1 w-full relative">
                <table className="w-max min-w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                    <thead className="sticky top-0 z-20 shadow-sm">
                        <tr>
                            {/* Sticky Name Column */}
                            <th
                                className={cn(headerClass, "sticky left-0 z-20 text-left bg-gray-50 shadow-[1px_0_0_0_rgba(0,0,0,0.1)]")}
                                style={{ width: getColumnWidth('name') }}
                                onClick={() => handleSort('name')}
                            >
                                <div className="flex items-center justify-between h-full">
                                    <span>Nome</span>
                                    {sortConfig?.key === 'name' && (
                                        sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                    )}
                                </div>
                                <div className={resizeHandleStyle} onMouseDown={(e) => handleResizeStart('name', e)} />
                            </th>

                            {/* Sticky Status Column */}
                            <th
                                className={cn(headerClass, "sticky z-20 text-left bg-gray-50 shadow-[1px_0_0_0_rgba(0,0,0,0.1)]")}
                                style={{
                                    width: getColumnWidth('status'),
                                    left: getColumnWidth('name')
                                }}
                                onClick={() => handleSort('status')}
                            >
                                <div className="flex items-center justify-between h-full">
                                    <span>Veiculação</span>
                                    {sortConfig?.key === 'status' && (
                                        sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                    )}
                                </div>
                                <div className={resizeHandleStyle} onMouseDown={(e) => handleResizeStart('status', e)} />
                            </th>

                            {/* Dynamic Context Columns (Campaign/AdSet) for nested views */}
                            {level === 'adset' && (
                                <th
                                    className={headerClass + " text-left"}
                                    style={{ width: getColumnWidth('campaign') }}
                                    onClick={() => handleSort('campaignName')}
                                >
                                    <div className="flex items-center justify-between h-full">
                                        <span>Campanha</span>
                                    </div>
                                    <div className={resizeHandleStyle} onMouseDown={(e) => handleResizeStart('campaign', e)} />
                                </th>
                            )}

                            {level === 'ad' && (
                                <>
                                    <th
                                        className={headerClass + " text-left"}
                                        style={{ width: getColumnWidth('adset') }}
                                        onClick={() => handleSort('adsetName')}
                                    >
                                        <div className="flex items-center justify-between h-full">
                                            <span>Conjunto</span>
                                        </div>
                                        <div className={resizeHandleStyle} onMouseDown={(e) => handleResizeStart('adset', e)} />
                                    </th>
                                </>
                            )}

                            {/* Metric Columns */}
                            {columns.map(col => (
                                <th
                                    key={col.key}
                                    className={cn(headerClass, "text-right cursor-pointer hover:bg-gray-100")}
                                    style={{ width: getColumnWidth(col.key) }}
                                    onClick={() => handleSort(col.key)}
                                >
                                    <div className="flex items-center justify-end gap-1 h-full">
                                        {col.label}
                                        {sortConfig?.key === col.key && (
                                            sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                        )}
                                    </div>
                                    <div className={resizeHandleStyle} onMouseDown={(e) => handleResizeStart(col.key, e)} />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white">
                        {sortedData.map((row, idx) => (
                            <tr key={row.id || idx} className="hover:bg-blue-50/30 transition-colors group">
                                {/* Sticky Name Cell */}
                                <td
                                    className={cn(cellClass, "sticky left-0 z-10 bg-white group-hover:bg-blue-50/30 font-medium text-gray-900 border-r-gray-200 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]")}
                                    title={row.name}
                                >
                                    {row.name}
                                </td>

                                {/* Sticky Status Cell */}
                                <td
                                    className={cn(cellClass, "sticky z-10 bg-white group-hover:bg-blue-50/30 border-r-gray-200 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]")}
                                    style={{ left: getColumnWidth('name') }}
                                >
                                    <StatusCell status={row.status} />
                                </td>

                                {/* Context Cells */}
                                {level === 'adset' && (
                                    <td className={cellClass + " text-gray-500"} title={row.campaignName}>
                                        {row.campaignName}
                                    </td>
                                )}

                                {level === 'ad' && (
                                    <td className={cellClass + " text-gray-500"} title={row.adsetName}>
                                        {row.adsetName}
                                    </td>
                                )}

                                {/* Metrics Cells */}
                                {columns.map(col => (
                                    <td key={col.key} className={cellClass + " text-right font-mono text-gray-700"}>
                                        {formatMetricValue(row[col.key], col.format)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer / Summary Row could go here */}
            <div className="border-t bg-gray-50 p-2 text-xs text-gray-500 flex justify-between items-center">
                <span>{data.length} items</span>
                <span>Total Spend: {formatMetricValue(data.reduce((acc, row) => acc + (row.spend || 0), 0), 'currency')}</span>
            </div>
        </div>
    );
}
