import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save, Edit, Package, Home as HomeIcon, BarChart3, Settings, Moon, Sun } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import MobileNav from "@/components/MobileNav";

export default function Admin() {
  const [location] = useLocation();
  const { theme, toggleTheme } = useTheme();
  
  // Metas
  const [mainGoal, setMainGoal] = useState("5000000");
  const [subGoals, setSubGoals] = useState<string[]>([
    "100000",
    "200000",
    "300000",
    "500000",
    "1000000",
    "1500000",
    "2000000",
    "3000000",
  ]);
  const [newSubGoal, setNewSubGoal] = useState("");

  // Produtos
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productType, setProductType] = useState<"front" | "upsell" | "high-ticket">("front");
  const [productChannel, setProductChannel] = useState<"marketing" | "comercial" | "both">("both");
  const [editingProduct, setEditingProduct] = useState<number | null>(null);

  const { data: products, refetch: refetchProducts } = trpc.products.list.useQuery();

  const createProduct = trpc.products.create.useMutation({
    onSuccess: () => {
      toast.success("Produto criado com sucesso!");
      setProductName("");
      setProductPrice("");
      setProductType("front");
      setProductChannel("both");
      refetchProducts();
    },
    onError: () => {
      toast.error("Erro ao criar produto");
    },
  });

  const updateProduct = trpc.products.update.useMutation({
    onSuccess: () => {
      toast.success("Produto atualizado com sucesso!");
      setEditingProduct(null);
      setProductName("");
      setProductPrice("");
      refetchProducts();
    },
    onError: () => {
      toast.error("Erro ao atualizar produto");
    },
  });

  const deleteProduct = trpc.products.delete.useMutation({
    onSuccess: () => {
      toast.success("Produto removido com sucesso!");
      refetchProducts();
    },
    onError: () => {
      toast.error("Erro ao remover produto");
    },
  });

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return "R$ 0";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const addSubGoal = () => {
    if (!newSubGoal || isNaN(parseFloat(newSubGoal))) {
      toast.error("Digite um valor válido");
      return;
    }
    
    if (subGoals.includes(newSubGoal)) {
      toast.error("Esta sub-meta já existe");
      return;
    }

    setSubGoals([...subGoals, newSubGoal].sort((a, b) => parseFloat(a) - parseFloat(b)));
    setNewSubGoal("");
    toast.success("Sub-meta adicionada!");
  };

  const removeSubGoal = (index: number) => {
    setSubGoals(subGoals.filter((_, i) => i !== index));
    toast.success("Sub-meta removida!");
  };

  const createGoal = trpc.goals.create.useMutation({
    onSuccess: () => {
      toast.success("Configuração salva com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar configuração");
      console.error(error);
    },
  });

  const saveConfiguration = async () => {
    try {
      await createGoal.mutateAsync({
        name: "Meta Principal",
        scenario: "3M",
        period: "monthly",
        targetRevenue: mainGoal,
        targetSales: 0,
        targetMarketingSales: 0,
        targetCommercialSales: 0,
        startDate: new Date(),
        endDate: new Date(new Date().getFullYear(), 11, 31),
        subGoals: JSON.stringify(subGoals.map(sg => ({ value: parseFloat(sg), completed: false }))),
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSaveProduct = async () => {
    if (!productName || !productPrice) {
      toast.error("Preencha todos os campos");
      return;
    }

    const price = parseFloat(productPrice);
    if (isNaN(price) || price <= 0) {
      toast.error("Preço inválido");
      return;
    }

    if (editingProduct) {
      await updateProduct.mutateAsync({
        id: editingProduct,
        name: productName,
        price,
        type: productType,
        channel: productChannel,
      });
    } else {
      await createProduct.mutateAsync({
        name: productName,
        price,
        type: productType,
        channel: productChannel,
      });
    }
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product.id);
    setProductName(product.name);
    setProductPrice(product.price);
    setProductType(product.type);
    setProductChannel(product.channel);
  };

  const handleDeleteProduct = async (id: number) => {
    if (confirm("Tem certeza que deseja remover este produto?")) {
      await deleteProduct.mutateAsync({ id });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card md:sticky md:top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src="/logo-douravita.png"
                alt="DouraVita"
                className="h-10 w-auto drop-shadow-lg"
              />
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Área Administrativa
                </h1>
                <p className="text-sm text-muted-foreground">
                  Gerencie metas e produtos
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Menu Mobile */}
              <MobileNav />
              
              {/* Navegação Desktop */}
              <nav className="hidden md:flex items-center gap-2">
                <Link href="/">
                  <Button variant={location === "/" ? "default" : "ghost"} className="gap-2">
                    <HomeIcon className="h-4 w-4" />
                    Home
                  </Button>
                </Link>
                <Link href="/metricas">
                  <Button variant={location === "/metricas" ? "default" : "ghost"} className="gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Métricas
                  </Button>
                </Link>
                <Link href="/admin">
                  <Button variant={location === "/admin" ? "default" : "ghost"} className="gap-2">
                    <Settings className="h-4 w-4" />
                    Admin
                  </Button>
                </Link>
              </nav>

              {/* Toggle de Tema */}
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="metas" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="metas">Metas</TabsTrigger>
            <TabsTrigger value="produtos">Produtos</TabsTrigger>
          </TabsList>

          {/* Tab Metas */}
          <TabsContent value="metas" className="space-y-6 mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Meta Principal */}
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">🎯</span>
                    Meta Principal
                  </CardTitle>
                  <CardDescription>
                    Defina o valor total que deseja atingir no período
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mainGoal">Valor da Meta</Label>
                    <div className="flex gap-2">
                      <Input
                        id="mainGoal"
                        type="number"
                        value={mainGoal}
                        onChange={(e) => setMainGoal(e.target.value)}
                        placeholder="5000000"
                        className="text-lg font-semibold"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(mainGoal)}
                    </p>
                  </div>

                  <div className="rounded-lg bg-muted p-4">
                    <p className="text-sm font-medium text-foreground">
                      Visualização
                    </p>
                    <p className="text-3xl font-bold text-primary mt-2">
                      {formatCurrency(mainGoal)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Sub-metas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">📊</span>
                    Sub-metas
                  </CardTitle>
                  <CardDescription>
                    Marcos intermediários para acompanhar o progresso
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={newSubGoal}
                      onChange={(e) => setNewSubGoal(e.target.value)}
                      placeholder="Ex: 500000"
                      onKeyPress={(e) => e.key === "Enter" && addSubGoal()}
                    />
                    <Button onClick={addSubGoal} size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {subGoals.map((goal, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted"
                      >
                        <span className="font-medium text-foreground">
                          {formatCurrency(goal)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSubGoal(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end">
              <Button onClick={saveConfiguration} size="lg" className="gap-2">
                <Save className="h-5 w-5" />
                Salvar Configuração
              </Button>
            </div>
          </TabsContent>

          {/* Tab Produtos */}
          <TabsContent value="produtos" className="space-y-6 mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Formulário de Produto */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    {editingProduct ? "Editar Produto" : "Novo Produto"}
                  </CardTitle>
                  <CardDescription>
                    {editingProduct
                      ? "Atualize as informações do produto"
                      : "Adicione um novo produto ao catálogo"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="productName">Nome do Produto</Label>
                    <Input
                      id="productName"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="Ex: Creatina Pro 797"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productPrice">Preço (R$)</Label>
                    <Input
                      id="productPrice"
                      type="number"
                      value={productPrice}
                      onChange={(e) => setProductPrice(e.target.value)}
                      placeholder="797.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productType">Tipo</Label>
                    <Select
                      value={productType}
                      onValueChange={(value: any) => setProductType(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="front">Front-end (Produto Principal)</SelectItem>
                        <SelectItem value="upsell">Upsell</SelectItem>
                        <SelectItem value="high-ticket">High-Ticket</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="productChannel">Canal</Label>
                    <Select
                      value={productChannel}
                      onValueChange={(value: any) => setProductChannel(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="marketing">Marketing Direto</SelectItem>
                        <SelectItem value="comercial">Time Comercial</SelectItem>
                        <SelectItem value="both">Ambos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSaveProduct} className="flex-1">
                      <Save className="h-4 w-4 mr-2" />
                      {editingProduct ? "Atualizar" : "Criar"} Produto
                    </Button>
                    {editingProduct && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingProduct(null);
                          setProductName("");
                          setProductPrice("");
                          setProductType("front");
                          setProductChannel("both");
                        }}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Lista de Produtos */}
              <Card>
                <CardHeader>
                  <CardTitle>Produtos Cadastrados</CardTitle>
                  <CardDescription>
                    {products?.length || 0} produto(s) no catálogo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {products?.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{product.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(parseFloat(product.price))} • {product.type} • {product.channel}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {!products || products.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        Nenhum produto cadastrado ainda
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
