import { useMemo, useState } from "react";
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
    const [resizing, setResizing] = useState<string | null>(null);

    const columns = useMemo(() => {
        return selectedMetrics.map(key => FACEBOOK_METRICS.find(m => m.key === key)!).filter(Boolean);
    }, [selectedMetrics]);

    const handleResizeStart = (column: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setResizing(column);
        const startX = e.clientX;
        const startWidth = columnWidths[column] || DEFAULT_COLUMN_WIDTH;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const diff = moveEvent.clientX - startX;
            const newWidth = Math.max(MIN_COLUMN_WIDTH, startWidth + diff);
            // Updating state directly triggers re-render, creating "live resize" effect
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

    // Styles for resize handle
    const resizeHandleStyle = "absolute right-0 top-0 bottom-0 w-4 cursor-col-resize flex items-center justify-center z-20 group hover:bg-blue-500/5 select-none touch-none";
    const resizeLineStyle = "w-0.5 h-full bg-border group-hover:bg-blue-500 transition-colors";

    return (
        <div className="border rounded-lg overflow-hidden relative select-none bg-background">
            <div className="overflow-x-auto">
                <Table className="w-max min-w-full" style={{ tableLayout: 'fixed' }}>
                    <TableHeader>
                        <TableRow className="border-b hover:bg-transparent">
                            <TableHead
                                className="sticky left-0 z-10 bg-background border-r p-0 h-10"
                                style={{ width: getColumnWidth('name'), minWidth: getColumnWidth('name') }}
                            >
                                <div className="flex items-center justify-between px-4 h-full relative">
                                    <span className="truncate font-semibold">Nome</span>
                                    <div
                                        className={resizeHandleStyle}
                                        style={{ right: '-8px' }}
                                        onMouseDown={(e) => handleResizeStart('name', e)}
                                    >
                                        <div className={resizeLineStyle} />
                                    </div>
                                </div>
                            </TableHead>

                            {level === 'adset' && (
                                <TableHead className="p-0 h-10 border-r relative" style={{ width: getColumnWidth('campaign'), minWidth: getColumnWidth('campaign') }}>
                                    <div className="flex items-center justify-between px-4 h-full">
                                        <span className="truncate font-semibold">Campanha</span>
                                        <div
                                            className={resizeHandleStyle}
                                            style={{ right: '-8px' }}
                                            onMouseDown={(e) => handleResizeStart('campaign', e)}
                                        >
                                            <div className={resizeLineStyle} />
                                        </div>
                                    </div>
                                </TableHead>
                            )}

                            {level === 'ad' && (
                                <>
                                    <TableHead className="p-0 h-10 border-r relative" style={{ width: getColumnWidth('campaign'), minWidth: getColumnWidth('campaign') }}>
                                        <div className="flex items-center justify-between px-4 h-full">
                                            <span className="truncate font-semibold">Campanha</span>
                                            <div
                                                className={resizeHandleStyle}
                                                style={{ right: '-8px' }}
                                                onMouseDown={(e) => handleResizeStart('campaign', e)}
                                            >
                                                <div className={resizeLineStyle} />
                                            </div>
                                        </div>
                                    </TableHead>
                                    <TableHead className="p-0 h-10 border-r relative" style={{ width: getColumnWidth('adset'), minWidth: getColumnWidth('adset') }}>
                                        <div className="flex items-center justify-between px-4 h-full">
                                            <span className="truncate font-semibold">Conjunto</span>
                                            <div
                                                className={resizeHandleStyle}
                                                style={{ right: '-8px' }}
                                                onMouseDown={(e) => handleResizeStart('adset', e)}
                                            >
                                                <div className={resizeLineStyle} />
                                            </div>
                                        </div>
                                    </TableHead>
                                </>
                            )}

                            <TableHead className="p-0 h-10 border-r relative" style={{ width: getColumnWidth('status'), minWidth: getColumnWidth('status') }}>
                                <div className="flex items-center justify-between px-4 h-full">
                                    <span className="truncate font-semibold">Status</span>
                                    <div
                                        className={resizeHandleStyle}
                                        style={{ right: '-8px' }}
                                        onMouseDown={(e) => handleResizeStart('status', e)}
                                    >
                                        <div className={resizeLineStyle} />
                                    </div>
                                </div>
                            </TableHead>

                            {columns.map(col => (
                                <TableHead
                                    key={col.key}
                                    className="p-0 h-10 border-r relative cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => onSort?.(col.key)}
                                    style={{ width: getColumnWidth(col.key), minWidth: getColumnWidth(col.key) }}
                                >
                                    <div className="flex items-center justify-between px-4 h-full">
                                        <div className="flex items-center gap-1 truncate font-semibold">
                                            {col.label}
                                            <ArrowUpDown className="h-3 w-3 opacity-50" />
                                        </div>
                                        <div
                                            className={resizeHandleStyle}
                                            style={{ right: '-8px' }}
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                handleResizeStart(col.key, e);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className={resizeLineStyle} />
                                        </div>
                                    </div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row, idx) => (
                            <TableRow key={row.id || idx} className="hover:bg-muted/30">
                                <TableCell className="sticky left-0 z-10 bg-background border-r py-3 px-4 font-medium">
                                    <div className="truncate" title={row.name}>
                                        {row.name}
                                    </div>
                                </TableCell>
                                {level === 'adset' && (
                                    <TableCell className="border-r py-3 px-4 text-muted-foreground">
                                        <div className="truncate" title={row.campaignName}>
                                            {row.campaignName}
                                        </div>
                                    </TableCell>
                                )}
                                {level === 'ad' && (
                                    <>
                                        <TableCell className="border-r py-3 px-4 text-muted-foreground">
                                            <div className="truncate" title={row.campaignName}>
                                                {row.campaignName}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground border-r">
                                            <div className="truncate" title={row.adsetName}>
                                                {row.adsetName}
                                            </div>
                                        </TableCell>
                                    </>
                                )}
                                <TableCell className="border-r py-3 px-4">
                                    <Badge variant="outline" className={getStatusColor(row.status)}>
                                        {row.status}
                                    </Badge>
                                </TableCell>
                                {columns.map(col => (
                                    <TableCell key={col.key} className="text-right border-r py-3 px-4">
                                        <div className="truncate font-mono text-sm">
                                            {formatMetricValue(row[col.key], col.format)}
                                        </div>
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
