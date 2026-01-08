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
    const [resizeLinePos, setResizeLinePos] = useState<number | null>(null);
    const tableContainerRef = useRef<HTMLDivElement>(null);
    // Armazena dados do resize atual sem causar re-renders desnecessários
    const resizeData = useRef<{ column: string; headerLeft: number } | null>(null);

    const columns = useMemo(() => {
        return selectedMetrics.map(key => FACEBOOK_METRICS.find(m => m.key === key)!).filter(Boolean);
    }, [selectedMetrics]);

    const handleResizeStart = (column: string, e: React.MouseEvent, headerElement: HTMLElement) => {
        e.preventDefault();
        e.stopPropagation();

        const container = tableContainerRef.current;
        if (!container) return;

        const headerRect = headerElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Armazena a posição esquerda visual do cabeçalho
        resizeData.current = {
            column,
            headerLeft: headerRect.left
        };

        // Define posição inicial da linha (relativa ao container)
        setResizeLinePos(e.clientX - containerRect.left);

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const currentContainerRect = container.getBoundingClientRect();
            // Posição da linha relativa ao container principal
            const relativeX = moveEvent.clientX - currentContainerRect.left;
            setResizeLinePos(relativeX);
        };

        const handleMouseUp = (upEvent: MouseEvent) => {
            if (resizeData.current) {
                // Cálculo da largura: Posição visual do mouse - Posição visual esquerda da coluna
                // Isso funciona independente do scroll
                const newWidth = Math.max(MIN_COLUMN_WIDTH, upEvent.clientX - resizeData.current.headerLeft);

                setColumnWidths(prev => ({
                    ...prev,
                    [resizeData.current!.column]: newWidth
                }));
            }

            // Limpeza
            setResizeLinePos(null);
            resizeData.current = null;
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
        <div ref={tableContainerRef} className="border rounded-lg overflow-hidden relative select-none">
            {/* Linha Fantasma */}
            {resizeLinePos !== null && (
                <div
                    className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-50 pointer-events-none"
                    style={{ left: resizeLinePos }}
                />
            )}

            <div className="overflow-x-auto">
                <Table className="min-w-[800px]" style={{ tableLayout: 'fixed' }}>
                    <TableHeader>
                        <TableRow>
                            <TableHead
                                className="sticky left-0 z-10 bg-background relative group border-r"
                                style={{ width: `${getColumnWidth('name')}px`, minWidth: '180px' }}
                            >
                                <div className="flex items-center justify-between pr-2 h-full">
                                    <span className="truncate">Nome</span>
                                    <div
                                        className="absolute right-0 top-0 bottom-0 w-4 cursor-col-resize hover:bg-blue-500/10 flex items-center justify-center -mr-2 z-20"
                                        onMouseDown={(e) => handleResizeStart('name', e, e.currentTarget.parentElement?.parentElement as HTMLElement)}
                                    >
                                        <div className="w-0.5 h-4 bg-gray-300 group-hover:bg-blue-400" />
                                    </div>
                                </div>
                            </TableHead>
                            {level === 'adset' && (
                                <TableHead className="relative group border-r" style={{ width: `${getColumnWidth('campaign')}px`, minWidth: '150px' }}>
                                    <div className="flex items-center justify-between pr-2 h-full">
                                        <span className="truncate">Campanha</span>
                                        <div
                                            className="absolute right-0 top-0 bottom-0 w-4 cursor-col-resize hover:bg-blue-500/10 flex items-center justify-center -mr-2 z-20"
                                            onMouseDown={(e) => handleResizeStart('campaign', e, e.currentTarget.parentElement?.parentElement as HTMLElement)}
                                        >
                                            <div className="w-0.5 h-4 bg-gray-300 group-hover:bg-blue-400" />
                                        </div>
                                    </div>
                                </TableHead>
                            )}
                            {level === 'ad' && (
                                <>
                                    <TableHead className="relative group border-r" style={{ width: `${getColumnWidth('campaign')}px`, minWidth: '150px' }}>
                                        <div className="flex items-center justify-between pr-2 h-full">
                                            <span className="truncate">Campanha</span>
                                            <div
                                                className="absolute right-0 top-0 bottom-0 w-4 cursor-col-resize hover:bg-blue-500/10 flex items-center justify-center -mr-2 z-20"
                                                onMouseDown={(e) => handleResizeStart('campaign', e, e.currentTarget.parentElement?.parentElement as HTMLElement)}
                                            >
                                                <div className="w-0.5 h-4 bg-gray-300 group-hover:bg-blue-400" />
                                            </div>
                                        </div>
                                    </TableHead>
                                    <TableHead className="relative group border-r" style={{ width: `${getColumnWidth('adset')}px`, minWidth: '150px' }}>
                                        <div className="flex items-center justify-between pr-2 h-full">
                                            <span className="truncate">Conjunto</span>
                                            <div
                                                className="absolute right-0 top-0 bottom-0 w-4 cursor-col-resize hover:bg-blue-500/10 flex items-center justify-center -mr-2 z-20"
                                                onMouseDown={(e) => handleResizeStart('adset', e, e.currentTarget.parentElement?.parentElement as HTMLElement)}
                                            >
                                                <div className="w-0.5 h-4 bg-gray-300 group-hover:bg-blue-400" />
                                            </div>
                                        </div>
                                    </TableHead>
                                </>
                            )}
                            <TableHead className="relative group border-r" style={{ width: `${getColumnWidth('status')}px`, minWidth: '100px' }}>
                                <div className="flex items-center justify-between pr-2 h-full">
                                    <span className="truncate">Status</span>
                                    <div
                                        className="absolute right-0 top-0 bottom-0 w-4 cursor-col-resize hover:bg-blue-500/10 flex items-center justify-center -mr-2 z-20"
                                        onMouseDown={(e) => handleResizeStart('status', e, e.currentTarget.parentElement?.parentElement as HTMLElement)}
                                    >
                                        <div className="w-0.5 h-4 bg-gray-300 group-hover:bg-blue-400" />
                                    </div>
                                </div>
                            </TableHead>
                            {columns.map(col => (
                                <TableHead
                                    key={col.key}
                                    className="cursor-pointer hover:bg-muted/50 relative group border-r"
                                    onClick={() => onSort?.(col.key)}
                                    style={{ width: `${getColumnWidth(col.key)}px`, minWidth: `${MIN_COLUMN_WIDTH}px` }}
                                >
                                    <div className="flex items-center justify-between pr-2 h-full">
                                        <div className="flex items-center gap-1 truncate">
                                            {col.label}
                                            <ArrowUpDown className="h-3 w-3" />
                                        </div>
                                        <div
                                            className="absolute right-0 top-0 bottom-0 w-4 cursor-col-resize hover:bg-blue-500/10 flex items-center justify-center -mr-2 z-20"
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                handleResizeStart(col.key, e, e.currentTarget.parentElement?.parentElement as HTMLElement);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="w-0.5 h-4 bg-gray-300 group-hover:bg-blue-400" />
                                        </div>
                                    </div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((row, idx) => (
                            <TableRow key={row.id || idx}>
                                <TableCell className="sticky left-0 z-10 bg-background font-medium border-r">
                                    <div className="truncate" title={row.name}>
                                        {row.name}
                                    </div>
                                </TableCell>
                                {level === 'adset' && (
                                    <TableCell className="text-sm text-muted-foreground border-r">
                                        <div className="truncate" title={row.campaignName}>
                                            {row.campaignName}
                                        </div>
                                    </TableCell>
                                )}
                                {level === 'ad' && (
                                    <>
                                        <TableCell className="text-sm text-muted-foreground border-r">
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
                                <TableCell className="border-r">
                                    <Badge variant="outline" className={getStatusColor(row.status)}>
                                        {row.status}
                                    </Badge>
                                </TableCell>
                                {columns.map(col => (
                                    <TableCell key={col.key} className="text-right border-r">
                                        <div className="truncate">
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
