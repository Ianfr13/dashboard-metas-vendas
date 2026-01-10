import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import DashboardLayout from "@/components/DashboardLayout";
import { Plus, Trash2, Copy, Play, Pause, Zap } from "lucide-react";
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

const WORKER_URL = "https://ab-redirect.ferramentas-bce.workers.dev";

export default function ABTests() {
    const [tests, setTests] = useState<ABTest[]>([]);
    const [loading, setLoading] = useState(true);
    const [newTest, setNewTest] = useState({ name: "", variants: [{ name: "A", url: "", weight: 50, visits: 0 }, { name: "B", url: "", weight: 50, visits: 0 }] });
    const [showForm, setShowForm] = useState(false);

    // Fetch tests
    useEffect(() => {
        fetchTests();
    }, []);

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
