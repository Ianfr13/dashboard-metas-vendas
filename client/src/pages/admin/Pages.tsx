import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/components/DashboardLayout";
import { Plus, Trash2, Copy, Save, Rocket, ExternalLink, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { generateTrackingUrl } from "@/lib/urlGenerator";

const WORKER_URL = "https://ab.douravita.com.br";

interface Page {
    id: number;
    name: string;
    slug: string;
    html_content: string;
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
                        html_content: editingPage.html_content
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
        if (!editingPage?.slug || !editingPage?.html_content) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) return toast.error("Não autenticado");

            const response = await fetch(`${WORKER_URL}/admin/pages`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${session.access_token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    slug: editingPage.slug,
                    html: editingPage.html_content
                })
            });

            if (response.ok) {
                toast.success("Página publicada no Edge! 🚀");
            } else {
                toast.error("Erro no deploy: " + await response.text());
            }
        } catch (e) {
            toast.error("Erro de conexão");
        }
    }

    const generatedLink = editingPage ? generateTrackingUrl({
        baseUrl: `${WORKER_URL}/${editingPage.slug}`,
        ...genParams
    } as any) : ""; // Cast any because ftype type mismatch potential

    function copyLink() {
        navigator.clipboard.writeText(generatedLink);
        toast.success("Link copiado!");
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
                                    <Label className="mb-2 block">Código HTML</Label>
                                    <Textarea
                                        className="font-mono text-xs min-h-[500px]"
                                        value={editingPage?.html_content || ""}
                                        onChange={e => setEditingPage(prev => ({ ...prev!, html_content: e.target.value }))}
                                        placeholder="<html>... Cole o código do Atomicat aqui ...</html>"
                                    />
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
                        setEditingPage({ id: 0, name: "", slug: "", html_content: "", updated_at: "" });
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
