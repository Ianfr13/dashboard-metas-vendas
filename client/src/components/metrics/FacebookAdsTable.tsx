import { useMemo } from "react";
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

export default function FacebookAdsTable({ data, selectedMetrics, level, onSort }: FacebookAdsTableProps) {
    const columns = useMemo(() => {
        return selectedMetrics.map(key => FACEBOOK_METRICS.find(m => m.key === key)!).filter(Boolean);
    }, [selectedMetrics]);

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
                <Table className="min-w-[800px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="sticky left-0 z-10 bg-background" style={{ minWidth: '250px' }}>
                                Nome
                            </TableHead>
                            {level === 'adset' && (
                                <TableHead style={{ minWidth: '200px' }}>Campanha</TableHead>
                            )}
                            {level === 'ad' && (
                                <>
                                    <TableHead style={{ minWidth: '200px' }}>Campanha</TableHead>
                                    <TableHead style={{ minWidth: '200px' }}>Conjunto</TableHead>
                                </>
                            )}
                            <TableHead style={{ minWidth: '100px' }}>Status</TableHead>
                            {columns.map(col => (
                                <TableHead
                                    key={col.key}
                                    className="cursor-pointer hover:bg-muted/50"
                                    onClick={() => onSort?.(col.key)}
                                    style={{ minWidth: '120px' }}
                                >
                                    <div className="flex items-center gap-1">
                                        {col.label}
                                        <ArrowUpDown className="h-3 w-3" />
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
