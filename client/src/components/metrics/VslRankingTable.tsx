import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Play, Eye, CheckCircle, Video } from "lucide-react";

interface VslData {
    id: string;
    name: string;
    started: number;
    finished: number;
    viewed: number;
}

interface VslRankingTableProps {
    data: VslData[];
}

export default function VslRankingTable({ data }: VslRankingTableProps) {
    const formatNumber = (value: number) => {
        return new Intl.NumberFormat("pt-BR").format(value || 0);
    };

    const formatPercent = (value: number) => {
        return `${(value || 0).toFixed(1)}%`;
    };

    return (
        <Card className="col-span-1 lg:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-purple-500" />
                    Ranking de VSLs (Vturb)
                </CardTitle>
                <CardDescription>Performance das suas Video Sales Letters</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>VSL</TableHead>
                                <TableHead className="text-right">Visualizações</TableHead>
                                <TableHead className="text-right">Plays</TableHead>
                                <TableHead className="text-right">Taxa de Play</TableHead>
                                <TableHead className="text-right">Finalizações</TableHead>
                                <TableHead className="text-right">Taxa Conclusão</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item, index) => {
                                const playRate = item.viewed > 0 ? (item.started / item.viewed) * 100 : 0;
                                const completionRate = item.started > 0 ? (item.finished / item.started) * 100 : 0;

                                return (
                                    <TableRow key={item.id || index} className="hover:bg-muted/50 transition-colors">
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-muted rounded-full text-purple-500">
                                                    <Play className="h-4 w-4" />
                                                </div>
                                                <span className="font-medium truncate max-w-[200px]" title={item.name}>
                                                    {item.name || item.id}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1 text-muted-foreground">
                                                <Eye className="h-3 w-3" />
                                                {formatNumber(item.viewed)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm">
                                            {formatNumber(item.started)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant={playRate > 50 ? "default" : "secondary"}>
                                                {formatPercent(playRate)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1 text-green-600">
                                                <CheckCircle className="h-3 w-3" />
                                                {formatNumber(item.finished)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant={completionRate > 30 ? "default" : "outline"}
                                                className={completionRate > 30 ? "bg-green-600" : ""}>
                                                {formatPercent(completionRate)}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}

                            {data.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        Nenhum dado de VSL encontrado no período.
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
