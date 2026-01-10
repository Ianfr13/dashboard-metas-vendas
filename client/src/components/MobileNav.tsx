import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Home, BarChart3, Settings, Menu, LogOut, User, GitBranch, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setOpen(false);
      setLocation('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/metricas", icon: BarChart3, label: "Métricas" },
    { href: "/admin", icon: Settings, label: "Admin" },
    { href: "/admin/ab-tests", icon: GitBranch, label: "Testes A/B" },
    { href: "/admin/pages", icon: FileText, label: "Páginas (CMS)" },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>

        {/* User Info */}
        {user && (
          <div className="mt-6 pb-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              {user.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="Avatar"
                  className="h-10 w-10 rounded-full"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex flex-col gap-2 mt-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className="w-full justify-start gap-3"
                  onClick={() => setOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        {user && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <Button
              variant="destructive"
              className="w-full justify-start gap-3"
              onClick={handleLogout}
              disabled={loading}
            >
              <LogOut className="h-5 w-5" />
              {loading ? 'Saindo...' : 'Sair'}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
