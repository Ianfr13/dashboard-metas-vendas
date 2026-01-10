import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useLocation } from 'wouter';

export function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Verificar se já está autenticado
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const email = session.user.email || '';
        const domain = email.split('@')[1];

        if (domain === 'douravita.com.br') {
          setLocation('/');
        } else {
          await supabase.auth.signOut();
          setError('Acesso negado. Apenas emails @douravita.com.br são permitidos.');
        }
      }
    };

    checkSession();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event, session);

      if (event === 'SIGNED_IN' && session) {
        const email = session.user.email || '';
        const domain = email.split('@')[1];

        if (domain === 'douravita.com.br') {
          console.log('Redirecting to /');
          setLocation('/');
        } else {
          setError('Acesso negado. Apenas emails @douravita.com.br são permitidos.');
          await supabase.auth.signOut();
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [setLocation]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://dashboard.douravita.com.br',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            hd: 'douravita.com.br',
          },
        },
      });

      if (error) throw error;
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-2xl">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            DouraVita Dashboard
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Faça login com sua conta Google
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Apenas emails @douravita.com.br
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span>Carregando...</span>
            ) : (
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continuar com Google
              </span>
            )}
          </button>

          <div className="text-center text-xs text-gray-500 mt-4">
            <p>Ao fazer login, você concorda com nossos</p>
            <p>Termos de Serviço e Política de Privacidade</p>
          </div>
        </div>
      </div>
    </div>
  );
}
