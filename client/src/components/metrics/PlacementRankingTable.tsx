import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MonitorSmartphone, LayoutGrid, Smartphone, Laptop, FileText } from "lucide-react";
import { PlacementMetrics } from "@/lib/edge-functions";

interface PlacementRankingTableProps {
    data: PlacementMetrics[];
}

export default function PlacementRankingTable({ data }: PlacementRankingTableProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
            minimumFractionDigits: 0,
        }).format(value);
    };

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat("pt-BR").format(value);
    };

    const getPlacementIcon = (placement: string, isForm: boolean) => {
        if (isForm) return <FileText className="h-4 w-4 text-blue-500" />;
        const p = placement.toLowerCase();
        if (p.includes('mobile') || p.includes('story') || p.includes('reels')) return <Smartphone className="h-4 w-4" />;
        if (p.includes('desktop')) return <Laptop className="h-4 w-4" />;
        return <LayoutGrid className="h-4 w-4" />;
    };

    return (
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
                <CardTitle>Ranking de Posicionamento</CardTitle>
                <CardDescription>Qual formato está vendendo mais? <Badge variant="outline" className="ml-2 text-blue-500 border-blue-500"><FileText className="h-3 w-3 inline mr-1" />Form</Badge> = Formulário Meta</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Posicionamento</TableHead>
                                <TableHead>Fonte</TableHead>
                                <TableHead className="text-right">Visitas</TableHead>
                                <TableHead className="text-right">Leads</TableHead>
                                <TableHead className="text-right">Vendas</TableHead>
                                <TableHead className="text-right">Receita</TableHead>
                                <TableHead className="text-right">Conv. Lead</TableHead>
                                <TableHead className="text-right">Conv. Venda</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item, index) => (
                                <TableRow key={index} className="hover:bg-muted/50 transition-colors">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-2 rounded-full ${item.isFormPlacement ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-muted'} text-indigo-500`}>
                                                {getPlacementIcon(item.placement, item.isFormPlacement)}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-mono text-sm">
                                                    {item.placement}
                                                </span>
                                                {item.isFormPlacement && (
                                                    <Badge variant="outline" className="text-[10px] text-blue-500 border-blue-500 w-fit">
                                                        Form
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-muted-foreground">{item.source || '-'}</span>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm">
                                        {formatNumber(item.pageViews)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="font-mono text-sm">{formatNumber(item.leads || 0)}</span>
                                            {item.leads > 0 && (
                                                <span className="text-[10px] text-muted-foreground">
                                                    {(item.leadConversionRate || 0).toFixed(1)}%
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-sm">
                                        {formatNumber(item.sales)}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-green-600">
                                        {formatCurrency(item.revenue)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant={(item.leadConversionRate || 0) > 1 ? "default" : "secondary"}>
                                            {(item.leadConversionRate || 0).toFixed(2)}%
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant={(item.conversionRate || 0) > 1 ? "default" : "secondary"}>
                                            {(item.conversionRate || 0).toFixed(2)}%
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}

                            {data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                        Nenhum dado de posicionamento registrado no período.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
