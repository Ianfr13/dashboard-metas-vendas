/**
 * Função segura para formatar números com casas decimais
 * Retorna "0" se o valor for undefined, null ou NaN
 */
export function safeToFixed(value: number | undefined | null, decimals: number = 2): string {
  if (value === undefined || value === null || isNaN(value)) {
    return (0).toFixed(decimals);
  }
  return value.toFixed(decimals);
}

/**
 * Formata valor monetário
 */
export function formatCurrency(value: number | undefined | null): string {
  const num = value || 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(num);
}

/**
 * Formata número com separador de milhares
 */
export function formatNumber(value: number | undefined | null): string {
  const num = value || 0;
  return new Intl.NumberFormat('pt-BR').format(num);
}

/**
 * Formata porcentagem
 */
export function formatPercent(value: number | undefined | null, decimals: number = 1): string {
  return `${safeToFixed(value, decimals)}%`;
}
