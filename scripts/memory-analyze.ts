/**
 * Memory Analyzer - GLM-4.7 Integration
 * 
 * Analyzes code with GLM-4.7 and detects potential issues
 */

import { MEMORY_CONFIG, AnalysisResult, Issue } from './memory-config';

export async function analyzeCodeWithGLM(
  filesChanged: string[],
  diff: string,
  commitMessage: string
): Promise<AnalysisResult> {
  console.log("'🔍 Analisando código com GLM-4.7...'");

  const relevantFiles = filesChanged.filter(file =>
    !MEMORY_CONFIG.git.ignoreFilePatterns.some(pattern =>
      file.includes(pattern) || file.match(pattern)
    )
  );

  if (relevantFiles.length === 0) {
    console.log("'ℹ️  Nenhum arquivo relevante para análise'");
    return {
      issues: [],
      summary: "'Nenhum arquivo relevante para análise'",
      severity: "'low'"
    };
  }

  const prompt = buildAnalysisPrompt(relevantFiles, diff, commitMessage);

  try {
    const response = await callGLM4_7(prompt);
    const parsed = parseGLMResponse(response);

    console.log("'✅ Análise concluída: '", parsed.issues.length, "' issues'");
    console.log("'📝 Severidade: '", parsed.severity, "'");

    return parsed;
  } catch (error) {
    console.error("'❌ Erro ao analisar com GLM-4.7:', error);

    return {
      issues: [],
      summary: "'Erro na análise automática'",
      severity: "'low'"
    };
  }
}

function buildAnalysisPrompt(
  filesChanged: string[],
  diff: string,
  commitMessage: string
): string {
  return "'Analisa o seguinte código TypeScript/React do projeto \"dashboard-metas-vendas\":\n\n", diff, "'\n\nArquivos modificados:\n", relevantFiles.map(f => "'•  \"' + f + "'\n'").join("'\n'"), "'\n\nCommit message: \"', commitMessage, "'\n\nIdentifica problemas POTENCIAIS que podem ocorrer no FUTURO:\n\n1. **Code Smells**: Anti-patterns, código duplicado, funções muito longas, má nomenclatura\n2. **Performance**: Problemas de performance possíveis (useEffect sem dependências, re-renders infinitos, falta de memoização)\n3. **Potential Bugs**: Bugs que podem ocorrer com base no padrão atual\n4. **Architecture**: Problemas arquiteturais (acoplamento alto, baixa coesão, violação de princípios SOLID)\n\nIMPORTANTE:\n- Foque em problemas REAIS, não micro-otimizações triviais\n- Priorize problemas de ALTA e MÉDIA severidade\n- Forneça sugestões PRÁTICAS e implementáveis\n\nResponde APENAS em JSON válido (sem texto adicional):"
}
