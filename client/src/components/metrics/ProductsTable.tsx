import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Trophy, Medal, Award } from "lucide-react";

interface Product {
  name: string;
  sales: number;
  revenue: number;
  percentage: number;
  avgTicket: number;
  growth: number;
}

interface ProductsTableProps {
  data: Product[];
}

export default function ProductsTable({ data }: ProductsTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("pt-BR").format(value);
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Award className="h-5 w-5 text-orange-600" />;
    return <span className="text-muted-foreground font-semibold">{index + 1}º</span>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ranking de Produtos</CardTitle>
        <CardDescription>Performance detalhada por produto</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Rank</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Vendas</TableHead>
                <TableHead className="text-right">Receita</TableHead>
                <TableHead className="text-right">% do Total</TableHead>
                <TableHead className="text-right">Ticket Médio</TableHead>
                <TableHead className="text-right">Crescimento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((product, index) => (
                <TableRow key={index} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {getRankIcon(index)}
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-right">{formatNumber(product.sales)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(product.revenue)}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">{product.percentage.toFixed(1)}%</Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(product.avgTicket)}</TableCell>
                  <TableCell className="text-right">
                    <span className={`flex items-center justify-end gap-1 ${product.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {product.growth >= 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      {Math.abs(product.growth).toFixed(1)}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Resumo */}
        <div className="mt-6 pt-6 border-t border-border grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total de Produtos</p>
            <p className="text-2xl font-bold">{data.length}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Receita Total</p>
            <p className="text-2xl font-bold">{formatCurrency(data.reduce((sum, p) => sum + p.revenue, 0))}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Top 3 Representam</p>
            <p className="text-2xl font-bold text-green-500">
              {data.slice(0, 3).reduce((sum, p) => sum + p.percentage, 0).toFixed(1)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
