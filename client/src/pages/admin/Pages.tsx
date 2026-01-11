import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import DashboardLayout from "@/components/DashboardLayout";
import { Plus, Trash2, Copy, Save, Rocket, ExternalLink, RefreshCw, Gauge, Zap, Globe, Activity, Video, Eye, CloudOff, CheckCircle2, AlertCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
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

    tracking_params?: any;
    vturb_config?: VTurbConfig;
    is_published?: boolean;
    published_slug?: string;
    updated_at: string;
}

interface VTurbVideo {
    id: string;
    delay: number;
}

interface VTurbConfig {
    enabled: boolean;
    videos: VTurbVideo[];
}

const DEFAULT_VTURB_CONFIG: VTurbConfig = {
    enabled: false,
    videos: [{ id: '', delay: 10 }]
};

const DEFAULT_GEN_PARAMS = {
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
};

export default function Pages() {
    const [pages, setPages] = useState<Page[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPage, setEditingPage] = useState<Page | null>(null);
    const [showForm, setShowForm] = useState(false);

    // Generator State
    const [genParams, setGenParams] = useState(DEFAULT_GEN_PARAMS);

    // VTurb Config State
    const [vturbConfig, setVturbConfig] = useState<VTurbConfig>(DEFAULT_VTURB_CONFIG);

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

    async function handleDelete(page: Page) {
        try {
            // If published, remove from KV first
            if (page.is_published && page.published_slug) {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.access_token) {
                    await fetch(`${WORKER_URL}/admin/pages?slug=${page.published_slug}`, {
                        method: "DELETE",
                        headers: { "Authorization": `Bearer ${session.access_token}` }
                    });
                }
            }

            // Delete from DB
            const { error } = await supabase.from("pages").delete().eq("id", page.id);
            if (error) throw error;

            toast.success("Página excluída com sucesso");
            setShowForm(false);
            setEditingPage(null);
            fetchPages();
        } catch (e: any) {
            toast.error("Erro ao excluir: " + e.message);
        }
    }

    async function handleUnpublish() {
        if (!editingPage?.id) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) return toast.error("Sessão expirada");

            const slugToRemove = editingPage.published_slug || editingPage.slug;

            // Remove from KV
            const response = await fetch(`${WORKER_URL}/admin/pages?slug=${slugToRemove}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${session.access_token}` }
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            // Update DB
            await supabase.from("pages").update({
                is_published: false,
                published_slug: null
            }).eq("id", editingPage.id);

            setEditingPage(prev => prev ? { ...prev, is_published: false, published_slug: undefined } : null);
            toast.success("Página despublicada");
            fetchPages();
        } catch (e: any) {
            toast.error("Erro ao despublicar: " + e.message);
        }
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

                        tracking_params: genParams,
                        vturb_config: vturbConfig,
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
                        footer_code: editingPage.footer_code,
                        tracking_params: genParams,
                        vturb_config: vturbConfig
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

            // Inject scripts into HTML
            let finalHtml = editingPage.html_content;

            if (editingPage.head_code) {
                finalHtml = finalHtml.replace("</head>", `${editingPage.head_code}</head>`);
            }
            if (editingPage.body_code) {
                finalHtml = finalHtml.replace("<body", `<body ${editingPage.body_code.includes("<") ? "" : ""}`); // Just in case, but usually body_code goes inside body tag? No, usually after.
                // Standard injection points:
                // Head: before </head>
                // Body Start: after <body ...>
                // Footer: before </body>

                // Simplest injection for Body Start (regex to find start of body tag and append after it closes)
                // This is complex regex. Let's assume user wants it immediately after <body> opening.
                finalHtml = finalHtml.replace(/<body[^>]*>/i, (match) => `${match}\n${editingPage.body_code}`);
            }
            if (editingPage.footer_code) {
                finalHtml = finalHtml.replace("</body>", `${editingPage.footer_code}\n</body>`);
            }

            // VTurb Delay Script Injection
            if (vturbConfig.enabled && vturbConfig.videos.some(v => v.id.trim())) {
                const listPitchEntries = vturbConfig.videos
                    .filter(v => v.id.trim())
                    .map(v => `'${v.id.trim()}': { delay: ${v.delay} }`)
                    .join(',\n    ');

                const vturbScript = `
<script>
var listPitch = {
    ${listPitchEntries}
};
var alreadyInitialized = false;
document.addEventListener('player:ready', function(event) {
    if (alreadyInitialized) return;
    var detail = event.detail || {};
    var config = detail.config || {};
    var player = detail.player || document.querySelector('vturb-smartplayer');
    var playerId = config.id;
    var pitchConfig = listPitch[playerId];
    if (!playerId || !pitchConfig) return;
    alreadyInitialized = true;
    player.displayHiddenElements(pitchConfig.delay, ['.esconder'], { persist: true });
});
</script>`;
                finalHtml = finalHtml.replace("</body>", `${vturbScript}\n</body>`);
            }

            // Smart Republish: If slug changed, delete old from KV
            if (editingPage.published_slug && editingPage.published_slug !== editingPage.slug) {
                await fetch(`${WORKER_URL}/admin/pages?slug=${editingPage.published_slug}`, {
                    method: "DELETE",
                    headers: { "Authorization": `Bearer ${session.access_token}` }
                });
            }

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
                // Update DB with published status
                await supabase.from("pages").update({
                    is_published: true,
                    published_slug: editingPage.slug
                }).eq("id", editingPage.id);

                setEditingPage(prev => prev ? { ...prev, is_published: true, published_slug: editingPage.slug } : null);
                toast.success("Sucesso! Página publicada no Edge. 🚀");
                fetchPages();
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
                        <div className="flex gap-2 items-center">
                            {/* Status Indicator */}
                            {editingPage?.is_published ? (
                                <span className="flex items-center gap-1 text-sm text-green-600 bg-green-100 px-3 py-1 rounded-full">
                                    <CheckCircle2 className="h-4 w-4" /> Publicado
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">
                                    <AlertCircle className="h-4 w-4" /> Rascunho
                                </span>
                            )}

                            <Button variant="outline" onClick={handleSave}>
                                <Save className="h-4 w-4 mr-2" /> Salvar (Backup)
                            </Button>

                            {/* Unpublish Button (only if published) */}
                            {editingPage?.is_published && (
                                <Button variant="outline" onClick={handleUnpublish} className="text-orange-600 hover:text-orange-700">
                                    <CloudOff className="h-4 w-4 mr-2" /> Despublicar
                                </Button>
                            )}

                            <Button onClick={handleDeploy} className="bg-green-600 hover:bg-green-700">
                                <Rocket className="h-4 w-4 mr-2" /> Publicar (Live)
                            </Button>

                            {/* Delete Button with Confirmation */}
                            {editingPage?.id && editingPage.id > 0 && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="outline" className="text-destructive hover:text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Excluir Página?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta ação não pode ser desfeita. A página "{editingPage.name}" será removida permanentemente.
                                                {editingPage.is_published && " Ela também será removida do servidor (Edge)."}
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(editingPage)} className="bg-destructive hover:bg-destructive/90">
                                                Excluir
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}

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
                                    {/* TABS PARA HTML e SCRIPTS */}
                                    <Tabs defaultValue="html">
                                        <TabsList className="mb-4">
                                            <TabsTrigger value="html">Principal (HTML)</TabsTrigger>
                                            <TabsTrigger value="scripts">Scripts (Injeção)</TabsTrigger>
                                            <TabsTrigger value="vturb"><Video className="h-4 w-4 mr-1" /> VTurb Delay</TabsTrigger>
                                            <TabsTrigger value="preview"><Eye className="h-4 w-4 mr-1" /> Preview</TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="html">
                                            <Label className="mb-2 block">Código HTML Completo</Label>
                                            <Textarea
                                                className="font-mono text-xs min-h-[500px]"
                                                value={editingPage?.html_content || ""}
                                                onChange={e => setEditingPage(prev => ({ ...prev!, html_content: e.target.value }))}
                                                placeholder="<html>... Cole o código do Atomicat aqui ...</html>"
                                            />
                                        </TabsContent>

                                        <TabsContent value="scripts" className="space-y-4">
                                            <div>
                                                <Label>Head Code (Antes de &lt;/head&gt;)</Label>
                                                <Textarea
                                                    className="font-mono text-xs min-h-[150px]"
                                                    value={editingPage?.head_code || ""}
                                                    onChange={e => setEditingPage(prev => ({ ...prev!, head_code: e.target.value }))}
                                                    placeholder="<script>... (Google Analytics, Pixel, etc)</script>"
                                                />
                                            </div>
                                            <div>
                                                <Label>Body Start (Logo após &lt;body&gt;)</Label>
                                                <Textarea
                                                    className="font-mono text-xs min-h-[150px]"
                                                    value={editingPage?.body_code || ""}
                                                    onChange={e => setEditingPage(prev => ({ ...prev!, body_code: e.target.value }))}
                                                    placeholder="<noscript>... (GTM Body)</noscript>"
                                                />
                                            </div>
                                            <div>
                                                <Label>Footer Code (Antes de &lt;/body&gt;)</Label>
                                                <Textarea
                                                    className="font-mono text-xs min-h-[150px]"
                                                    value={editingPage?.footer_code || ""}
                                                    onChange={e => setEditingPage(prev => ({ ...prev!, footer_code: e.target.value }))}
                                                    placeholder="<script>... (Scripts de fechamento)</script>"
                                                />
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="vturb" className="space-y-4">
                                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                                <div>
                                                    <Label className="text-base font-medium">Ativar Script de Delay</Label>
                                                    <p className="text-sm text-muted-foreground">Injeta automaticamente o script de delay do VTurb</p>
                                                </div>
                                                <Switch
                                                    checked={vturbConfig.enabled}
                                                    onCheckedChange={(checked) => setVturbConfig(prev => ({ ...prev, enabled: checked }))}
                                                />
                                            </div>

                                            {vturbConfig.enabled && (
                                                <div className="space-y-3">
                                                    <Label>Vídeos Configurados</Label>
                                                    {vturbConfig.videos.map((video, index) => (
                                                        <div key={index} className="flex items-center gap-2">
                                                            <Input
                                                                className="flex-1 font-mono text-xs"
                                                                placeholder="ID do Vídeo (ex: abc123xyz)"
                                                                value={video.id}
                                                                onChange={e => {
                                                                    const newVideos = [...vturbConfig.videos];
                                                                    newVideos[index].id = e.target.value;
                                                                    setVturbConfig(prev => ({ ...prev, videos: newVideos }));
                                                                }}
                                                            />
                                                            <Input
                                                                type="number"
                                                                className="w-24"
                                                                placeholder="Delay (s)"
                                                                value={video.delay}
                                                                onChange={e => {
                                                                    const newVideos = [...vturbConfig.videos];
                                                                    newVideos[index].delay = parseInt(e.target.value) || 10;
                                                                    setVturbConfig(prev => ({ ...prev, videos: newVideos }));
                                                                }}
                                                            />
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => {
                                                                    if (vturbConfig.videos.length > 1) {
                                                                        const newVideos = vturbConfig.videos.filter((_, i) => i !== index);
                                                                        setVturbConfig(prev => ({ ...prev, videos: newVideos }));
                                                                    }
                                                                }}
                                                                disabled={vturbConfig.videos.length <= 1}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setVturbConfig(prev => ({
                                                            ...prev,
                                                            videos: [...prev.videos, { id: '', delay: 10 }]
                                                        }))}
                                                    >
                                                        <Plus className="h-4 w-4 mr-1" /> Adicionar Vídeo
                                                    </Button>
                                                </div>
                                            )}
                                        </TabsContent>

                                        <TabsContent value="preview" className="space-y-4">
                                            <div className="border rounded-lg overflow-hidden bg-white">
                                                <div className="bg-muted px-4 py-2 flex items-center gap-2 border-b">
                                                    <Eye className="h-4 w-4" />
                                                    <span className="text-sm font-medium">Preview (Sem Cache)</span>
                                                </div>
                                                {editingPage?.html_content ? (
                                                    <iframe
                                                        srcDoc={editingPage.html_content}
                                                        sandbox="allow-scripts allow-same-origin"
                                                        className="w-full h-[600px] border-0"
                                                        title="Page Preview"
                                                    />
                                                ) : (
                                                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                                        Cole o HTML na aba Principal para visualizar
                                                    </div>
                                                )}
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
                        setEditingPage({
                            id: 0,
                            name: "",
                            slug: "",
                            html_content: "",
                            head_code: "",  // Default empty
                            body_code: "",
                            footer_code: "",
                            tracking_params: {}, // Empty params for new page
                            updated_at: ""
                        });
                        setGenParams(DEFAULT_GEN_PARAMS);
                        setVturbConfig(DEFAULT_VTURB_CONFIG);
                        setShowForm(true);
                    }}>
                        <Plus className="h-4 w-4 mr-2" /> Nova Página
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pages.map(page => (
                        <Card key={page.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
                            setEditingPage(page);
                            if (page.tracking_params) {
                                setGenParams({ ...DEFAULT_GEN_PARAMS, ...page.tracking_params });
                            } else {
                                setGenParams(DEFAULT_GEN_PARAMS);
                            }
                            if (page.vturb_config) {
                                setVturbConfig({ ...DEFAULT_VTURB_CONFIG, ...page.vturb_config });
                            } else {
                                setVturbConfig(DEFAULT_VTURB_CONFIG);
                            }
                            setShowForm(true);
                        }}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">{page.name}</CardTitle>
                                    {page.is_published ? (
                                        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                                            <CheckCircle2 className="h-3 w-3" /> Publicado
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                            <AlertCircle className="h-3 w-3" /> Rascunho
                                        </span>
                                    )}
                                </div>
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
