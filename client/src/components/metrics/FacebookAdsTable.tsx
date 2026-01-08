import { useMemo, useState, useRef } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown } from "lucide-react";
import { FACEBOOK_METRICS, formatMetricValue } from "@/lib/facebook-metrics";

interface FacebookAdsTableProps {
    data: any[];
    selectedMetrics: string[];
    level: 'campaign' | 'adset' | 'ad';
    onSort?: (key: string) => void;
}

const MIN_COLUMN_WIDTH = 80;
const DEFAULT_COLUMN_WIDTH = 120;

export default function FacebookAdsTable({ data, selectedMetrics, level, onSort }: FacebookAdsTableProps) {
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
    const [resizing, setResizing] = useState<{ column: string; startX: number; startWidth: number } | null>(null);
    const tableRef = useRef<HTMLDivElement>(null);

    const columns = useMemo(() => {
        return selectedMetrics.map(key => FACEBOOK_METRICS.find(m => m.key === key)!).filter(Boolean);
    }, [selectedMetrics]);

    const handleResizeStart = (column: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const currentWidth = columnWidths[column] || DEFAULT_COLUMN_WIDTH;
        setResizing({ column, startX: e.clientX, startWidth: currentWidth });

        const handleMouseMove = (moveEvent: MouseEvent) => {
            if (!resizing) return;

            const diff = moveEvent.clientX - e.clientX;
            const newWidth = Math.max(MIN_COLUMN_WIDTH, currentWidth + diff);
            setColumnWidths(prev => ({ ...prev, [column]: newWidth }));
        };

        const handleMouseUp = () => {
            setResizing(null);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const getColumnWidth = (key: string) => {
        return columnWidths[key] || DEFAULT_COLUMN_WIDTH;
    };

    const getStatusColor = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'ACTIVE':
                return 'bg-green-500/10 text-green-700 border-green-500/20';
            case 'PAUSED':
                return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
            default:
                return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
        }
    };

    if (data.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                Nenhum dado disponível para o período selecionado
            </div>
        );
    }

    return (
        <div className="border rounded-lg overflow-hidden relative" ref={tableRef}>
            <div className="overflow-x-auto">
                <Table className="min-w-[800px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead
                                className="sticky left-0 z-10 bg-background relative group"
                                style={{ width: `${getColumnWidth('name')}px`, minWidth: '180px' }}
                            >
                                <div className="flex items-center justify-between pr-2">
                                    Nome
                                    <div
                                        className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 flex items-center justify-center"
                                        onMouseDown={(e) => handleResizeStart('name', e)}
                                    >
                                        <div className="w-px h-4 bg-border" />
                                    </div>
                                </div>
                            </TableHead>
                            {level === 'adset' && (
                                <TableHead className="relative group" style={{ width: `${getColumnWidth('campaign')}px`, minWidth: '150px' }}>
                                    <div className="flex items-center justify-between pr-2">
                                        Campanha
                                        <div
                                            className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50"
                                            onMouseDown={(e) => handleResizeStart('campaign', e)}
                                        >
                                            <div className="w-px h-4 bg-border" />
                                        </div>
                                    </div>
                                </TableHead>
                            )}
                            {level === 'ad' && (
                                <>
                                    <TableHead className="relative group" style={{ width: `${getColumnWidth('campaign')}px`, minWidth: '150px' }}>
                                        <div className="flex items-center justify-between pr-2">
                                            Campanha
                                            <div
                                                className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50"
                                                onMouseDown={(e) => handleResizeStart('campaign', e)}
                                            >
                                                <div className="w-px h-4 bg-border" />
                                            </div>
                                        </div>
                                    </TableHead>
                                    <TableHead className="relative group" style={{ width: `${getColumnWidth('adset')}px`, minWidth: '150px' }}>
                                        <div className="flex items-center justify-between pr-2">
                                            Conjunto
                                            <div
                                                className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50"
                                                onMouseDown={(e) => handleResizeStart('adset', e)}
                                            >
                                                <div className="w-px h-4 bg-border" />
                                            </div>
                                        </div>
                                    </TableHead>
                                </>
                            )}
                            <TableHead className="relative group" style={{ width: `${getColumnWidth('status')}px`, minWidth: '100px' }}>
                                <div className="flex items-center justify-between pr-2">
                                    Status
                                    <div
                                        className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50"
                                        onMouseDown={(e) => handleResizeStart('status', e)}
                                    >
                                        <div className="w-px h-4 bg-border" />
                                    </div>
                                </div>
                            </TableHead>
                            {columns.map(col => (
                                <TableHead
                                    key={col.key}
                                    className="cursor-pointer hover:bg-muted/50 relative group"
                                    onClick={() => onSort?.(col.key)}
                                    style={{ width: `${getColumnWidth(col.key)}px`, minWidth: `${MIN_COLUMN_WIDTH}px` }}
                                >
                                    <div className="flex items-center justify-between pr-2">
                                        <div className="flex items-center gap-1">
                                            {col.label}
                                            <ArrowUpDown className="h-3 w-3" />
                                        </div>
                                        <div
                                            className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 z-10"
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                handleResizeStart(col.key, e);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="w-px h-4 bg-border" />
                                        </div>
                                    </div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row, idx) => (
                            <TableRow key={row.id || idx}>
                                <TableCell className="sticky left-0 z-10 bg-background font-medium">
                                    <div className="truncate" title={row.name}>
                                        {row.name}
                                    </div>
                                </TableCell>
                                {level === 'adset' && (
                                    <TableCell className="text-sm text-muted-foreground">
                                        <div className="truncate" title={row.campaignName}>
                                            {row.campaignName}
                                        </div>
                                    </TableCell>
                                )}
                                {level === 'ad' && (
                                    <>
                                        <TableCell className="text-sm text-muted-foreground">
                                            <div className="truncate" title={row.campaignName}>
                                                {row.campaignName}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            <div className="truncate" title={row.adsetName}>
                                                {row.adsetName}
                                            </div>
                                        </TableCell>
                                    </>
                                )}
                                <TableCell>
                                    <Badge variant="outline" className={getStatusColor(row.status)}>
                                        {row.status}
                                    </Badge>
                                </TableCell>
                                {columns.map(col => (
                                    <TableCell key={col.key} className="text-right">
                                        {formatMetricValue(row[col.key], col.format)}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
