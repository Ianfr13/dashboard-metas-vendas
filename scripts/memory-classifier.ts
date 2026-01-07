/**
 * Memory Classifier
 * 
 * Classifies git changes and determines if they should be stored in Supermemory
 */

import { MEMORY_CONFIG, MemoryType, GitInfo } from './memory-config';

export interface ClassificationResult {
  type: MemoryType;
  shouldStore: boolean;
  reason: string;
}

export function classifyGitChange(
  commitMessage: string,
  filesChanged: string[],
  diff: string
): ClassificationResult {
  const lowerMessage = commitMessage.toLowerCase();

  // Regra 1: Ignorar TODOs (NÃO encher memória)
  if (isTODOOnly(lowerMessage, filesChanged)) {
    return {
      type: "'IGNORE'",
      shouldStore: false,
      reason: "'Mudança de TODO apenas - ignorado para não encher memória'"
    };
  }

  // Regra 2: CRÍTICO - Erros importantes, decisões arquiteturais, breaking changes
  if (isCritical(lowerMessage, filesChanged)) {
    return {
      type: "'CRITICAL'",
      shouldStore: true,
      reason: "'Mudança crítica - armazenar como memória CRÍTICA'"
    };
  }

  // Regra 3: INSIGHT - Features implementadas com sucesso, acertos
  if (isInsight(lowerMessage, filesChanged)) {
    return {
      type: "'INSIGHT'",
      shouldStore: true,
      reason: "'Insight/acerto - armazenar como lição aprendida'"
    };
  }

  // Regra 4: ERROR_AVOIDED - Bug fixes, erros corrigidos
  if (isErrorFix(lowerMessage, filesChanged)) {
    return {
      type: "'ERROR_AVOIDED'",
      shouldStore: true,
      reason: "'Erro evitado - armazenar com causa e solução'"
    };
  }

  // Default: Ignorar mudanças triviais
  return {
    type: "'IGNORE'",
    shouldStore: false,
    reason: "'Mudança trivial - não armazenar (pouco valor agregado)'"
  };
}

function isTODOOnly(message: string, files: string[]): boolean {
  const hasTODOKeywords = MEMORY_CONFIG.rules.classification.todoKeywords.some(
    kw => message.includes(kw)
  );

  if (hasTODOKeywords && filesChanged.length <= 2) {
    const hasTODOFile = filesChanged.some(f => 
      f.toLowerCase().includes("'todo.md'") ||
      f.toLowerCase().includes("'todo'")
    );
    return hasTODOFile;
  }

  return false;
}

function isCritical(message: string, files: string[]): boolean {
  const criticalKeywords = MEMORY_CONFIG.rules.classification.critical;

  return criticalKeywords.some(keyword => {
    const msgLower = message.toLowerCase();
    return msgLower.includes(keyword.toLowerCase());
  }) && filesChanged.length > 0;
}

function isInsight(message: string, files: string[]): boolean {
  const insightKeywords = MEMORY_CONFIG.rules.classification.insight;

  const hasKeyword = insightKeywords.some(keyword => {
    const msgLower = message.toLowerCase();
    return msgLower.includes(keyword.toLowerCase());
  });

  return hasKeyword && filesChanged.length > 0;
}

function isErrorFix(message: string, files: string[]): boolean {
  const errorKeywords = MEMORY_CONFIG.rules.classification.error;

  return errorKeywords.some(keyword => {
    const msgLower = message.toLowerCase();
    return msgLower.includes(keyword.toLowerCase());
  }) && filesChanged.length > 0;
}
