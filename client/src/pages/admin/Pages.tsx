import { useState, useEffect } from "react";
import { useUserRole } from "@/hooks/useUserRole";
import { AccessDenied } from "@/components/AccessDenied";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Plus,
  Trash2,
  Copy,
  Save,
  Rocket,
  ExternalLink,
  RefreshCw,
  Gauge,
  Zap,
  Globe,
  Activity,
  Video,
  Eye,
  CloudOff,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Tablet,
  Monitor,
  Loader2,
  Archive,
  FolderOpen,
  Dices,
  Filter,
  Link,
  Replace,
  Search,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  folder?: string;
  is_archived?: boolean;
  updated_at: string;
}

interface VTurbVideo {
  id: string;
  delay: string | number;
}

interface VTurbConfig {
  enabled: boolean;
  videos: VTurbVideo[];
}

const DEFAULT_VTURB_CONFIG: VTurbConfig = {
  enabled: false,
  videos: [{ id: "", delay: 10 }],
};

interface CheckoutButton {
  id: string;
  originalUrl: string;
  newUrl: string;
  text: string;
  tagName: string;
  context: string;
}

// Função para detectar botões de checkout no HTML
function detectCheckoutButtons(html: string): CheckoutButton[] {
  if (!html) return [];

  const buttons: CheckoutButton[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Padrões comuns de URLs de checkout
  const checkoutPatterns = [
    /checkout/i,
    /pay\.hotmart/i,
    /go\.hotmart/i,
    /kiwify\.com/i,
    /eduzz/i,
    /monetizze/i,
    /braip/i,
    /perfectpay/i,
    /greenn\.com/i,
    /yampi/i,
    /cartpanda/i,
    /doppus/i,
    /ticto/i,
    /lastlink/i,
    /pagar\.me/i,
    /pagseguro/i,
    /mercadopago/i,
    /stripe/i,
    /paypal/i,
  ];

  // Padrões de texto de botão de checkout
  const buttonTextPatterns = [
    /comprar/i,
    /compre/i,
    /quero/i,
    /adquirir/i,
    /garantir/i,
    /aproveitar/i,
    /pedir/i,
    /sim.*quero/i,
    /finalizar/i,
    /continuar/i,
    /add.*cart/i,
    /buy.*now/i,
  ];

  // Buscar todos os links (a tags)
  const links = doc.querySelectorAll("a[href]");
  links.forEach((link, index) => {
    const href = link.getAttribute("href") || "";
    const text = link.textContent?.trim() || "";

    const isCheckoutUrl = checkoutPatterns.some(p => p.test(href));
    const isCheckoutText = buttonTextPatterns.some(p => p.test(text));

    // Se a URL ou o texto indicam checkout
    if (isCheckoutUrl || (isCheckoutText && href && href !== "#")) {
      const parent = link.parentElement;
      const context = parent?.className || parent?.tagName || "unknown";

      buttons.push({
        id: `link-${index}`,
        originalUrl: href,
        newUrl: href,
        text: text.substring(0, 50) || "[Sem texto]",
        tagName: "a",
        context: context.substring(0, 30),
      });
    }
  });

  // Buscar botões com onclick
  const clickables = doc.querySelectorAll("[onclick]");
  clickables.forEach((el, index) => {
    const onclick = el.getAttribute("onclick") || "";
    const text = el.textContent?.trim() || "";

    // Extrair URL do onclick (ex: window.location = 'url', location.href = 'url')
    const urlMatch = onclick.match(
      /(?:window\.)?location(?:\.href)?\s*=\s*['"]([^'"]+)['"]/
    );
    if (urlMatch) {
      const url = urlMatch[1];
      const isCheckoutUrl = checkoutPatterns.some(p => p.test(url));
      const isCheckoutText = buttonTextPatterns.some(p => p.test(text));

      if (isCheckoutUrl || isCheckoutText) {
        buttons.push({
          id: `onclick-${index}`,
          originalUrl: url,
          newUrl: url,
          text: text.substring(0, 50) || "[Sem texto]",
          tagName: el.tagName.toLowerCase(),
          context: "onclick",
        });
      }
    }
  });

  // Remover duplicados por URL
  const uniqueButtons = buttons.filter(
    (btn, index, self) =>
      index === self.findIndex(b => b.originalUrl === btn.originalUrl)
  );

  return uniqueButtons;
}

// Função para substituir URLs no HTML
function replaceCheckoutUrls(
  html: string,
  replacements: { from: string; to: string }[]
): string {
  let newHtml = html;

  replacements.forEach(({ from, to }) => {
    if (from && to && from !== to) {
      // Escapar caracteres especiais para regex
      const escapedFrom = from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escapedFrom, "g");
      newHtml = newHtml.replace(regex, to);
    }
  });

  return newHtml;
}

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
  utm_content: "",
};

export default function Pages() {
  const { hasPermission, loading: roleLoading } = useUserRole();

  if (roleLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!hasPermission("pages", "read")) {
    return <AccessDenied feature="Páginas (CMS)" />;
  }

  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Generator State
  const [genParams, setGenParams] = useState(DEFAULT_GEN_PARAMS);

  // Speed Stats State
  const [speedStats, setSpeedStats] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchSpeed = async () => {
      try {
        const res = await fetch(`${WORKER_URL}/admin/speed-stats`);
        if (res.ok) setSpeedStats(await res.json());
      } catch (e) {
        console.error("Failed to fetch speed stats", e);
      }
    };
    fetchSpeed();
    const interval = setInterval(fetchSpeed, 5000);
    return () => clearInterval(interval);
  }, []);

  // VTurb Config State
  const [vturbConfig, setVturbConfig] =
    useState<VTurbConfig>(DEFAULT_VTURB_CONFIG);
  const [vturbTextInput, setVturbTextInput] = useState<string>("");

  // Preview Viewport State
  const [previewViewport, setPreviewViewport] = useState<
    "mobile" | "tablet" | "desktop"
  >("desktop");

  // Checkout URL Changer State
  const [checkoutButtons, setCheckoutButtons] = useState<CheckoutButton[]>([]);
  const [bulkCheckoutUrl, setBulkCheckoutUrl] = useState<string>("");

  // Folder and Archive Filter State
  const [folderFilter, setFolderFilter] = useState<string>("all");
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>("");

  // Get unique folders from pages
  const folders = Array.from(
    new Set(pages.filter(p => p.folder).map(p => p.folder!))
  );

  // Filter pages based on folder and archive status
  const filteredPages = pages.filter(page => {
    const matchesFolder =
      folderFilter === "all" ||
      (folderFilter === "none" ? !page.folder : page.folder === folderFilter);
    const matchesArchive = showArchived || !page.is_archived;
    return matchesFolder && matchesArchive;
  });

  // Generate random 6-character alphanumeric slug
  function generateRandomSlug(): string {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let slug = "";
    for (let i = 0; i < 6; i++) {
      slug += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return slug;
  }

  // Check if slug is unique
  async function isSlugUnique(slug: string): Promise<boolean> {
    const { data } = await supabase
      .from("pages")
      .select("id")
      .eq("slug", slug)
      .single();
    return !data;
  }

  // Generate unique random slug
  async function generateUniqueSlug(): Promise<string> {
    let slug = generateRandomSlug();
    let attempts = 0;
    while (!(await isSlugUnique(slug)) && attempts < 10) {
      slug = generateRandomSlug();
      attempts++;
    }
    return slug;
  }

  // Parse VTurb text input to config
  function parseVturbText(text: string): VTurbVideo[] {
    const videos: VTurbVideo[] = [];
    // Match pattern: 'id': { delay: number } or "id": { delay: number }
    const regex = /['"]([^'"]+)['"]:\s*\{\s*delay:\s*(\d+)\s*\}/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      videos.push({ id: match[1], delay: parseInt(match[2]) });
    }
    return videos.length > 0 ? videos : [{ id: "", delay: 10 }];
  }

  // Convert config to text format
  function vturbConfigToText(videos: VTurbVideo[]): string {
    return videos
      .filter(v => v.id.trim())
      .map(v => `'${v.id}': { delay: ${v.delay} }`)
      .join(",\n");
  }

  // Duplicate page with random slug
  async function handleDuplicate(page: Page) {
    const newSlug = await generateUniqueSlug();
    setEditingPage({
      ...page,
      id: 0, // New page
      name: `${page.name} (Cópia)`,
      slug: newSlug,
      is_published: false,
      published_slug: undefined,
      updated_at: new Date().toISOString(),
    });
    if (page.tracking_params) {
      setGenParams({ ...DEFAULT_GEN_PARAMS, ...page.tracking_params });
    } else {
      setGenParams(DEFAULT_GEN_PARAMS);
    }
    if (page.vturb_config) {
      setVturbConfig({ ...DEFAULT_VTURB_CONFIG, ...page.vturb_config });
      setVturbTextInput(vturbConfigToText(page.vturb_config.videos || []));
    } else {
      setVturbConfig(DEFAULT_VTURB_CONFIG);
      setVturbTextInput("");
    }
    setShowForm(true);
    toast.success("Página duplicada! Slug aleatório gerado.");
  }

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
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.access_token) {
          await fetch(`${WORKER_URL}/admin/pages?slug=${page.published_slug}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${session.access_token}` },
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
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) return toast.error("Sessão expirada");

      const slugToRemove = editingPage.published_slug || editingPage.slug;

      // Remove from KV
      const response = await fetch(
        `${WORKER_URL}/admin/pages?slug=${slugToRemove}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );

      if (!response.ok) {
        throw new Error(await response.text());
      }

      // Update DB
      await supabase
        .from("pages")
        .update({
          is_published: false,
          published_slug: null,
        })
        .eq("id", editingPage.id);

      setEditingPage(prev =>
        prev
          ? { ...prev, is_published: false, published_slug: undefined }
          : null
      );
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

    // Parse VTurb text input before saving
    const parsedVideos = parseVturbText(vturbTextInput);
    const finalVturbConfig = { ...vturbConfig, videos: parsedVideos };

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
            folder: editingPage.folder || null,
            is_archived: editingPage.is_archived || false,
            tracking_params: genParams,
            vturb_config: finalVturbConfig,
            updated_at: new Date().toISOString(),
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
            folder: editingPage.folder || null,
            is_archived: editingPage.is_archived || false,
            tracking_params: genParams,
            vturb_config: finalVturbConfig,
          })
          .select()
          .single();
      }

      if (result.error) throw result.error;

      toast.success("Página salva no Banco (Backup)");
      // Preserve the original published_slug so deploy can detect slug changes
      const originalPublishedSlug = editingPage.published_slug;
      setEditingPage({ ...result.data, published_slug: originalPublishedSlug });
      setVturbConfig(finalVturbConfig);
      fetchPages();

      // Se já salvou no banco, oferecemos deploy
      if (!editingPage.id) {
        // Se é novo, setamos o ID para permitir deploy
        setEditingPage({
          ...result.data,
          published_slug: originalPublishedSlug,
        });
      }
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    }
  }

  async function handleDeploy() {
    if (!editingPage?.slug)
      return toast.error("Preencha o Slug (URL) antes de publicar");
    if (!editingPage?.html_content)
      return toast.error("Cole o conteúdo HTML antes de publicar");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token)
        return toast.error("Sua sessão expirou. Faça login novamente.");

      const toastId = toast.loading("Preparando e Publicando...");

      // Inject scripts into HTML
      let finalHtml = editingPage.html_content;

      if (editingPage.head_code) {
        finalHtml = finalHtml.replace(
          "</head>",
          `${editingPage.head_code}</head>`
        );
      }
      if (editingPage.body_code) {
        finalHtml = finalHtml.replace(
          "<body",
          `<body ${editingPage.body_code.includes("<") ? "" : ""}`
        ); // Just in case, but usually body_code goes inside body tag? No, usually after.
        // Standard injection points:
        // Head: before </head>
        // Body Start: after <body ...>
        // Footer: before </body>

        // Simplest injection for Body Start (regex to find start of body tag and append after it closes)
        // This is complex regex. Let's assume user wants it immediately after <body> opening.
        finalHtml = finalHtml.replace(
          /<body[^>]*>/i,
          match => `${match}\n${editingPage.body_code}`
        );
      }
      if (editingPage.footer_code) {
        finalHtml = finalHtml.replace(
          "</body>",
          `${editingPage.footer_code}\n</body>`
        );
      }

      // VTurb Delay Script Injection
      const parsedVideosForDeploy = parseVturbText(vturbTextInput);
      if (vturbConfig.enabled && parsedVideosForDeploy.some(v => v.id.trim())) {
        const listPitchEntries = parsedVideosForDeploy
          .filter(v => v.id.trim())
          .map(
            v =>
              `'${v.id.trim()}': { delay: ${parseInt(String(v.delay)) || 0} }`
          )
          .join(",\n    ");

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
      if (
        editingPage.published_slug &&
        editingPage.published_slug !== editingPage.slug
      ) {
        await fetch(
          `${WORKER_URL}/admin/pages?slug=${editingPage.published_slug}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${session.access_token}` },
          }
        );
      }

      const response = await fetch(`${WORKER_URL}/admin/pages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug: editingPage.slug,
          html: finalHtml,
        }),
      });

      toast.dismiss(toastId);

      if (response.ok) {
        // Update DB with published status
        await supabase
          .from("pages")
          .update({
            is_published: true,
            published_slug: editingPage.slug,
          })
          .eq("id", editingPage.id);

        setEditingPage(prev =>
          prev
            ? { ...prev, is_published: true, published_slug: editingPage.slug }
            : null
        );
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

  const generatedLink = editingPage?.slug
    ? generateTrackingUrl({
        baseUrl: `${WORKER_URL}/${editingPage.slug}`,
        ...genParams,
      } as any)
    : "";

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
      await fetch(`${WORKER_URL}/${editingPage.slug}`, { cache: "no-store" });
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

  if (loading)
    return (
      <DashboardLayout>
        <p>Carregando...</p>
      </DashboardLayout>
    );

  if (showForm || editingPage) {
    return (
      <DashboardLayout>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => {
                setShowForm(false);
                setEditingPage(null);
              }}
            >
              ← Voltar
            </Button>
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
                <Button
                  variant="outline"
                  onClick={handleUnpublish}
                  className="text-orange-600 hover:text-orange-700"
                >
                  <CloudOff className="h-4 w-4 mr-2" /> Despublicar
                </Button>
              )}

              <Button
                onClick={handleDeploy}
                className="bg-green-600 hover:bg-green-700"
              >
                <Rocket className="h-4 w-4 mr-2" /> Publicar (Live)
              </Button>

              {/* Delete Button with Confirmation */}
              {editingPage?.id && editingPage.id > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir Página?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. A página "
                        {editingPage.name}" será removida permanentemente.
                        {editingPage.is_published &&
                          " Ela também será removida do servidor (Edge)."}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(editingPage)}
                        className="bg-destructive hover:bg-destructive/90"
                      >
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
                        <Zap className="h-4 w-4 text-yellow-500" /> Teste Local
                        (Você)
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Latência Real (TTFB):
                        </span>
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
                        <Globe className="h-4 w-4 text-blue-500" /> Teste Global
                        (Ferramentas)
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          asChild
                        >
                          <a
                            href={`https://tools.keycdn.com/performance?url=${encodeURIComponent(`${WORKER_URL}/${editingPage?.slug}`)}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Activity className="h-4 w-4 mr-2" />
                            KeyCDN (10 Países)
                          </a>
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          asChild
                        >
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
                        *O KeyCDN testa sua página a partir de 10 locais
                        diferentes do mundo simultaneamente. Ideal para
                        verificar a CDN.
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
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-2">
                        <Label>Nome Interno</Label>
                        <Input
                          value={editingPage?.name || ""}
                          onChange={e =>
                            setEditingPage(prev => ({
                              ...prev!,
                              name: e.target.value,
                            }))
                          }
                          placeholder="Ex: VSL 01 - Headline Nova"
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Label>Slug (URL)</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            /
                          </span>
                          <Input
                            value={editingPage?.slug || ""}
                            onChange={e =>
                              setEditingPage(prev => ({
                                ...prev!,
                                slug: e.target.value,
                              }))
                            }
                            placeholder="vsl-01"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            title="Gerar slug aleatório (6 caracteres)"
                            onClick={async () => {
                              const newSlug = await generateUniqueSlug();
                              setEditingPage(prev => ({
                                ...prev!,
                                slug: newSlug,
                              }));
                              toast.success(`Slug gerado: ${newSlug}`);
                            }}
                          >
                            <Dices className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-2">
                        <Label>Pasta</Label>
                        <div className="flex items-center gap-2">
                          <select
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={editingPage?.folder || ""}
                            onChange={e =>
                              setEditingPage(prev => ({
                                ...prev!,
                                folder: e.target.value || undefined,
                              }))
                            }
                          >
                            <option value="">Sem pasta</option>
                            {folders.map(folder => (
                              <option key={folder} value={folder}>
                                {folder}
                              </option>
                            ))}
                          </select>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                title="Nova pasta"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Nova Pasta</DialogTitle>
                                <DialogDescription>
                                  Digite o nome da nova pasta
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <Input
                                  value={newFolderName}
                                  onChange={e =>
                                    setNewFolderName(e.target.value)
                                  }
                                  placeholder="Ex: VSLs, Leads, Testes"
                                />
                                <Button
                                  onClick={() => {
                                    if (newFolderName.trim()) {
                                      setEditingPage(prev => ({
                                        ...prev!,
                                        folder: newFolderName.trim(),
                                      }));
                                      setNewFolderName("");
                                      toast.success(
                                        `Pasta "${newFolderName.trim()}" criada`
                                      );
                                    }
                                  }}
                                  disabled={!newFolderName.trim()}
                                >
                                  Criar e Selecionar
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                      <div className="flex items-end gap-4 pb-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            id="archive-toggle"
                            checked={editingPage?.is_archived || false}
                            onCheckedChange={checked =>
                              setEditingPage(prev => ({
                                ...prev!,
                                is_archived: checked,
                              }))
                            }
                          />
                          <Label
                            htmlFor="archive-toggle"
                            className="flex items-center gap-1 cursor-pointer"
                          >
                            <Archive className="h-4 w-4" />
                            Arquivada
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* TABS PARA HTML e SCRIPTS */}
                  <Tabs defaultValue="html">
                    <TabsList className="mb-4">
                      <TabsTrigger value="html">Principal (HTML)</TabsTrigger>
                      <TabsTrigger value="scripts">
                        Scripts (Injeção)
                      </TabsTrigger>
                      <TabsTrigger value="checkout">
                        <Link className="h-4 w-4 mr-1" /> URLs Checkout
                      </TabsTrigger>
                      <TabsTrigger value="vturb">
                        <Video className="h-4 w-4 mr-1" /> VTurb Delay
                      </TabsTrigger>
                      <TabsTrigger value="preview">
                        <Eye className="h-4 w-4 mr-1" /> Preview
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="html">
                      <Label className="mb-2 block">Código HTML Completo</Label>
                      <Textarea
                        className="font-mono text-xs min-h-[500px]"
                        value={editingPage?.html_content || ""}
                        onChange={e =>
                          setEditingPage(prev => ({
                            ...prev!,
                            html_content: e.target.value,
                          }))
                        }
                        placeholder="<html>... Cole o código do Atomicat aqui ...</html>"
                      />
                    </TabsContent>

                    <TabsContent value="scripts" className="space-y-4">
                      <div>
                        <Label>Head Code (Antes de &lt;/head&gt;)</Label>
                        <Textarea
                          className="font-mono text-xs min-h-[150px]"
                          value={editingPage?.head_code || ""}
                          onChange={e =>
                            setEditingPage(prev => ({
                              ...prev!,
                              head_code: e.target.value,
                            }))
                          }
                          placeholder="<script>... (Google Analytics, Pixel, etc)</script>"
                        />
                      </div>
                      <div>
                        <Label>Body Start (Logo após &lt;body&gt;)</Label>
                        <Textarea
                          className="font-mono text-xs min-h-[150px]"
                          value={editingPage?.body_code || ""}
                          onChange={e =>
                            setEditingPage(prev => ({
                              ...prev!,
                              body_code: e.target.value,
                            }))
                          }
                          placeholder="<noscript>... (GTM Body)</noscript>"
                        />
                      </div>
                      <div>
                        <Label>Footer Code (Antes de &lt;/body&gt;)</Label>
                        <Textarea
                          className="font-mono text-xs min-h-[150px]"
                          value={editingPage?.footer_code || ""}
                          onChange={e =>
                            setEditingPage(prev => ({
                              ...prev!,
                              footer_code: e.target.value,
                            }))
                          }
                          placeholder="<script>... (Scripts de fechamento)</script>"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="checkout" className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                        <div>
                          <Label className="text-base font-medium">
                            Trocador de URLs de Checkout
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Encontre e substitua rapidamente todas as URLs de
                            checkout da página
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => {
                            const buttons = detectCheckoutButtons(
                              editingPage?.html_content || ""
                            );
                            setCheckoutButtons(buttons);
                            if (buttons.length === 0) {
                              toast.info("Nenhum botão de checkout encontrado");
                            } else {
                              toast.success(
                                `${buttons.length} URL(s) de checkout encontrada(s)`
                              );
                            }
                          }}
                        >
                          <Search className="h-4 w-4 mr-2" />
                          Buscar URLs
                        </Button>
                      </div>

                      {checkoutButtons.length > 0 && (
                        <>
                          {/* Troca em Massa */}
                          <div className="p-4 border rounded-lg border-blue-200 bg-blue-50/50 space-y-3">
                            <div className="flex items-center gap-2">
                              <Replace className="h-4 w-4 text-blue-600" />
                              <Label className="text-sm font-medium text-blue-900">
                                Trocar Todas de Uma Vez
                              </Label>
                            </div>
                            <div className="flex gap-2">
                              <Input
                                className="flex-1"
                                placeholder="Cole a nova URL de checkout aqui..."
                                value={bulkCheckoutUrl}
                                onChange={e =>
                                  setBulkCheckoutUrl(e.target.value)
                                }
                              />
                              <Button
                                variant="default"
                                disabled={!bulkCheckoutUrl.trim()}
                                onClick={() => {
                                  const updatedButtons = checkoutButtons.map(
                                    btn => ({
                                      ...btn,
                                      newUrl: bulkCheckoutUrl.trim(),
                                    })
                                  );
                                  setCheckoutButtons(updatedButtons);
                                  toast.success(
                                    "Nova URL aplicada a todos os botões"
                                  );
                                }}
                              >
                                Aplicar a Todos
                              </Button>
                            </div>
                          </div>

                          {/* Lista de URLs Encontradas */}
                          <div className="space-y-3">
                            <Label className="text-sm font-medium">
                              URLs Encontradas ({checkoutButtons.length})
                            </Label>
                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                              {checkoutButtons.map((btn, index) => (
                                <div
                                  key={btn.id}
                                  className={`p-3 border rounded-lg space-y-2 ${
                                    btn.originalUrl !== btn.newUrl
                                      ? "border-green-300 bg-green-50/50"
                                      : "bg-background"
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                                        #{index + 1}
                                      </span>
                                      <span className="text-sm font-medium truncate max-w-[200px]">
                                        {btn.text}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        ({btn.tagName})
                                      </span>
                                    </div>
                                    {btn.originalUrl !== btn.newUrl && (
                                      <span className="text-xs text-green-600 font-medium">
                                        Alterado
                                      </span>
                                    )}
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground w-14">
                                        Atual:
                                      </span>
                                      <code className="text-xs bg-muted px-2 py-1 rounded truncate flex-1 block">
                                        {btn.originalUrl}
                                      </code>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground w-14">
                                        Nova:
                                      </span>
                                      <Input
                                        className="text-xs h-8 flex-1"
                                        value={btn.newUrl}
                                        onChange={e => {
                                          const updated = [...checkoutButtons];
                                          updated[index] = {
                                            ...btn,
                                            newUrl: e.target.value,
                                          };
                                          setCheckoutButtons(updated);
                                        }}
                                        placeholder="Nova URL..."
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Botão de Aplicar Mudanças */}
                          <div className="flex items-center justify-between pt-4 border-t">
                            <p className="text-sm text-muted-foreground">
                              {
                                checkoutButtons.filter(
                                  b => b.originalUrl !== b.newUrl
                                ).length
                              }{" "}
                              URL(s) serão substituídas
                            </p>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setCheckoutButtons([]);
                                  setBulkCheckoutUrl("");
                                }}
                              >
                                Cancelar
                              </Button>
                              <Button
                                variant="default"
                                className="bg-green-600 hover:bg-green-700"
                                disabled={
                                  !checkoutButtons.some(
                                    b => b.originalUrl !== b.newUrl
                                  )
                                }
                                onClick={() => {
                                  const replacements = checkoutButtons
                                    .filter(b => b.originalUrl !== b.newUrl)
                                    .map(b => ({
                                      from: b.originalUrl,
                                      to: b.newUrl,
                                    }));

                                  if (replacements.length === 0) {
                                    return toast.info(
                                      "Nenhuma alteração para aplicar"
                                    );
                                  }

                                  const newHtml = replaceCheckoutUrls(
                                    editingPage?.html_content || "",
                                    replacements
                                  );

                                  setEditingPage(prev => ({
                                    ...prev!,
                                    html_content: newHtml,
                                  }));

                                  // Atualizar as URLs originais para refletir a mudança
                                  const updatedButtons = checkoutButtons.map(
                                    btn => ({
                                      ...btn,
                                      originalUrl: btn.newUrl,
                                    })
                                  );
                                  setCheckoutButtons(updatedButtons);

                                  toast.success(
                                    `${replacements.length} URL(s) substituída(s) no HTML!`
                                  );
                                }}
                              >
                                <Replace className="h-4 w-4 mr-2" />
                                Aplicar Mudanças no HTML
                              </Button>
                            </div>
                          </div>
                        </>
                      )}

                      {checkoutButtons.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                          <Link className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>
                            Clique em "Buscar URLs" para encontrar os botões de
                            checkout
                          </p>
                          <p className="text-xs mt-2">
                            Detectamos automaticamente links para: Hotmart,
                            Kiwify, Eduzz, Monetizze, Braip, PerfectPay, etc.
                          </p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="vturb" className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <Label className="text-base font-medium">
                            Ativar Script de Delay
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Injeta automaticamente o script de delay do VTurb
                          </p>
                        </div>
                        <Switch
                          checked={vturbConfig.enabled}
                          onCheckedChange={checked =>
                            setVturbConfig(prev => ({
                              ...prev,
                              enabled: checked,
                            }))
                          }
                        />
                      </div>

                      {vturbConfig.enabled && (
                        <div className="space-y-3">
                          <div>
                            <Label>Configuração de Vídeos</Label>
                            <p className="text-sm text-muted-foreground mb-2">
                              Cole os IDs no formato do script. Cada linha deve
                              ter o formato:
                            </p>
                            <div className="bg-muted p-3 rounded-md mb-3 font-mono text-xs">
                              <code className="text-green-600">
                                'abc123xyz'
                              </code>
                              : {"{"} delay:{" "}
                              <code className="text-blue-600">150</code> {"}"},{" "}
                              <span className="text-muted-foreground">
                                // primeiro vídeo
                              </span>
                              <br />
                              <code className="text-green-600">
                                'def456uvw'
                              </code>
                              : {"{"} delay:{" "}
                              <code className="text-blue-600">200</code> {"}"}{" "}
                              <span className="text-muted-foreground">
                                // segundo vídeo
                              </span>
                            </div>
                          </div>
                          <Textarea
                            className="font-mono text-xs min-h-[150px]"
                            value={vturbTextInput}
                            onChange={e => setVturbTextInput(e.target.value)}
                            placeholder={`'video_id_1': { delay: 150 },\n'video_id_2': { delay: 200 }`}
                          />
                          <p className="text-xs text-muted-foreground">
                            O delay é em segundos. O valor será usado para
                            revelar elementos com a classe .esconder após o
                            tempo especificado.
                          </p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="preview" className="space-y-4">
                      <div className="border rounded-lg overflow-hidden bg-white">
                        <div className="bg-muted px-4 py-2 flex items-center justify-between border-b">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            <span className="text-sm font-medium">
                              Preview (Sem Cache)
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant={
                                previewViewport === "mobile"
                                  ? "default"
                                  : "ghost"
                              }
                              size="sm"
                              onClick={() => setPreviewViewport("mobile")}
                              className="h-8 w-8 p-0"
                              title="Mobile (375px)"
                            >
                              <Smartphone className="h-4 w-4" />
                            </Button>
                            <Button
                              variant={
                                previewViewport === "tablet"
                                  ? "default"
                                  : "ghost"
                              }
                              size="sm"
                              onClick={() => setPreviewViewport("tablet")}
                              className="h-8 w-8 p-0"
                              title="Tablet (768px)"
                            >
                              <Tablet className="h-4 w-4" />
                            </Button>
                            <Button
                              variant={
                                previewViewport === "desktop"
                                  ? "default"
                                  : "ghost"
                              }
                              size="sm"
                              onClick={() => setPreviewViewport("desktop")}
                              className="h-8 w-8 p-0"
                              title="Desktop (100%)"
                            >
                              <Monitor className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex justify-center bg-gray-100 p-4">
                          {editingPage?.html_content ? (
                            <iframe
                              srcDoc={editingPage.html_content}
                              sandbox="allow-scripts allow-same-origin"
                              className="border-0 bg-white shadow-lg transition-all duration-300"
                              style={{
                                width:
                                  previewViewport === "mobile"
                                    ? "375px"
                                    : previewViewport === "tablet"
                                      ? "768px"
                                      : "100%",
                                height: "600px",
                                maxWidth: "100%",
                              }}
                              title="Page Preview"
                            />
                          ) : (
                            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                              Cole o HTML na aba Principal para visualizar
                            </div>
                          )}
                        </div>
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
                  <CardDescription>
                    Configure os parâmetros para seus anúncios
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Funnel ID (fid)</Label>
                    <Input
                      value={genParams.fid}
                      onChange={e =>
                        setGenParams({ ...genParams, fid: e.target.value })
                      }
                      placeholder="Ex: 123"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Funnel Ver (fver)</Label>
                      <Input
                        value={genParams.fver}
                        onChange={e =>
                          setGenParams({ ...genParams, fver: e.target.value })
                        }
                        placeholder="v1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Page Ver (pver)</Label>
                      <Input
                        value={genParams.pver}
                        onChange={e =>
                          setGenParams({ ...genParams, pver: e.target.value })
                        }
                        placeholder="v2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Offer ID (oid)</Label>
                      <Input
                        value={genParams.oid}
                        onChange={e =>
                          setGenParams({ ...genParams, oid: e.target.value })
                        }
                        placeholder="off_123"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Estágio (fstg)</Label>
                      <Input
                        value={genParams.fstg}
                        onChange={e =>
                          setGenParams({ ...genParams, fstg: e.target.value })
                        }
                        placeholder="vsl"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Tipo (ftype)</Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      value={genParams.ftype}
                      onChange={e =>
                        setGenParams({ ...genParams, ftype: e.target.value })
                      }
                    >
                      <option value="compra">Compra</option>
                      <option value="leads">Leads</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t">
                    <Label>Link Final</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        readOnly
                        value={generatedLink}
                        className="bg-muted text-xs"
                      />
                      <Button
                        size="icon"
                        onClick={copyLink}
                        disabled={!editingPage?.slug}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    {editingPage?.slug && (
                      <Button
                        variant="link"
                        size="sm"
                        className="w-full mt-1"
                        onClick={() => window.open(generatedLink, "_blank")}
                      >
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
            <p className="text-muted-foreground">
              Hospedagem de páginas de alta performance
            </p>
          </div>
          <Button
            onClick={async () => {
              const newSlug = await generateUniqueSlug();
              setEditingPage({
                id: 0,
                name: "",
                slug: newSlug,
                html_content: "",
                head_code: "",
                body_code: "",
                footer_code: "",
                tracking_params: {},
                updated_at: "",
              });
              setGenParams(DEFAULT_GEN_PARAMS);
              setVturbConfig(DEFAULT_VTURB_CONFIG);
              setVturbTextInput("");
              setShowForm(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" /> Nova Página
          </Button>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap gap-4 items-center p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtros:</span>
          </div>
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            <select
              className="h-8 rounded-md border border-input bg-background px-2 py-1 text-sm"
              value={folderFilter}
              onChange={e => setFolderFilter(e.target.value)}
            >
              <option value="all">Todas as pastas</option>
              <option value="none">📁 Sem pasta</option>
              {folders.map(folder => (
                <option key={folder} value={folder}>
                  📂 {folder}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="show-archived"
              checked={showArchived}
              onCheckedChange={setShowArchived}
            />
            <Label
              htmlFor="show-archived"
              className="text-sm cursor-pointer flex items-center gap-1"
            >
              <Archive className="h-4 w-4" />
              Mostrar arquivadas
            </Label>
          </div>
          <span className="text-sm text-muted-foreground ml-auto">
            {filteredPages.length} página(s)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPages.map(page => (
            <Card
              key={page.id}
              className={`hover:shadow-md transition-shadow cursor-pointer relative ${page.is_archived ? "opacity-60" : ""}`}
              onClick={() => {
                setEditingPage(page);
                if (page.tracking_params) {
                  setGenParams({
                    ...DEFAULT_GEN_PARAMS,
                    ...page.tracking_params,
                  });
                } else {
                  setGenParams(DEFAULT_GEN_PARAMS);
                }
                if (page.vturb_config) {
                  setVturbConfig({
                    ...DEFAULT_VTURB_CONFIG,
                    ...page.vturb_config,
                  });
                  setVturbTextInput(
                    vturbConfigToText(page.vturb_config.videos || [])
                  );
                } else {
                  setVturbConfig(DEFAULT_VTURB_CONFIG);
                  setVturbTextInput("");
                }
                setShowForm(true);
              }}
            >
              {/* Action Buttons */}
              <div className="absolute top-2 right-2 z-10 flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-50 hover:opacity-100"
                  title={page.is_archived ? "Desarquivar" : "Arquivar"}
                  onClick={async e => {
                    e.stopPropagation();
                    await supabase
                      .from("pages")
                      .update({ is_archived: !page.is_archived })
                      .eq("id", page.id);
                    toast.success(
                      page.is_archived
                        ? "Página desarquivada"
                        : "Página arquivada"
                    );
                    fetchPages();
                  }}
                >
                  <Archive
                    className={`h-3.5 w-3.5 ${page.is_archived ? "text-orange-500" : ""}`}
                  />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-50 hover:opacity-100"
                  title="Duplicar página"
                  onClick={e => {
                    e.stopPropagation();
                    handleDuplicate(page);
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between pr-8">
                  <CardTitle className="text-lg truncate">
                    {page.name}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    {page.is_archived && (
                      <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                        <Archive className="h-3 w-3" />
                      </span>
                    )}
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
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded w-fit">
                    /{page.slug}
                  </code>
                  <select
                    className="text-xs bg-blue-50 border border-blue-200 text-blue-600 px-2 py-0.5 rounded-full cursor-pointer hover:bg-blue-100"
                    value={page.folder || ""}
                    onClick={e => e.stopPropagation()}
                    onChange={async e => {
                      e.stopPropagation();
                      const newFolder = e.target.value || null;
                      await supabase
                        .from("pages")
                        .update({ folder: newFolder })
                        .eq("id", page.id);
                      toast.success(
                        newFolder
                          ? `Movido para "${newFolder}"`
                          : "Removido da pasta"
                      );
                      fetchPages();
                    }}
                  >
                    <option value="">📁 Sem pasta</option>
                    {folders.map(f => (
                      <option key={f} value={f}>
                        📂 {f}
                      </option>
                    ))}
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Speed Badge */}
                  {speedStats[page.slug] ? (
                    <div className="flex items-center gap-2 text-xs">
                      <Gauge
                        className={`h-4 w-4 ${speedStats[page.slug].last_latency < 200 ? "text-green-500" : speedStats[page.slug].last_latency < 500 ? "text-yellow-500" : "text-red-500"}`}
                      />
                      <span className="font-bold">
                        {speedStats[page.slug].last_latency}ms
                      </span>
                      <span className="text-muted-foreground text-[10px] uppercase tracking-wider">
                        (Real-Time)
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground opacity-50">
                      <Gauge className="h-4 w-4" />
                      <span>Sem dados recentes</span>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground flex items-center gap-2 border-t pt-2">
                    <RefreshCw className="h-3 w-3" />
                    Atualizado em{" "}
                    {new Date(page.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredPages.length === 0 && (
            <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
              {pages.length === 0
                ? "Nenhuma página criada ainda."
                : "Nenhuma página encontrada com os filtros selecionados."}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
