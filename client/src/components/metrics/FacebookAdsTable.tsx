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
    const [resizePreview, setResizePreview] = useState<{ column: string; x: number } | null>(null);

    const columns = useMemo(() => {
        return selectedMetrics.map(key => FACEBOOK_METRICS.find(m => m.key === key)!).filter(Boolean);
    }, [selectedMetrics]);

    const handleResizeStart = (column: string, e: React.MouseEvent, headerElement: HTMLElement) => {
        e.preventDefault();
        e.stopPropagation();

        const tableContainer = headerElement.closest('.overflow-x-auto') as HTMLElement;
        const containerRect = tableContainer.getBoundingClientRect();
        const headerRect = headerElement.getBoundingClientRect();

        // Posição inicial da coluna relativa ao container
        const columnStart = headerRect.left - containerRect.left + tableContainer.scrollLeft;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            // Onde o mouse está agora, relativo ao container
            const mouseX = moveEvent.clientX - containerRect.left + tableContainer.scrollLeft;
            setResizePreview({ column, x: mouseX });
        };

        const handleMouseUp = (upEvent: MouseEvent) => {
            // Largura = onde soltou - onde a coluna começa
            const mouseX = upEvent.clientX - containerRect.left + tableContainer.scrollLeft;
            const newWidth = Math.max(MIN_COLUMN_WIDTH, mouseX - columnStart);

            setColumnWidths(prev => ({ ...prev, [column]: newWidth }));
            setResizePreview(null);

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
        <div className="border rounded-lg overflow-hidden relative">
            {/* Ghost resize line */}
            {resizePreview && (
                <div
                    className="absolute top-0 bottom-0 w-0.5 bg-primary z-50 pointer-events-none"
                    style={{ left: `${resizePreview.x}px` }}
                />
            )}

            <div className="overflow-x-auto">
                <Table className="min-w-[800px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead
                                className="sticky left-0 z-10 bg-background relative group"
                                style={{ width: getColumnWidth('name'), minWidth: '180px' }}
                            >
                                <div className="flex items-center justify-between pr-2">
                                    Nome
                                    <div
                                        className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-primary/30 flex items-center justify-center"
                                        onMouseDown={(e) => handleResizeStart('name', e, e.currentTarget.parentElement?.parentElement as HTMLElement)}
                                    >
                                        <div className="w-0.5 h-4 bg-border" />
                                    </div>
                                </div>
                            </TableHead>
                            {level === 'adset' && (
                                <TableHead className="relative group" style={{ width: getColumnWidth('campaign'), minWidth: '150px' }}>
                                    <div className="flex items-center justify-between pr-2">
                                        Campanha
                                        <div
                                            className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-primary/30 flex items-center justify-center"
                                            onMouseDown={(e) => handleResizeStart('campaign', e, e.currentTarget.parentElement?.parentElement as HTMLElement)}
                                        >
                                            <div className="w-0.5 h-4 bg-border" />
                                        </div>
                                    </div>
                                </TableHead>
                            )}
                            {level === 'ad' && (
                                <>
                                    <TableHead className="relative group" style={{ width: getColumnWidth('campaign'), minWidth: '150px' }}>
                                        <div className="flex items-center justify-between pr-2">
                                            Campanha
                                            <div
                                                className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-primary/30 flex items-center justify-center"
                                                onMouseDown={(e) => handleResizeStart('campaign', e, e.currentTarget.parentElement?.parentElement as HTMLElement)}
                                            >
                                                <div className="w-0.5 h-4 bg-border" />
                                            </div>
                                        </div>
                                    </TableHead>
                                    <TableHead className="relative group" style={{ width: getColumnWidth('adset'), minWidth: '150px' }}>
                                        <div className="flex items-center justify-between pr-2">
                                            Conjunto
                                            <div
                                                className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-primary/30 flex items-center justify-center"
                                                onMouseDown={(e) => handleResizeStart('adset', e, e.currentTarget.parentElement?.parentElement as HTMLElement)}
                                            >
                                                <div className="w-0.5 h-4 bg-border" />
                                            </div>
                                        </div>
                                    </TableHead>
                                </>
                            )}
                            <TableHead className="relative group" style={{ width: getColumnWidth('status'), minWidth: '100px' }}>
                                <div className="flex items-center justify-between pr-2">
                                    Status
                                    <div
                                        className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-primary/30 flex items-center justify-center"
                                        onMouseDown={(e) => handleResizeStart('status', e, e.currentTarget.parentElement?.parentElement as HTMLElement)}
                                    >
                                        <div className="w-0.5 h-4 bg-border" />
                                    </div>
                                </div>
                            </TableHead>
                            {columns.map(col => (
                                <TableHead
                                    key={col.key}
                                    className="cursor-pointer hover:bg-muted/50 relative group"
                                    onClick={() => onSort?.(col.key)}
                                    style={{ width: getColumnWidth(col.key), minWidth: MIN_COLUMN_WIDTH }}
                                >
                                    <div className="flex items-center justify-between pr-2">
                                        <div className="flex items-center gap-1">
                                            {col.label}
                                            <ArrowUpDown className="h-3 w-3" />
                                        </div>
                                        <div
                                            className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-primary/30 flex items-center justify-center z-10"
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                handleResizeStart(col.key, e, e.currentTarget.parentElement?.parentElement as HTMLElement);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="w-0.5 h-4 bg-border" />
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
