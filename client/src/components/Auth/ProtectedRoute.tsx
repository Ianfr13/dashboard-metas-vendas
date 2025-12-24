import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    // Verificar autenticação
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Verificar domínio do email
        const email = session.user.email || '';
        const domain = email.split('@')[1];

        if (domain === 'douravita.com.br') {
          setAuthenticated(true);
        } else {
          // Deslogar se não for do domínio permitido
          supabase.auth.signOut();
          setAuthenticated(false);
        }
      } else {
        setAuthenticated(false);
      }
      setLoading(false);
    });

    // Listener para mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const email = session.user.email || '';
        const domain = email.split('@')[1];
        setAuthenticated(domain === 'douravita.com.br');
      } else {
        setAuthenticated(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!authenticated) {
    setLocation('/login');
    return null;
  }

  return <>{children}</>;
}
