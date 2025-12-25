// Constantes movidas para cá (antes estavam em @shared/const)
export const COOKIE_NAME = "manus-session";
export const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

// Generate login URL at runtime so redirect URI reflects the current origin.
export const getLoginUrl = () => {
  // Para Supabase, redirecionar para a página de login
  return "/login";
};
