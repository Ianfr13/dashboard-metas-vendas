import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/components/DashboardLayout";
import { Plus, Trash2, Copy, Play, Pause, Zap, FileText, Gauge, Loader2, RotateCcw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface Variant {
    id?: number;
    name: string;
    url: string;
    weight: number;
    visits: number;
}

interface ABTest {
    id: number;
    name: string;
    slug: string;
    status: string;
    variants: Variant[];
}

const WORKER_URL = "https://ab.douravita.com.br";

interface CMSPage {
    id: number;
    name: string;
    slug: string;
    is_published?: boolean;
}

export default function ABTests() {
    const [tests, setTests] = useState<ABTest[]>([]);
    const [loading, setLoading] = useState(true);
    const [newTest, setNewTest] = useState({ name: "", variants: [{ name: "A", url: "", weight: 50, visits: 0 }, { name: "B", url: "", weight: 50, visits: 0 }] });
    const [showForm, setShowForm] = useState(false);
    const [cmsPages, setCmsPages] = useState<CMSPage[]>([]);
    const [speedTests, setSpeedTests] = useState<Record<number, { loading: boolean; speed?: number; cached?: boolean }>>({});

    useEffect(() => {
        fetchTests();
        fetchCmsPages();
    }, []);

    async function fetchCmsPages() {
        const { data } = await supabase
            .from("pages")
            .select("id, name, slug, is_published")
            .eq("is_published", true)
            .order("name");
        if (data) setCmsPages(data);
    }

    async function fetchTests() {
        const { data: testsData } = await supabase.from("ab_tests").select("*").order("created_at", { ascending: false });
        if (!testsData) return setLoading(false);

        const testsWithVariants = await Promise.all(
            testsData.map(async (test) => {
                const { data: variants } = await supabase.from("ab_test_variants").select("*").eq("test_id", test.id);
                return { ...test, variants: variants || [] };
            })
        );
        setTests(testsWithVariants);
        setLoading(false);
    }

    // Clean Cache
    async function purgeCache(slug: string) {
        try {
            // Pegar sessão atual do usuário
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
                console.error("Usuário não autenticado");
                toast.error("Erro ao limpar cache: Usuário não logado");
                return;
            }

            const response = await fetch(`${WORKER_URL}/admin/purge?slug=${slug}`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${session.access_token}`
                }
            });

            if (response.ok) {
                toast.success("Cache limpo instantaneamente (Edge)");
            } else {
                console.error("Erro ao limpar cache:", await response.text());
            }
        } catch (e) {
            console.error("Erro ao limpar cache", e);
        }
    }

    // Create test
    async function createTest() {
        if (!newTest.name || newTest.variants.some(v => !v.url)) {
            return toast.error("Preencha todos os campos");
        }

        const { data: test, error } = await supabase.from("ab_tests").insert({ name: newTest.name }).select().single();
        if (error) return toast.error(error.message);

        await supabase.from("ab_test_variants").insert(
            newTest.variants.map(v => ({ test_id: test.id, name: v.name, url: v.url, weight: v.weight }))
        );

        toast.success("Teste criado!");
        // Não precisa limpar cache na criação (slug novo), mas mal não faz
        purgeCache(test.slug);

        setShowForm(false);
        setNewTest({ name: "", variants: [{ name: "A", url: "", weight: 50, visits: 0 }, { name: "B", url: "", weight: 50, visits: 0 }] });
        fetchTests();
    }

    // Toggle status
    async function toggleStatus(test: ABTest) {
        const newStatus = test.status === "active" ? "paused" : "active";
        await supabase.from("ab_tests").update({ status: newStatus }).eq("id", test.id);

        // Limpa cache automaticamente
        purgeCache(test.slug);

        fetchTests();
    }

    // Delete test
    async function deleteTest(test: ABTest) {
        if (!confirm("Deletar este teste?")) return;
        await supabase.from("ab_tests").delete().eq("id", test.id);

        // Limpa cache para garantir que suma da edge
        purgeCache(test.slug);

        toast.success("Teste deletado");
        fetchTests();
    }

    // Copy URL
    function copyUrl(slug: string) {
        navigator.clipboard.writeText(`${WORKER_URL}/${slug}`);
        toast.success("URL copiada!");
    }

    // Reset visits
    async function resetVisits(test: ABTest) {
        if (!confirm(`Zerar visitas do teste "${test.name}"?`)) return;

        // Update all variants to 0 visits
        for (const variant of test.variants) {
            if (variant.id) {
                await supabase.from("ab_test_variants").update({ visits: 0 }).eq("id", variant.id);
            }
        }

        toast.success("Visitas zeradas!");
        fetchTests();
    }

    // Speed/Cache Test
    async function testSpeed(test: ABTest) {
        setSpeedTests(prev => ({ ...prev, [test.id]: { loading: true } }));

        try {
            const start = performance.now();
            const response = await fetch(`${WORKER_URL}/${test.slug}`, {
                cache: 'no-store',
                method: 'HEAD'
            });
            const end = performance.now();
            const speed = Math.round(end - start);

            // Check cache header
            const cacheStatus = response.headers.get('cf-cache-status');
            const cached = cacheStatus === 'HIT';

            setSpeedTests(prev => ({ ...prev, [test.id]: { loading: false, speed, cached } }));

            if (speed < 100) {
                toast.success(`⚡ ${speed}ms ${cached ? '(Cache HIT)' : '(Cache MISS)'}`);
            } else {
                toast(`${speed}ms ${cached ? '(Cache HIT)' : '(Cache MISS)'}`);
            }
        } catch (e) {
            setSpeedTests(prev => ({ ...prev, [test.id]: { loading: false } }));
            toast.error("Erro ao testar velocidade");
        }
    }

    if (loading) return <DashboardLayout><p>Carregando...</p></DashboardLayout>;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Testes A/B</h2>
                    <Button onClick={() => setShowForm(!showForm)}>
                        <Plus className="h-4 w-4 mr-2" /> Novo Teste
                    </Button>
                </div>

                {/* Create form */}
                {showForm && (
                    <Card>
                        <CardHeader><CardTitle>Novo Teste</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <Input
                                placeholder="Nome do teste (ex: Black Friday)"
                                value={newTest.name}
                                onChange={e => setNewTest({ ...newTest, name: e.target.value })}
                            />
                            {newTest.variants.map((v, i) => (
                                <div key={i} className="flex gap-2">
                                    <Input
                                        className="w-20"
                                        placeholder="Nome"
                                        value={v.name}
                                        onChange={e => {
                                            const variants = [...newTest.variants];
                                            variants[i].name = e.target.value;
                                            setNewTest({ ...newTest, variants });
                                        }}
                                    />
                                    <Select
                                        value={cmsPages.some(p => `${WORKER_URL}/${p.slug}` === v.url) ? v.url : "custom"}
                                        onValueChange={(value) => {
                                            const variants = [...newTest.variants];
                                            variants[i].url = value === "custom" ? "" : value;
                                            setNewTest({ ...newTest, variants });
                                        }}
                                    >
                                        <SelectTrigger className="w-[200px]">
                                            <SelectValue placeholder="Selecionar..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="custom">
                                                <span className="flex items-center gap-2">URL Externa</span>
                                            </SelectItem>
                                            {cmsPages.map(page => (
                                                <SelectItem key={page.id} value={`${WORKER_URL}/${page.slug}`}>
                                                    <span className="flex items-center gap-2">
                                                        <FileText className="h-3 w-3" />
                                                        {page.name}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        className="flex-1"
                                        placeholder="URL de destino"
                                        value={v.url}
                                        onChange={e => {
                                            const variants = [...newTest.variants];
                                            variants[i].url = e.target.value;
                                            setNewTest({ ...newTest, variants });
                                        }}
                                    />
                                    <Input
                                        className="w-20"
                                        type="number"
                                        placeholder="Peso"
                                        value={v.weight}
                                        onChange={e => {
                                            const variants = [...newTest.variants];
                                            variants[i].weight = parseInt(e.target.value) || 0;
                                            setNewTest({ ...newTest, variants });
                                        }}
                                    />
                                </div>
                            ))}
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setNewTest({ ...newTest, variants: [...newTest.variants, { name: String.fromCharCode(65 + newTest.variants.length), url: "", weight: 50, visits: 0 }] })}
                                >
                                    + Variante
                                </Button>
                                <Button onClick={createTest}>Criar Teste</Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Tests list */}
                {tests.map(test => (
                    <Card key={test.id}>
                        <CardHeader className="flex flex-row items-center justify-between py-3">
                            <div>
                                <CardTitle className="text-lg">{test.name}</CardTitle>
                                <code className="text-xs text-muted-foreground">{WORKER_URL}/{test.slug}</code>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" onClick={() => copyUrl(test.slug)} title="Copiar URL">
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => resetVisits(test)} title="Zerar Visitas">
                                    <RotateCcw className="h-4 w-4 text-orange-500" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => purgeCache(test.slug)} title="Limpar Cache (Forçar)">
                                    <Zap className="h-4 w-4 text-yellow-500" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => toggleStatus(test)} title={test.status === "active" ? "Pausar" : "Ativar"}>
                                    {test.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => deleteTest(test)} title="Deletar">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                {test.variants.map(v => (
                                    <div key={v.id} className="p-3 bg-muted rounded-lg">
                                        <div className="font-medium">{v.name} ({v.weight}%)</div>
                                        <div className="text-xs text-muted-foreground truncate">{v.url}</div>
                                        <div className="text-lg font-bold mt-1">{v.visits} visitas</div>
                                    </div>
                                ))}
                            </div>

                            {/* Speed/Cache Meter */}
                            <div className="mt-4 pt-4 border-t flex items-center gap-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => testSpeed(test)}
                                    disabled={speedTests[test.id]?.loading}
                                >
                                    {speedTests[test.id]?.loading ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Gauge className="h-4 w-4 mr-2" />
                                    )}
                                    Testar Velocidade
                                </Button>

                                {speedTests[test.id]?.speed !== undefined && (
                                    <div className="flex items-center gap-3">
                                        <div className="text-sm">
                                            <span className="font-medium">{speedTests[test.id]?.speed}ms</span>
                                            <span className="text-muted-foreground ml-1">
                                                {(speedTests[test.id]?.speed || 0) < 100 ? '⚡ Rápido' : (speedTests[test.id]?.speed || 0) < 500 ? '✓ OK' : '⚠️ Lento'}
                                            </span>
                                        </div>
                                        <div className={`text-xs px-2 py-0.5 rounded-full ${speedTests[test.id]?.cached ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {speedTests[test.id]?.cached ? 'Cache HIT' : 'Cache MISS'}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {tests.length === 0 && !showForm && (
                    <p className="text-center text-muted-foreground py-8">Nenhum teste criado ainda</p>
                )}
            </div>
        </DashboardLayout>
    );
}
