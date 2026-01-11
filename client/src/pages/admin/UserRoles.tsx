import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardLayout from "@/components/DashboardLayout";
import { Plus, Trash2, Shield, Users, Crown, UserCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useUserRole, Role, Permissions } from "@/hooks/useUserRole";

interface UserRoleEntry {
    id: string;
    email: string;
    role: Role;
    permissions: Permissions;
    created_at: string;
}

const DEFAULT_PERMISSIONS: Permissions = {
    pages: { read: false, write: false },
    ab_tests: { read: false, write: false },
    metas: { read: false, write: false },
    configuracoes: { read: false, write: false },
};

const FEATURE_LABELS: Record<keyof Permissions, string> = {
    pages: "Páginas (CMS)",
    ab_tests: "Testes A/B",
    metas: "Metas",
    configuracoes: "Configurações",
};

export default function UserRoles() {
    const { isMaster, loading: roleLoading } = useUserRole();
    const [users, setUsers] = useState<UserRoleEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newEmail, setNewEmail] = useState("");
    const [newRole, setNewRole] = useState<Role>("admin");
    const [newPermissions, setNewPermissions] = useState<Permissions>(DEFAULT_PERMISSIONS);

    useEffect(() => {
        if (isMaster) {
            fetchUsers();
        }
    }, [isMaster]);

    async function fetchUsers() {
        setLoading(true);
        const { data, error } = await supabase
            .from("user_roles")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching users:", error);
            toast.error("Erro ao carregar usuários");
        } else {
            setUsers(data || []);
        }
        setLoading(false);
    }

    async function addUser() {
        if (!newEmail || !newEmail.includes("@")) {
            return toast.error("Email inválido");
        }

        const { error } = await supabase.from("user_roles").insert({
            email: newEmail,
            role: newRole,
            permissions: newRole === "master" ? {
                pages: { read: true, write: true },
                ab_tests: { read: true, write: true },
                metas: { read: true, write: true },
                configuracoes: { read: true, write: true },
            } : newPermissions,
        });

        if (error) {
            if (error.code === "23505") {
                toast.error("Este email já está cadastrado");
            } else {
                toast.error("Erro ao adicionar: " + error.message);
            }
            return;
        }

        toast.success("Usuário adicionado!");
        setNewEmail("");
        setNewRole("admin");
        setNewPermissions(DEFAULT_PERMISSIONS);
        setShowForm(false);
        fetchUsers();
    }

    async function updateRole(user: UserRoleEntry, role: Role) {
        const { error } = await supabase
            .from("user_roles")
            .update({
                role,
                permissions: role === "master" ? {
                    pages: { read: true, write: true },
                    ab_tests: { read: true, write: true },
                    metas: { read: true, write: true },
                    configuracoes: { read: true, write: true },
                } : user.permissions
            })
            .eq("id", user.id);

        if (error) {
            toast.error("Erro ao atualizar: " + error.message);
        } else {
            toast.success("Papel atualizado!");
            fetchUsers();
        }
    }

    async function updatePermission(
        user: UserRoleEntry,
        feature: keyof Permissions,
        action: "read" | "write",
        value: boolean
    ) {
        const newPermissions = {
            ...user.permissions,
            [feature]: {
                ...user.permissions[feature],
                [action]: value,
                // If enabling write, also enable read
                ...(action === "write" && value ? { read: true } : {}),
            },
        };

        const { error } = await supabase
            .from("user_roles")
            .update({ permissions: newPermissions })
            .eq("id", user.id);

        if (error) {
            toast.error("Erro ao atualizar permissão");
        } else {
            fetchUsers();
        }
    }

    async function deleteUser(user: UserRoleEntry) {
        if (!confirm(`Remover "${user.email}"?`)) return;

        const { error } = await supabase.from("user_roles").delete().eq("id", user.id);

        if (error) {
            toast.error("Erro ao remover: " + error.message);
        } else {
            toast.success("Usuário removido");
            fetchUsers();
        }
    }

    // Only masters can access this page
    if (roleLoading) {
        return <DashboardLayout><p>Carregando...</p></DashboardLayout>;
    }

    if (!isMaster) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center py-20">
                    <Shield className="h-16 w-16 text-muted-foreground mb-4" />
                    <h2 className="text-xl font-bold">Acesso Restrito</h2>
                    <p className="text-muted-foreground">Apenas usuários Master podem acessar esta página.</p>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Users className="h-6 w-6" /> Gerenciar Usuários
                        </h2>
                        <p className="text-muted-foreground">Configure papéis e permissões dos usuários</p>
                    </div>
                    <Button onClick={() => setShowForm(!showForm)}>
                        <Plus className="h-4 w-4 mr-2" /> Adicionar Usuário
                    </Button>
                </div>

                {/* Add User Form */}
                {showForm && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Novo Usuário</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input
                                        placeholder="email@douravita.com.br"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Papel</Label>
                                    <Select value={newRole} onValueChange={(v) => setNewRole(v as Role)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="user">Usuário (Visualizador)</SelectItem>
                                            <SelectItem value="admin">Admin (Configurável)</SelectItem>
                                            <SelectItem value="master">Master (Acesso Total)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {newRole === "admin" && (
                                <div className="space-y-3 p-4 border rounded-lg">
                                    <Label>Permissões do Admin</Label>
                                    {(Object.keys(FEATURE_LABELS) as Array<keyof Permissions>).map((feature) => (
                                        <div key={feature} className="flex items-center justify-between py-2 border-b last:border-0">
                                            <span className="font-medium">{FEATURE_LABELS[feature]}</span>
                                            <div className="flex gap-4">
                                                <label className="flex items-center gap-2 text-sm">
                                                    <Switch
                                                        checked={newPermissions[feature].read}
                                                        onCheckedChange={(v) =>
                                                            setNewPermissions({
                                                                ...newPermissions,
                                                                [feature]: { ...newPermissions[feature], read: v },
                                                            })
                                                        }
                                                    />
                                                    Leitura
                                                </label>
                                                <label className="flex items-center gap-2 text-sm">
                                                    <Switch
                                                        checked={newPermissions[feature].write}
                                                        onCheckedChange={(v) =>
                                                            setNewPermissions({
                                                                ...newPermissions,
                                                                [feature]: {
                                                                    read: v ? true : newPermissions[feature].read,
                                                                    write: v
                                                                },
                                                            })
                                                        }
                                                    />
                                                    Escrita
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <Button onClick={addUser}>Adicionar</Button>
                        </CardContent>
                    </Card>
                )}

                {/* Users List */}
                {loading ? (
                    <p>Carregando usuários...</p>
                ) : (
                    <div className="space-y-4">
                        {users.map((user) => (
                            <Card key={user.id}>
                                <CardHeader className="flex flex-row items-center justify-between py-4">
                                    <div className="flex items-center gap-3">
                                        {user.role === "master" ? (
                                            <Crown className="h-5 w-5 text-yellow-500" />
                                        ) : user.role === "admin" ? (
                                            <UserCheck className="h-5 w-5 text-blue-500" />
                                        ) : (
                                            <Users className="h-5 w-5 text-gray-400" />
                                        )}
                                        <div>
                                            <CardTitle className="text-base">{user.email}</CardTitle>
                                            <CardDescription>
                                                {user.role === "master" ? "Master (Acesso Total)" :
                                                    user.role === "admin" ? "Admin (Configurável)" : "Usuário"}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <Select
                                            value={user.role}
                                            onValueChange={(v) => updateRole(user, v as Role)}
                                        >
                                            <SelectTrigger className="w-[140px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="user">Usuário</SelectItem>
                                                <SelectItem value="admin">Admin</SelectItem>
                                                <SelectItem value="master">Master</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => deleteUser(user)}
                                            className="text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardHeader>

                                {user.role === "admin" && (
                                    <CardContent className="pt-0">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {(Object.keys(FEATURE_LABELS) as Array<keyof Permissions>).map((feature) => (
                                                <div key={feature} className="p-3 border rounded-lg space-y-2">
                                                    <span className="text-sm font-medium">{FEATURE_LABELS[feature]}</span>
                                                    <div className="flex flex-col gap-1">
                                                        <label className="flex items-center gap-2 text-xs">
                                                            <Switch
                                                                checked={user.permissions[feature]?.read ?? false}
                                                                onCheckedChange={(v) => updatePermission(user, feature, "read", v)}
                                                            />
                                                            Leitura
                                                        </label>
                                                        <label className="flex items-center gap-2 text-xs">
                                                            <Switch
                                                                checked={user.permissions[feature]?.write ?? false}
                                                                onCheckedChange={(v) => updatePermission(user, feature, "write", v)}
                                                            />
                                                            Escrita
                                                        </label>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        ))}

                        {users.length === 0 && (
                            <p className="text-center text-muted-foreground py-8">
                                Nenhum usuário cadastrado ainda
                            </p>
                        )}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
