import { useMemo, useState, useRef, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, GripVertical } from "lucide-react";
import { FACEBOOK_METRICS, formatMetricValue } from "@/lib/facebook-metrics";

interface FacebookAdsTableProps {
    data: any[];
    selectedMetrics: string[];
    level: 'campaign' | 'adset' | 'ad';
    onSort?: (key: string) => void;
}

const COLUMN_WIDTHS_KEY = 'fb-column-widths';
const DEFAULT_COLUMN_WIDTH = 150;
const MIN_COLUMN_WIDTH = 80;

export default function FacebookAdsTable({ data, selectedMetrics, level, onSort }: FacebookAdsTableProps) {
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
    const [resizingColumn, setResizingColumn] = useState<string | null>(null);
    const resizeStartX = useRef(0);
    const resizeStartWidth = useRef(0);

    const columns = useMemo(() => {
        return selectedMetrics.map(key => FACEBOOK_METRICS.find(m => m.key === key)!).filter(Boolean);
    }, [selectedMetrics]);

    // Load column widths from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(COLUMN_WIDTHS_KEY);
        if (saved) {
            try {
                setColumnWidths(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load column widths:', e);
            }
        }
    }, []);

    // Save column widths to localStorage
    useEffect(() => {
        if (Object.keys(columnWidths).length > 0) {
            localStorage.setItem(COLUMN_WIDTHS_KEY, JSON.stringify(columnWidths));
        }
    }, [columnWidths]);

    const handleResizeStart = (column: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const startWidth = columnWidths[column] || DEFAULT_COLUMN_WIDTH;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const currentX = moveEvent.clientX;
            const diffX = currentX - startX;
            const newWidth = Math.max(MIN_COLUMN_WIDTH, startWidth + diffX);

            setColumnWidths(prev => ({ ...prev, [column]: newWidth }));
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            setResizingColumn(null);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        setResizingColumn(column);
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
        <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <Table className="min-w-[800px]" style={{ tableLayout: 'fixed' }}>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="sticky left-0 z-10 bg-background relative group" style={{ minWidth: '250px' }}>
                                <div className="flex items-center justify-between">
                                    Nome
                                    <div
                                        className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-primary/30"
                                        onMouseDown={(e) => handleResizeStart('name', e)}
                                    />
                                </div>
                            </TableHead>
                            {level === 'adset' && (
                                <TableHead className="relative group" style={{ width: getColumnWidth('campaign'), minWidth: '150px' }}>
                                    <div className="flex items-center justify-between">
                                        Campanha
                                        <div
                                            className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-primary/30"
                                            onMouseDown={(e) => handleResizeStart('campaign', e)}
                                        />
                                    </div>
                                </TableHead>
                            )}
                            {level === 'ad' && (
                                <>
                                    <TableHead className="relative group" style={{ width: getColumnWidth('campaign'), minWidth: '150px' }}>
                                        <div className="flex items-center justify-between">
                                            Campanha
                                            <div
                                                className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-primary/30"
                                                onMouseDown={(e) => handleResizeStart('campaign', e)}
                                            />
                                        </div>
                                    </TableHead>
                                    <TableHead className="relative group" style={{ width: getColumnWidth('adset'), minWidth: '150px' }}>
                                        <div className="flex items-center justify-between">
                                            Conjunto
                                            <div
                                                className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-primary/30"
                                                onMouseDown={(e) => handleResizeStart('adset', e)}
                                            />
                                        </div>
                                    </TableHead>
                                </>
                            )}
                            <TableHead className="relative group" style={{ width: getColumnWidth('status'), minWidth: '100px' }}>
                                <div className="flex items-center justify-between">
                                    Status
                                    <div
                                        className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-primary/30"
                                        onMouseDown={(e) => handleResizeStart('status', e)}
                                    />
                                </div>
                            </TableHead>
                            {columns.map(col => (
                                <TableHead
                                    key={col.key}
                                    className="cursor-pointer hover:bg-muted/50 relative group"
                                    onClick={() => onSort?.(col.key)}
                                    style={{ width: getColumnWidth(col.key), minWidth: MIN_COLUMN_WIDTH }}
                                >
                                    <div className="flex items-center justify-between gap-1">
                                        <div className="flex items-center gap-1">
                                            {col.label}
                                            <ArrowUpDown className="h-3 w-3" />
                                        </div>
                                        <div
                                            className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-primary/30"
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                handleResizeStart(col.key, e);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row, idx) => (
                            <TableRow key={row.id || idx}>
                                <TableCell className="sticky left-0 z-10 bg-background font-medium">
                                    <div className="max-w-[250px] truncate" title={row.name}>
                                        {row.name}
                                    </div>
                                </TableCell>
                                {level === 'adset' && (
                                    <TableCell className="text-sm text-muted-foreground">
                                        <div className="max-w-[200px] truncate" title={row.campaignName}>
                                            {row.campaignName}
                                        </div>
                                    </TableCell>
                                )}
                                {level === 'ad' && (
                                    <>
                                        <TableCell className="text-sm text-muted-foreground">
                                            <div className="max-w-[200px] truncate" title={row.campaignName}>
                                                {row.campaignName}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            <div className="max-w-[200px] truncate" title={row.adsetName}>
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
