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
