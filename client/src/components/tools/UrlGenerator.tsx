
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { generateTrackingUrl, UrlParams } from '@/lib/urlGenerator';
import { Copy, Check, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function UrlGenerator() {
    const [params, setParams] = useState<UrlParams>({
        baseUrl: '',
        fid: '',
        fver: '',
        pver: '',
        oid: '',
        utm_source: '',
        utm_medium: '',
        utm_campaign: '',
        utm_term: '',
        utm_content: '',
    });

    const [generatedUrl, setGeneratedUrl] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        // Debounce generation slightly or just run on every change?
        // It's fast enough to run on every change.
        const url = generateTrackingUrl(params);
        setGeneratedUrl(url);
    }, [params]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setParams(prev => ({ ...prev, [name]: value }));
    };

    const handleCopy = () => {
        if (!generatedUrl) return;
        navigator.clipboard.writeText(generatedUrl);
        setCopied(true);
        toast.success('URL copiada para a área de transferência!');
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                    Gerador de URL
                </h1>
                <p className="text-muted-foreground">
                    Crie URLs rastreáveis padronizadas para suas campanhas e funis.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Inputs */}
                <div className="space-y-6">
                    <Card className="border-border/50 shadow-sm transition-all hover:shadow-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <LinkIcon className="w-5 h-5 text-primary" />
                                Configuração Base
                            </CardTitle>
                            <CardDescription>
                                Comece definindo a URL base da sua página.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="baseUrl">URL Base (Landing Page)</Label>
                                <Input
                                    id="baseUrl"
                                    name="baseUrl"
                                    placeholder="https://lp.suaempresa.com.br"
                                    value={params.baseUrl}
                                    onChange={handleChange}
                                    className="font-mono text-sm"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-sm transition-all hover:shadow-md">
                        <CardHeader>
                            <CardTitle>Identificadores do Funil (Caminho)</CardTitle>
                            <CardDescription>
                                Parâmetros que serão inseridos na estrutura da URL para rastreamento profundo.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fid">Funnel ID (fid)</Label>
                                <Input
                                    id="fid"
                                    name="fid"
                                    placeholder="ex: vsl_funnel"
                                    value={params.fid}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="fver">Funnel Version (fver)</Label>
                                <Input
                                    id="fver"
                                    name="fver"
                                    placeholder="ex: v1.0"
                                    value={params.fver}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pver">Page Version (pver)</Label>
                                <Input
                                    id="pver"
                                    name="pver"
                                    placeholder="ex: headline_a"
                                    value={params.pver}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="oid">Offer ID (oid)</Label>
                                <Input
                                    id="oid"
                                    name="oid"
                                    placeholder="ex: offer_97"
                                    value={params.oid}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="fstg">Funnel Stage (fstg)</Label>
                                <Input
                                    id="fstg"
                                    name="fstg"
                                    placeholder="ex: upsell-1, downsell"
                                    value={params.fstg}
                                    onChange={handleChange}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-sm transition-all hover:shadow-md">
                        <CardHeader>
                            <CardTitle>Parâmetros UTM (Query)</CardTitle>
                            <CardDescription>
                                Rastreamento padrão de origem de tráfego.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="utm_source">UTM Source</Label>
                                <Input
                                    id="utm_source"
                                    name="utm_source"
                                    placeholder="ex: facebook, google"
                                    value={params.utm_source}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="utm_medium">UTM Medium</Label>
                                <Input
                                    id="utm_medium"
                                    name="utm_medium"
                                    placeholder="ex: cpc, organic"
                                    value={params.utm_medium}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="utm_campaign">UTM Campaign</Label>
                                <Input
                                    id="utm_campaign"
                                    name="utm_campaign"
                                    placeholder="ex: black_friday"
                                    value={params.utm_campaign}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="utm_term">UTM Term</Label>
                                <Input
                                    id="utm_term"
                                    name="utm_term"
                                    placeholder="ex: marketing_digital"
                                    value={params.utm_term}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="utm_content">UTM Content</Label>
                                <Input
                                    id="utm_content"
                                    name="utm_content"
                                    placeholder="ex: video_01"
                                    value={params.utm_content}
                                    onChange={handleChange}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Preview & Output */}
                <div className="lg:sticky lg:top-6 h-fit space-y-6">
                    <Card className="bg-muted/30 border-primary/20 shadow-lg ring-1 ring-primary/5">
                        <CardHeader>
                            <CardTitle>Resultado Gerado</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="relative group">
                                <div className="min-h-[100px] w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm shadow-sm font-mono break-all p-4">
                                    {generatedUrl || <span className="text-muted-foreground italic">Preencha os campos para gerar a URL...</span>}
                                </div>
                                {generatedUrl && (
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className="absolute right-2 top-2 opacity-100 transition-opacity"
                                        onClick={handleCopy}
                                    >
                                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                )}
                            </div>

                            <Button
                                onClick={handleCopy}
                                disabled={!generatedUrl}
                                className="w-full h-11 text-base font-semibold shadow-md active:scale-[0.98] transition-transform"
                            >
                                {copied ? (
                                    <>
                                        <Check className="mr-2 h-5 w-5" />
                                        Copiado!
                                    </>
                                ) : (
                                    <>
                                        <Copy className="mr-2 h-5 w-5" />
                                        Copiar URL
                                    </>
                                )}
                            </Button>

                            <div className="rounded-md bg-blue-500/10 p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <AlertCircle className="h-5 w-5 text-blue-400" aria-hidden="true" />
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-blue-400">Dica de Configuração</h3>
                                        <div className="mt-2 text-sm text-blue-400/90">
                                            <p>
                                                Certifique-se de configurar o Google Tag Manager para extrair os parâmetros
                                                <strong> fid, fver, pver, oid, fstg</strong> diretamente da URL (Page Path).
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
