import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import DashboardLayout from "@/components/DashboardLayout";
import { Plus, Trash2, Copy, Save, Rocket, ExternalLink, RefreshCw, Gauge, Zap, Globe, Activity } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { generateTrackingUrl } from "@/lib/urlGenerator";

const WORKER_URL = "https://ab.douravita.com.br";

interface Page {
    id: number;
    name: string;
    slug: string;
    html_content: string;
    head_code?: string;
    body_code?: string;
    footer_code?: string;
    updated_at: string;
}

export default function Pages() {
    const [pages, setPages] = useState<Page[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPage, setEditingPage] = useState<Page | null>(null);
    const [showForm, setShowForm] = useState(false);

    // Generator State
    const [genParams, setGenParams] = useState({
        fid: "",
        ftype: "compra",
        fver: "",
        pver: "",
        oid: "",
        fstg: "",
        utm_medium: "",
        utm_campaign: "",
        utm_term: "",
        utm_content: ""
    });

    useEffect(() => {
        fetchPages();
    }, []);

    async function fetchPages() {
        const { data, error } = await supabase
            .from("pages")
            .select("*")
            .order("updated_at", { ascending: false });

        if (error) console.error(error);
        if (data) setPages(data);
        setLoading(false);
    }

    async function handleSave() {
        if (!editingPage?.name || !editingPage?.slug) {
            return toast.error("Nome e Slug são obrigatórios");
        }

        try {
            let result;
            if (editingPage.id) {
                // Update
                result = await supabase
                    .from("pages")
                    .update({
                        name: editingPage.name,
                        slug: editingPage.slug,
                        html_content: editingPage.html_content,
                        head_code: editingPage.head_code,
                        body_code: editingPage.body_code,
                        footer_code: editingPage.footer_code,
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", editingPage.id)
                    .select()
                    .single();
            } else {
                // Create
                result = await supabase
                    .from("pages")
                    .insert({
                        name: editingPage.name,
                        slug: editingPage.slug,
                        html_content: editingPage.html_content,
                        head_code: editingPage.head_code,
                        body_code: editingPage.body_code,
                        footer_code: editingPage.footer_code
                    })
                    .select()
                    .single();
            }

            if (result.error) throw result.error;

            toast.success("Página salva no Banco (Backup)");
            setEditingPage(result.data);
            fetchPages();

            // Se já salvou no banco, oferecemos deploy
            if (!editingPage.id) {
                // Se é novo, setamos o ID para permitir deploy
                setEditingPage(result.data);
            }
        } catch (error: any) {
            toast.error("Erro ao salvar: " + error.message);
        }
    }

    async function handleDeploy() {
        if (!editingPage?.slug) return toast.error("Preencha o Slug (URL) antes de publicar");
        if (!editingPage?.html_content) return toast.error("Cole o conteúdo HTML antes de publicar");

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) return toast.error("Sua sessão expirou. Faça login novamente.");

            const toastId = toast.loading("Preparando e Publicando...");

            // --- INJECTION LOGIC ---
            let finalHtml = editingPage.html_content;

            // Inject Head Code
            if (editingPage.head_code) {
                if (finalHtml.includes("</head>")) {
                    finalHtml = finalHtml.replace("</head>", `\n${editingPage.head_code}\n</head>`);
                } else {
                    // Fallback
                    finalHtml = `${editingPage.head_code}\n${finalHtml}`;
                }
            }

            // Inject Body Start Code
            if (editingPage.body_code) {
                const bodyMatch = finalHtml.match(/<body[^>]*>/);
                if (bodyMatch) {
                    finalHtml = finalHtml.replace(bodyMatch[0], `${bodyMatch[0]}\n${editingPage.body_code}\n`);
                } else {
                    finalHtml = `${editingPage.body_code}\n${finalHtml}`;
                }
            }

            // Inject Footer Code (Body End)
            if (editingPage.footer_code) {
                if (finalHtml.includes("</body>")) {
                    finalHtml = finalHtml.replace("</body>", `\n${editingPage.footer_code}\n</body>`);
                } else {
                    finalHtml = `${finalHtml}\n${editingPage.footer_code}`;
                }
            }
            // -----------------------

            const response = await fetch(`${WORKER_URL}/admin/pages`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${session.access_token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    slug: editingPage.slug,
                    html: finalHtml
                })
            });

            toast.dismiss(toastId);

            if (response.ok) {
                toast.success("Sucesso! Página publicada no Edge. 🚀");
            } else {
                const text = await response.text();
                toast.error(`Falha no deploy: ${text}`);
            }
        } catch (e: any) {
            console.error(e);
            toast.error(`Erro de conexão: ${e.message}`);
        }
    }

    const generatedLink = editingPage?.slug ? generateTrackingUrl({
        baseUrl: `${WORKER_URL}/${editingPage.slug}`,
        ...genParams
    } as any) : "";



    async function copyLink() {
        if (!generatedLink) return toast.error("Link vazio");
        try {
            await navigator.clipboard.writeText(generatedLink);
            toast.success("Link copiado para a área de transferência!");
        } catch (err) {
            toast.error("Erro ao copiar link manually");
        }
    }

    const [isTestingSpeed, setIsTestingSpeed] = useState(false);
    const [speedResult, setSpeedResult] = useState<number | null>(null);

    async function runSpeedTest() {
        if (!editingPage?.slug) return toast.error("Precisa de uma URL");

        setIsTestingSpeed(true);
        setSpeedResult(null);

        try {
            const start = performance.now();
            await fetch(`${WORKER_URL}/${editingPage.slug}`, { cache: 'no-store' });
            const end = performance.now();
            const duration = Math.round(end - start);
            setSpeedResult(duration);

            if (duration < 100) toast.success(`Incrível! ${duration}ms ⚡`);
            else if (duration < 500) toast.success(`Rápido! ${duration}ms 🚀`);
            else toast("Teste concluído: " + duration + "ms");

        } catch (e) {
            toast.error("Erro ao testar velocidade");
        } finally {
            setIsTestingSpeed(false);
        }
    }

    if (loading) return <DashboardLayout><p>Carregando...</p></DashboardLayout>;

    if (showForm || editingPage) {
        return (
            <DashboardLayout>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Button variant="ghost" onClick={() => { setShowForm(false); setEditingPage(null); }}>← Voltar</Button>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleSave}>
                                <Save className="h-4 w-4 mr-2" /> Salvar (Backup)
                            </Button>
                            <Button onClick={handleDeploy} className="bg-green-600 hover:bg-green-700">
                                <Rocket className="h-4 w-4 mr-2" /> Publicar (Live)
                            </Button>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" title="Testar Velocidade Global">
                                        <Gauge className="h-4 w-4 mr-2" /> Speed Test
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Teste de Performance (Turbo)</DialogTitle>
                                        <DialogDescription>
                                            Verifique a velocidade da sua página no Edge.
                                        </DialogDescription>
                                    </DialogHeader>

                                    <div className="space-y-6 py-4">
                                        {/* Local Test */}
                                        <div className="space-y-2 border p-4 rounded-md">
                                            <h3 className="font-medium flex items-center gap-2">
                                                <Zap className="h-4 w-4 text-yellow-500" /> Teste Local (Você)
                                            </h3>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">Latência Real (TTFB):</span>
                                                <span className="text-2xl font-bold font-mono">
                                                    {speedResult ? `${speedResult}ms` : "---"}
                                                </span>
                                            </div>
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="w-full mt-2"
                                                onClick={runSpeedTest}
                                                disabled={!editingPage?.slug}
                                            >
                                                {isTestingSpeed ? "Testando..." : "Medir Agora"}
                                            </Button>
                                        </div>

                                        {/* Global External Tests */}
                                        <div className="space-y-2">
                                            <h3 className="font-medium flex items-center gap-2">
                                                <Globe className="h-4 w-4 text-blue-500" /> Teste Global (Ferramentas)
                                            </h3>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button variant="outline" className="w-full justify-start" asChild>
                                                    <a
                                                        href={`https://tools.keycdn.com/performance?url=${encodeURIComponent(`${WORKER_URL}/${editingPage?.slug}`)}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        <Activity className="h-4 w-4 mr-2" />
                                                        KeyCDN (10 Países)
                                                    </a>
                                                </Button>
                                                <Button variant="outline" className="w-full justify-start" asChild>
                                                    <a
                                                        href={`https://pagespeed.web.dev/analysis?url=${encodeURIComponent(`${WORKER_URL}/${editingPage?.slug}`)}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        <Zap className="h-4 w-4 mr-2" />
                                                        Google Pagespeed
                                                    </a>
                                                </Button>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                *O KeyCDN testa sua página a partir de 10 locais diferentes do mundo simultaneamente. Ideal para verificar a CDN.
                                            </p>
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Editor Column */}
                        <div className="lg:col-span-2 space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Editor</CardTitle>
                                    <div className="flex gap-4">
                                        <div className="flex-1 space-y-2">
                                            <Label>Nome Interno</Label>
                                            <Input
                                                value={editingPage?.name || ""}
                                                onChange={e => setEditingPage(prev => ({ ...prev!, name: e.target.value }))}
                                                placeholder="Ex: VSL 01 - Headline Nova"
                                            />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <Label>Slug (URL)</Label>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-muted-foreground">/</span>
                                                <Input
                                                    value={editingPage?.slug || ""}
                                                    onChange={e => setEditingPage(prev => ({ ...prev!, slug: e.target.value }))}
                                                    placeholder="vsl-01"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Tabs defaultValue="html" className="w-full">
                                        <TabsList className="grid w-full grid-cols-2 mb-4">
                                            <TabsTrigger value="html">Principal (HTML)</TabsTrigger>
                                            <TabsTrigger value="scripts">Scripts (Injeção)</TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="html">
                                            <Label className="mb-2 block">Código HTML Principal</Label>
                                            <Textarea
                                                className="font-mono text-xs min-h-[500px]"
                                                value={editingPage?.html_content || ""}
                                                onChange={e => setEditingPage(prev => ({ ...prev!, html_content: e.target.value }))}
                                                placeholder="<html>... Cole o código do Atomicat aqui ...</html>"
                                            />
                                        </TabsContent>

                                        <TabsContent value="scripts" className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Header (Antes de &lt;/head&gt;)</Label>
                                                <p className="text-xs text-muted-foreground">Ideal para Meta Pixel, GTM (Head), Preloads</p>
                                                <Textarea
                                                    className="font-mono text-xs min-h-[150px]"
                                                    value={editingPage?.head_code || ""}
                                                    onChange={e => setEditingPage(prev => ({ ...prev!, head_code: e.target.value }))}
                                                    placeholder="<script>...</script>"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Começo do Body (Depois de &lt;body&gt;)</Label>
                                                <p className="text-xs text-muted-foreground">Ideal para GTM (NoScript)</p>
                                                <Textarea
                                                    className="font-mono text-xs min-h-[100px]"
                                                    value={editingPage?.body_code || ""}
                                                    onChange={e => setEditingPage(prev => ({ ...prev!, body_code: e.target.value }))}
                                                    placeholder="<noscript>...</noscript>"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label>Fim do Body (Antes de &lt;/body&gt;)</Label>
                                                <p className="text-xs text-muted-foreground">Ideal para Scripts de fechamento, Utilitários</p>
                                                <Textarea
                                                    className="font-mono text-xs min-h-[100px]"
                                                    value={editingPage?.footer_code || ""}
                                                    onChange={e => setEditingPage(prev => ({ ...prev!, footer_code: e.target.value }))}
                                                    placeholder="<script>...</script>"
                                                />
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Generator Column */}
                        <div className="lg:col-span-1">
                            <Card className="sticky top-6">
                                <CardHeader>
                                    <CardTitle>Gerador de Links</CardTitle>
                                    <CardDescription>Configure os parâmetros para seus anúncios</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Funnel ID (fid)</Label>
                                        <Input value={genParams.fid} onChange={e => setGenParams({ ...genParams, fid: e.target.value })} placeholder="Ex: 123" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-2">
                                            <Label>Funnel Ver (fver)</Label>
                                            <Input value={genParams.fver} onChange={e => setGenParams({ ...genParams, fver: e.target.value })} placeholder="v1" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Page Ver (pver)</Label>
                                            <Input value={genParams.pver} onChange={e => setGenParams({ ...genParams, pver: e.target.value })} placeholder="v2" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-2">
                                            <Label>Offer ID (oid)</Label>
                                            <Input value={genParams.oid} onChange={e => setGenParams({ ...genParams, oid: e.target.value })} placeholder="off_123" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Estágio (fstg)</Label>
                                            <Input value={genParams.fstg} onChange={e => setGenParams({ ...genParams, fstg: e.target.value })} placeholder="vsl" />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Tipo (ftype)</Label>
                                        <select
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                            value={genParams.ftype}
                                            onChange={e => setGenParams({ ...genParams, ftype: e.target.value })}
                                        >
                                            <option value="compra">Compra</option>
                                            <option value="leads">Leads</option>
                                        </select>
                                    </div>

                                    <div className="pt-4 border-t">
                                        <Label>Link Final</Label>
                                        <div className="flex gap-2 mt-2">
                                            <Input readOnly value={generatedLink} className="bg-muted text-xs" />
                                            <Button size="icon" onClick={copyLink} disabled={!editingPage?.slug}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        {editingPage?.slug && (
                                            <Button variant="link" size="sm" className="w-full mt-1" onClick={() => window.open(generatedLink, '_blank')}>
                                                Testar Link <ExternalLink className="h-3 w-3 ml-1" />
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">Páginas (CMS)</h2>
                        <p className="text-muted-foreground">Hospedagem de páginas de alta performance</p>
                    </div>
                    <Button onClick={() => {
                        setEditingPage({ id: 0, name: "", slug: "", html_content: "", head_code: "", body_code: "", footer_code: "", updated_at: "" });
                        setShowForm(true);
                    }}>
                        <Plus className="h-4 w-4 mr-2" /> Nova Página
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pages.map(page => (
                        <Card key={page.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setEditingPage(page); setShowForm(true); }}>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg">{page.name}</CardTitle>
                                <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded w-fit">/{page.slug}</code>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xs text-muted-foreground flex items-center gap-2">
                                    <RefreshCw className="h-3 w-3" />
                                    Atualizado em {new Date(page.updated_at).toLocaleDateString()}
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {pages.length === 0 && (
                        <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                            Nenhuma página criada ainda.
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
