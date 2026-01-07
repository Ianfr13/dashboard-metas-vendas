import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, ShoppingCart, CreditCard, CheckCircle, Eye, MousePointerClick, Heart } from "lucide-react";

interface FunnelStep {
    label: string;
    value: number;
    icon: React.ElementType;
    color: string;
    dropOff?: number;
}

interface AdvancedFunnelProps {
    data: {
        pageViews: number;
        addToWishlist: number;
        addToCart: number; // We need to ensure we have this data
        checkouts: number;
        purchases: number;
    };
}

export default function AdvancedFunnel({ data }: AdvancedFunnelProps) {
    // Calculate relative percentages for visual bars
    const maxValue = Math.max(data.pageViews, 1);

    const steps: FunnelStep[] = [
        {
            label: "Visualizações",
            value: data.pageViews,
            icon: Eye,
            color: "bg-blue-500",
            dropOff: data.pageViews > 0 ? ((data.pageViews - data.addToWishlist) / data.pageViews) * 100 : 0
        },
        {
            label: "Lista de Desejos",
            value: data.addToWishlist,
            icon: Heart,
            color: "bg-pink-500",
            dropOff: data.addToWishlist > 0 ? ((data.addToWishlist - data.addToCart) / data.addToWishlist) * 100 : 0
        },
        {
            label: "Adicionou ao Carrinho",
            value: data.addToCart,
            icon: ShoppingCart,
            color: "bg-purple-500",
            dropOff: data.addToCart > 0 ? ((data.addToCart - data.checkouts) / data.addToCart) * 100 : 0
        },
        {
            label: "Iniciou Checkout",
            value: data.checkouts,
            icon: CreditCard,
            color: "bg-orange-500",
            dropOff: data.checkouts > 0 ? ((data.checkouts - data.purchases) / data.checkouts) * 100 : 0
        },
        {
            label: "Comprou",
            value: data.purchases,
            icon: CheckCircle,
            color: "bg-green-500"
        },
    ];

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Jornada de Compra (Funil Avançado)</CardTitle>
                <CardDescription>Análise detalhada da conversão em cada etapa</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {steps.map((step, index) => {
                        const isLast = index === steps.length - 1;
                        const percentageOfMax = (step.value / maxValue) * 100;
                        const prevValue = index > 0 ? steps[index - 1].value : step.value;
                        const conversionRate = prevValue > 0 ? (step.value / prevValue) * 100 : 0;

                        // Allow simplified view if we lack data for intermediate steps (e.g. viewItem == 0)
                        // But for now render all to encourage fixing data

                        return (
                            <div key={index} className="relative">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className={`p-2 rounded-lg ${step.color} bg-opacity-10 text-white`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step.color}`}>
                                            <step.icon className="w-4 h-4 text-white" />
                                        </div>
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-medium text-sm">{step.label}</span>
                                            <span className="font-bold">{step.value.toLocaleString()}</span>
                                        </div>

                                        <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${step.color}`}
                                                style={{ width: `${Math.max(percentageOfMax, 1)}%` }} // Always show at least a tiny bar
                                            />
                                        </div>
                                    </div>
                                </div>

                                {!isLast && (
                                    <div className="pl-6 ml-4 border-l-2 border-dashed border-gray-200 h-8 flex items-center">
                                        <div className="ml-4 flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                                            <ArrowRight className="w-3 h-3" />
                                            <span>Conversão: <span className={conversionRate < 30 ? "text-red-500 font-bold" : "text-green-600 font-bold"}>{(conversionRate || 0).toFixed(1)}%</span></span>
                                            {step.dropOff !== undefined && step.dropOff > 0 && (
                                                <span className="text-gray-400">({(step.dropOff || 0).toFixed(1)}% desistiram)</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
