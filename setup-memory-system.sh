#!/bin/bash

# ============================================
# Setup Script - Supermemory + GLM-4.7 + Vibe Kanban
# ============================================
# Este script cria automaticamente todos os arquivos do sistema de memória
# ============================================

set -e  # Exit on error

CORES=(
    '\033[0;32m'  # GREEN
    '\033[1;33m'  # YELLOW
    '\033[0;31m'  # RED
    '\033[0m'       # NC
)

PROJECT_DIR="/users/Ian/dev/dashboard-metas-vendas"
SCRIPTS_DIR="$PROJECT_DIR/scripts"
GIT_HOOKS_DIR="$PROJECT_DIR/.git/hooks"

echo -e "${CORES[0]}========================================"
echo -e " Setup do Sistema de Memória"
echo -e "========================================${CORES[3m]}"
echo ""

# Detectar package manager (pnpm ou npm)
if command -v pnpm >/dev/null 2>&1; then
    PKG_MANAGER="pnpm"
    PKG_CMD="pnpm"
else
    PKG_MANAGER="npm"
    PKG_CMD="npm"
fi

echo -e "${CORES[0]}✓ Package Manager detectado: $PKG_MANAGER${CORES[3m]}"

# ============================================
# Passo 1: Criar diretório scripts/
# ============================================
echo -e "${CORES[1]}1️⃣  Criando diretório scripts/...${CORES[3m]}"

if [ ! -d "$SCRIPTS_DIR" ]; then
    mkdir -p "$SCRIPTS_DIR"
    echo -e "${CORES[0]}   ✓ Diretório scripts/ criado${CORES[3m]}"
else
    echo -e "${CORES[0]}   ✓ Diretório scripts/ já existe${CORES[3m]}"
fi
echo ""

# ============================================
# Passo 2: Criar scripts/memory-config.ts
# ============================================
echo -e "${CORES[1]}2️⃣  Criando scripts/memory-config.ts...${CORES[3m]}"

cat > "$SCRIPTS_DIR/memory-config.ts" << 'EOF'
/**
 * Memory System Configuration
 * 
 * Central configuration for Supermemory + GLM-4.7 + Vibe Kanban integration
 */

export const MEMORY_CONFIG = {
  // ============================================
  // SUPERMEMORY CONFIGURATION
  // ============================================
  supermemory: {
    apiKey: process.env.SUPERMEMORY_API_KEY || "'",
    containerTag: process.env.SUPERMEMORY_CONTAINER_TAG || "'supermemory'",
    baseURL: "https://api.supermemory.ai"
  },

  // ============================================
  // ZEN API CONFIGURATION (GLM-4.7)
  // ============================================
  zen: {
    apiKey: process.env.ZEN_API_KEY || "'",
    model: process.env.ZEN_MODEL || "'glm-4.7'",
    baseURL: process.env.ZEN_API_URL || "'https://open.bigmodel.cn/api/paas/v4'"
  },

  // ============================================
  // CLASSIFICATION RULES
  // ============================================
  rules: {
    // NÃO armazenar TODOs (para não encher memória)
    ignoreTODOs: true,

    // Armazenar APENAS: CRÍTICOS, INSIGHTS, ERROS EVITADOS, ACERTOS
    categories: {
      CRITICAL: "'critical'",
      INSIGHT: "'insight'",
      ERROR_AVOIDED: "'error_avoided'",
      SUCCESS: "'success'"
    },

    // Keywords para classificação automática
    classification: {
      critical: ["'fix:'", "'bug:'", "'critical'", "'breaking'", "'security'", "'auth'", "'rls'", "'refactor'", "'migration'"],
      insight: ["'feat:'", "'add:'", "'implement'", "'success'", "'completed'", "'done'"],
      error: ["'fix:'", "'bugfix:'", "'hotfix'", "'resolve error'", "'fix bug'"],
      todoKeywords: ["'todo'", "'update todo'", "'wip'"]
    }
  },

  // ============================================
  // GIT SETTINGS
  // ============================================
  git: {
    maxCommitsToAnalyze: 5,
    ignoreFilePatterns: [
      "'*.min.js'",
      "'*.min.css'",
      "'*.min.ts'",
      "'node_modules/'",
      "'dist/'",
      "'.git/'",
      "'coverage/'",
      "'*.log'"
    ]
  }
} as const;

// Types
export interface MemoryType {
  type: "'CRITICAL'" | "'INSIGHT'" | "'ERROR_AVOIDED'" | "'SUCCESS'" | "'IGNORE'";
}

export interface GitInfo {
  commitMessage: string;
  filesChanged: string[];
  diff: string;
  branch: string;
  hash: string;
  timestamp: string;
}

export interface AnalysisResult {
  issues: Issue[];
  summary: string;
  severity: "'low'" | "'medium'" | "'high'";
}

export interface Issue {
  type: "'code_smell'" | "'performance'" | "'potential_bug'" | "'architecture'";
  severity: "'low'" | "'medium'" | "'high'";
  description: string;
  suggestion: string;
  file: string;
  line?: number;
}

export interface MemoryMetadata {
  type: string;
  category?: string;
  files: string[];
  commit_hash?: string;
  branch?: string;
  timestamp?: string;
  severity?: string;
  analysis?: string;
  issues_count?: number;
  project: string;
}
EOF

echo -e "${CORES[0]}   ✓ scripts/memory-config.ts criado (~80 linhas)${CORES[3m]}"
echo ""

# ============================================
# Passo 3: Criar scripts/memory-classifier.ts
# ============================================
echo -e "${CORES[1]}3️⃣  Criando scripts/memory-classifier.ts...${CORES[3m]}"

cat > "$SCRIPTS_DIR/memory-classifier.ts" << 'EOF'
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
EOF

echo -e "${CORES[0]}   ✓ scripts/memory-classifier.ts criado (~150 linhas)${CORES[3m]}"
echo ""

# ============================================
# Passo 4: Criar scripts/memory-analyze.ts
# ============================================
echo -e "${CORES[1]}4️⃣  Criando scripts/memory-analyze.ts...${CORES[3m]}"

cat > "$SCRIPTS_DIR/memory-analyze.ts" << 'EOF'
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
EOF

echo -e "${CORES[0]}   ✓ scripts/memory-analyze.ts criado (~150 linhas)${CORES[3m]}"
echo ""

# ============================================
# Passo 5: Criar scripts/memory-sync.ts
# ============================================
echo -e "${CORES[1]}5️⃣  Criando scripts/memory-sync.ts...${CORES[3m]}"

cat > "$SCRIPTS_DIR/memory-sync.ts" << 'EOF'
/**
 * Memory Sync - Git Hook Principal
 * 
 * Orchestrates entire memory synchronization process:
 * 1. Collects git info
 * 2. Classifies changes
 * 3. Analyzes code with GLM-4.7
 * 4. Creates memory
 * 5. Sends to Supermemory
 */

import Supermemory from "'supermemory'";
import { execSync } from "'child_process'";
import { MEMORY_CONFIG, GitInfo, MemoryType, MemoryMetadata, AnalysisResult } from "'./memory-config'";
import { classifyGitChange } from "'./memory-classifier'";
import { analyzeCodeWithGLM } from "'./memory-analyze'";

const client = new Supermemory({
  apiKey: MEMORY_CONFIG.supermemory.apiKey
});

async function main(): Promise<void> {
  console.log("'🔄 Sincronizando memória com Supermemory...\n'");

  try {
    const gitInfo = collectGitInfo();
    console.log("'📊 '", gitInfo.filesChanged.length, "' arquivos modificados");
    console.log("'📝 Commit: \"', gitInfo.commitMessage);
    console.log("'🌿 Branch: \"', gitInfo.branch);

    const classification = classifyGitChange(
      gitInfo.commitMessage,
      gitInfo.filesChanged,
      gitInfo.diff
    );

    console.log("'🏷️  Tipo: \"', classification.type);
    console.log("'💬 Reason: \"', classification.reason);

    if (!classification.shouldStore) {
      console.log("'⏭️  Ignorando mudança (não armazenar)'");
      return;
    }

    const analysis = classification.type !== "'IGNORE'" 
      ? await analyzeCodeWithGLM(gitInfo.filesChanged, gitInfo.diff, gitInfo.commitMessage)
      : null;

    if (analysis && analysis.issues.length > 0) {
      console.log("'⚠️  '", analysis.issues.length, "' issues encontradas');
      console.log("'📝 Severidade: \"', analysis.severity);
    }

    const memory = createMemory(
      classification.type,
      gitInfo,
      analysis
    );

    await client.memories.add({
      content: memory.content,
      containerTag: MEMORY_CONFIG.supermemory.containerTag,
      metadata: memory.metadata
    });

    console.log("'");
    console.log("'✅ Memória armazenada no Supermemory');
    console.log("'🧠  Type: \"', memory.metadata.type);
    console.log("'📁 Files: \"', memory.metadata.files.join("', '));
    
    if (memory.metadata.analysis) {
      console.log("'🔍 Analysis: \"', memory.metadata.analysis);
    }
    } catch (error) {
    console.error("'\n❌ Erro ao sincronizar memória:', error);
    throw error;
  }
}

function collectGitInfo(): GitInfo {
  const commitMessage = execSync("'git log -1 --pretty=%B'", { encoding: "'utf-8"' }).trim();
  const filesChanged = execSync("'git diff --name-only --cached'", { encoding: "'utf-8"' })
    .split("'\n'")
    .map(f => f.trim())
    .filter(f => f.length > 0);
  const diff = execSync("'git diff --cached'", { encoding: "'utf-8"' });
  const branch = execSync("'git rev-parse --abbrev-ref HEAD'", { encoding: "'utf-8"' }).trim();
  const hash = execSync("'git rev-parse --short HEAD'", { encoding: "'utf-8"' }).trim();

  return {
    commitMessage,
    filesChanged,
    diff,
    branch,
    hash,
    timestamp: new Date().toISOString()
  };
}

function createMemory(
  type: MemoryType,
  gitInfo: GitInfo,
  analysis: AnalysisResult | null
): { content: string; metadata: MemoryMetadata } {
  switch (type) {
    case "'CRITICAL'":
      return createCriticalMemory(gitInfo);
    case "'INSIGHT'":
      return createInsightMemory(gitInfo, analysis);
    case "'ERROR_AVOIDED'":
      return createErrorAvoidedMemory(gitInfo);
    case "'SUCCESS'":
      return createSuccessMemory(gitInfo, analysis);
    default:
      throw new Error("'Tipo de memória desconhecido: \"', type);
  }
}

function createCriticalMemory(gitInfo: GitInfo): { content: string; metadata: MemoryMetadata } {
  const files = gitInfo.filesChanged.map(f => "• " + f + "");
  return {
    content: "'CRÍTICO: \" + gitInfo.commitMessage + "\n\nArquivos modificados:\n" + files + "\n\nBranch: " + gitInfo.branch + "\nCommit: " + gitInfo.hash + "\nTimestamp: " + gitInfo.timestamp
EOF

echo -e "${CORES[0]}   ✓ scripts/memory-sync.ts criado (~250 linhas)${CORES[3m]}"
echo ""

# ============================================
# Passo 6: Criar .git/hooks/pre-commit
# ============================================
echo -e "${CORES[1]}6️⃣  Criando .git/hooks/pre-commit...${CORES[3m]}"

if [ ! -d "$GIT_HOOKS_DIR" ]; then
  mkdir -p "$GIT_HOOKS_DIR"
fi

cat > "$GIT_HOOKS_DIR/pre-commit" << 'EOF'
#!/bin/bash

# ============================================
# Git Pre-commit Hook - Supermemory Sync
# ============================================
# Automatically syncs memory with Supermemory before each commit
#
# This hook:
# 1. Runs memory-sync.ts
# 2. Classifies changes (CRITICAL/INSIGHT/ERROR_AVOIDED/SUCCESS/IGNORE)
# 3. Analyzes code with GLM-4.7
# 4. Stores memories in Supermemory (container: "supermemory")
# 5. Blocks commit if sync fails (optional)
# ============================================

set -e

echo "🔄 Sincronizando memória com Supermemory..."

# Execute memory sync script
npx tsx scripts/memory-sync.ts

# Check result
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
    echo ""
    echo "❌ Erro ao sincronizar memória"
    echo "Commit abortado. Corrija o erro e tente novamente."
    exit 1
fi

echo ""
echo "✅ Memória sincronizada com sucesso!"
echo "📊 Você pode usar 'npm run memory:context' para ver o contexto atual"
echo ""
exit 0
EOF

chmod +x "$GIT_HOOKS_DIR/pre-commit"

echo -e "${CORES[0]}   ✓ .git/hooks/pre-commit criado e executável${CORES[3m]}"
echo ""

# ============================================
# Passo 7: Criar .vibe-kanban-config.json
# ============================================
echo -e "${CORES[1]}7️⃣  Criando .vibe-kanban-config.json...${CORES[3m]}"

cat > "$PROJECT_DIR/.vibe-kanban-config.json" << 'EOF'
{
  "mcpServers": {
    "supermemory": {
      "command": "npx",
      "args": ["-y", "@supermemory/tools"],
      "env": {
        "SUPERMEMORY_API_KEY": "sm_cepb9GvKWRNJmQv2sFfVpH_luWoBnwLRfoKlQmRRFqdQSnwPvOoDOTqodkEqgGYzCNyBfUQfdmnZYdYUQJlmlry"
      }
    }
  },
  "executors": {
    "GLM_4_7": {
      "DEFAULT": {
        "GLM_4_7": {
          "api_key": "sk-uqs3ZfJbkcozrGAJlpyT0inZcfNCIVYjhWS5aoqaye3Wf9ugSWw0HzJDeCKvT8m",
          "model": "glm-4.7",
          "mcpServers": ["supermemory"]
        }
      }
    }
  }
}
EOF

echo -e "${CORES[0]}   ✓ .vibe-kanban-config.json criado${CORES[3m]}"
echo ""

echo ""
echo "========================================"
echo "✅ Setup do Sistema de Memória Concluído!"
echo "========================================"
echo ""
echo "📋 Próximos Passos:"
echo ""
echo "1. Verificar se .env foi configurado com as API keys"
echo ""
echo "2. Instalar dependências: cd /users/Ian/dev/dashboard-metas-vendas && $PKG_MANAGER install supermemory tsx"
echo ""
echo "3. Testar o git hook: cd /users/Ian/dev/dashboard-metas-vendas && git add . && git commit -m 'test'"
echo ""
echo "4. Configurar Vibe Kanban seguindo o guia em VIBE_KANBAN_SETUP.md"
echo ""
echo ""
echo "Para ver o contexto atual: cd /users/Ian/dev/dashboard-metas-vendas && npm run memory:context"
EOF

chmod +x setup-memory-system.sh