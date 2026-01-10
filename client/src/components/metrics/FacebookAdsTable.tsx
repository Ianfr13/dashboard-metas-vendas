import { useMemo, useState, useRef, useEffect } from "react";
import { ArrowUp, ArrowDown, Search } from "lucide-react";
import { FACEBOOK_METRICS, CALCULATED_METRICS, formatMetricValue, evaluateFormula, MetricConfig, CalculatedMetric } from "@/lib/facebook-metrics";
import { loadUserMetrics, UserMetric } from "./CustomMetricCreator";
import { cn } from "@/lib/utils";

interface FacebookAdsTableProps {
    data: any[];
    selectedMetrics: string[];
    level: 'campaign' | 'adset' | 'ad';
    onSort?: (key: string) => void;
    onReorder?: (metrics: string[]) => void;
}

const MIN_COLUMN_WIDTH = 100;
const DEFAULT_COLUMN_WIDTH = 140;

export default function FacebookAdsTable({ data, selectedMetrics, level, onSort, onReorder }: FacebookAdsTableProps) {
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>({
        name: 300,
        status: 100,
        campaign: 200,
        adset: 200,
    });
    const [resizing, setResizing] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [draggedMetric, setDraggedMetric] = useState<string | null>(null);

    // Load user metrics from localStorage
    const userMetrics = useMemo(() => loadUserMetrics(), [selectedMetrics]);

    const columns = useMemo(() => {
        return selectedMetrics.map(key => {
            // First check regular metrics
            const regular = FACEBOOK_METRICS.find(m => m.key === key);
            if (regular) return { ...regular, isCalculated: false };

            // Then check built-in calculated metrics
            const calculated = CALCULATED_METRICS.find(m => m.key === key);
            if (calculated) return { ...calculated, isCalculated: true };

            // Finally check user-created metrics
            const userMetric = userMetrics.find(m => m.key === key);
            if (userMetric) return { ...userMetric, isCalculated: true };

            return null;
        }).filter(Boolean) as ((MetricConfig | CalculatedMetric | UserMetric) & { isCalculated: boolean })[];
    }, [selectedMetrics, userMetrics]);

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

    // Totals Calculation
    const totals = useMemo(() => {
        if (!data.length) return null;
        const result: Record<string, number> = {};

        // Initialize sums
        columns.forEach(col => result[col.key] = 0);

        data.forEach(row => {
            columns.forEach(col => {
                const val = parseFloat(row[col.key]) || 0;
                if (['spend', 'impressions', 'clicks', 'leads', 'purchases', 'purchaseValue', 'addToCart', 'initiateCheckout', 'landingPageViews', 'linkClicks', 'videoViews'].includes(col.key)) {
                    result[col.key] += val;
                }
            });
        });

        // Recalculate rates
        if (result.clicks > 0) result.cpc = result.spend / result.clicks;
        if (result.impressions > 0) result.cpm = (result.spend / result.impressions) * 1000;
        if (result.impressions > 0) result.ctr = (result.clicks / result.impressions) * 100;
        if (result.leads > 0) result.costPerLead = result.spend / result.leads;
        if (result.purchases > 0) result.costPerPurchase = result.spend / result.purchases;
        if (result.spend > 0) result.roas = result.purchaseValue / result.spend;

        return result;
    }, [data, columns]);


    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'desc';

        if (sortConfig && sortConfig.key === key) {
            direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
        } else if (key === 'name' || key === 'status') {
            direction = 'asc';
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

    // Drag and Drop Handlers
    const handleDragStart = (e: React.DragEvent, metricKey: string) => {
        setDraggedMetric(metricKey);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, targetMetricKey: string) => {
        e.preventDefault();
        if (draggedMetric === targetMetricKey) return;
    };

    const handleDrop = (e: React.DragEvent, targetMetricKey: string) => {
        e.preventDefault();
        if (!draggedMetric || draggedMetric === targetMetricKey) return;

        const fromIndex = selectedMetrics.indexOf(draggedMetric);
        const toIndex = selectedMetrics.indexOf(targetMetricKey);

        if (fromIndex !== -1 && toIndex !== -1) {
            const newOrder = [...selectedMetrics];
            newOrder.splice(fromIndex, 1);
            newOrder.splice(toIndex, 0, draggedMetric);
            onReorder?.(newOrder);
        }
        setDraggedMetric(null);
    };

    const getColumnWidth = (key: string) => columnWidths[key] || DEFAULT_COLUMN_WIDTH;

    const StatusCell = ({ status }: { status: string }) => {
        const s = status?.toUpperCase();
        let colorClass = "bg-gray-400";
        let text = "Unknown";

        if (s === 'ACTIVE') {
            colorClass = "bg-green-500";
            text = "Ativo";
        } else if (s === 'PAUSED') {
            colorClass = "bg-gray-400";
            text = "Pausado";
        } else if (s === 'ARCHIVED') {
            colorClass = "bg-slate-300";
            text = "Arquivado";
        } else if (s?.includes('ERROR') || s?.includes('REJECTED')) {
            colorClass = "bg-red-500";
            text = "Erro";
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

    const resizeHandleStyle = "absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 z-30 transition-colors opacity-0 group-hover/th:opacity-100";
    const headerClass = "h-9 px-3 text-xs font-semibold uppercase text-gray-500 bg-gray-50 border-r border-b select-none relative group/th whitespace-nowrap transition-colors";
    const cellClass = "h-10 px-3 text-xs border-r border-b truncate";
    const footerClass = "h-9 px-3 text-xs font-bold text-gray-900 bg-gray-100 border-r border-t truncate";

    return (
        <div className="border rounded shadow-sm bg-white flex flex-col h-[600px] overflow-hidden">
            <div className="overflow-auto flex-1 w-full relative">
                <table className="w-max min-w-full border-collapse" style={{ tableLayout: 'fixed' }}>
                    <thead className="sticky top-0 z-20 shadow-sm">
                        <tr>
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

                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={cn(headerClass, "text-right cursor-grab active:cursor-grabbing", {
                                        'bg-blue-50': draggedMetric === col.key
                                    })}
                                    style={{ width: getColumnWidth(col.key) }}
                                    onClick={() => handleSort(col.key)}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, col.key)}
                                    onDragOver={(e) => handleDragOver(e, col.key)}
                                    onDrop={(e) => handleDrop(e, col.key)}
                                >
                                    <div className="flex items-center justify-end h-full gap-1">
                                        {sortConfig?.key === col.key && (
                                            sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                        )}
                                        <span>{col.label}</span>
                                    </div>
                                    <div className={resizeHandleStyle} onMouseDown={(e) => handleResizeStart(col.key, e)} />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.map((row, i) => (
                            <tr key={i} className="hover:bg-gray-50/50 transition-colors group">
                                <td
                                    className={cn(cellClass, "sticky left-0 bg-white group-hover:bg-gray-50/50 shadow-[1px_0_0_0_rgba(0,0,0,0.05)] font-medium text-gray-900", level === 'ad' ? "pr-8" : "")}
                                    style={{ width: getColumnWidth('name') }}
                                    title={row.name}
                                >
                                    <div className="flex items-center justify-between group/link">
                                        <span className="truncate">{row.name}</span>
                                        {level === 'ad' && (
                                            <a
                                                href={row.preview_shareable_link || `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=BR&q=${row.id}&search_type=keyword_unordered&media_type=all`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="opacity-0 group-hover/link:opacity-100 transition-opacity p-1 hover:bg-blue-50 rounded text-blue-600"
                                                title={row.preview_shareable_link ? "Ver Prévia do Anúncio" : "Buscar na Biblioteca de Anúncios"}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Search className="w-3 h-3" />
                                            </a>
                                        )}
                                    </div>
                                </td>

                                <td
                                    className={cn(cellClass, "sticky bg-white group-hover:bg-gray-50/50 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]")}
                                    style={{
                                        width: getColumnWidth('status'),
                                        left: getColumnWidth('name')
                                    }}
                                >
                                    <StatusCell status={row.status} />
                                </td>
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

                                {columns.map((col) => {
                                    let value: number;
                                    if (col.isCalculated && 'formula' in col) {
                                        // Calculated metric - evaluate formula
                                        value = evaluateFormula(col.formula, row as Record<string, number>);
                                    } else {
                                        value = parseFloat(row[col.key]) || 0;
                                    }
                                    return (
                                        <td
                                            key={col.key}
                                            className={cn(cellClass, "text-right font-mono text-gray-600")}
                                            style={{ width: getColumnWidth(col.key) }}
                                        >
                                            {formatMetricValue(value, col.format)}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="sticky bottom-0 z-20 shadow-[0_-1px_3px_rgba(0,0,0,0.1)]">
                        <tr>
                            <td
                                className={cn(footerClass, "sticky left-0 bg-gray-100 shadow-[1px_0_0_0_rgba(0,0,0,0.1)]")}
                                style={{ width: getColumnWidth('name') }}
                            >
                                Total
                            </td>
                            <td
                                className={cn(footerClass, "sticky bg-gray-100 shadow-[1px_0_0_0_rgba(0,0,0,0.1)]")}
                                style={{
                                    width: getColumnWidth('status'),
                                    left: getColumnWidth('name')
                                }}
                            >
                                -
                            </td>
                            {level === 'adset' && <td className={footerClass + " bg-gray-100"}>-</td>}
                            {level === 'ad' && <td className={footerClass + " bg-gray-100"}>-</td>}

                            {columns.map((col) => {
                                let value: number = 0;
                                if (totals) {
                                    if (col.isCalculated && 'formula' in col) {
                                        value = evaluateFormula(col.formula, totals);
                                    } else {
                                        value = totals[col.key] || 0;
                                    }
                                }
                                return (
                                    <td
                                        key={col.key}
                                        className={cn(footerClass, "text-right bg-gray-100")}
                                        style={{ width: getColumnWidth(col.key) }}
                                    >
                                        {totals ? formatMetricValue(value, col.format) : '-'}
                                    </td>
                                );
                            })}
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
