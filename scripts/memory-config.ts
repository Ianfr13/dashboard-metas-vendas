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
