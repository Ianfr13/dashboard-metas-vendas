import { getLoginUrl } from "@/const";
import { supabase } from "@/lib/supabase";
import { useCallback, useEffect, useState, useMemo } from "react";
import type { User } from "@supabase/supabase-js";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = getLoginUrl() } =
    options ?? {};
  
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Carregar usuário inicial
  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoading(true);
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        setUser(user);
        
        // Salvar no localStorage para compatibilidade
        if (user) {
          localStorage.setItem("manus-runtime-user-info", JSON.stringify(user));
        }
      } catch (err: any) {
        console.error('Erro ao carregar usuário:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        localStorage.setItem("manus-runtime-user-info", JSON.stringify(session.user));
      } else {
        localStorage.removeItem("manus-runtime-user-info");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      localStorage.removeItem("manus-runtime-user-info");
    } catch (err: any) {
      console.error('Erro ao fazer logout:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      setUser(user);
    } catch (err: any) {
      console.error('Erro ao atualizar usuário:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const state = useMemo(() => ({
    user,
    loading,
    error,
    isAuthenticated: Boolean(user),
  }), [user, loading, error]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (loading) return;
    if (user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath;
  }, [
    redirectOnUnauthenticated,
    redirectPath,
    loading,
    user,
  ]);

  return {
    ...state,
    refresh,
    logout,
  };
}
