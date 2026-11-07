import { MemoryItem, MemoryLayer } from '../types';
import { StorageService } from './storage';

export interface MemoryRetrievalQuery {
  query: string;
  projectId?: string;
  layers?: MemoryLayer[];
  limit?: number;
  minImportance?: number;
}

export interface ScoredMemory {
  memory: MemoryItem;
  score: number; // 0.0 - 1.0 composite
  reasons: string[];
}

export class MemoryEngine {
  /**
   * Fast local vector embedding simulator using character n-grams and TF-IDF term hashing.
   * Provides cosine similarity without requiring external cloud embeddings for privacy-first speed.
   */
  static generateEmbedding(text: string): number[] {
    const dim = 64;
    const vector = new Array(dim).fill(0);
    const cleaned = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    const tokens = cleaned.split(/\s+/).filter(Boolean);

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      // Hash token to index
      let hash = 0;
      for (let j = 0; j < token.length; j++) {
        hash = (hash << 5) - hash + token.charCodeAt(j);
        hash |= 0;
      }
      const index = Math.abs(hash) % dim;
      vector[index] += 1;

      // Bigram features
      if (i > 0) {
        const bigram = tokens[i - 1] + '_' + token;
        let biHash = 0;
        for (let j = 0; j < bigram.length; j++) {
          biHash = (biHash << 5) - biHash + bigram.charCodeAt(j);
          biHash |= 0;
        }
        const biIndex = Math.abs(biHash) % dim;
        vector[biIndex] += 1.5;
      }
    }

    // Normalize to unit vector
    let magnitude = 0;
    for (let v of vector) magnitude += v * v;
    magnitude = Math.sqrt(magnitude);

    if (magnitude > 0) {
      for (let i = 0; i < dim; i++) vector[i] /= magnitude;
    }

    return vector;
  }

  static cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dot = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
    }
    return Math.max(0, Math.min(1, dot));
  }

  /**
   * Add a new memory item with intelligence validation
   */
  static addMemory(
    item: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt' | 'accessCount' | 'lastAccessedAt'>
  ): MemoryItem {
    const memories = StorageService.getMemories();
    const now = new Date().toISOString();

    // Check for duplicate / existing memory to update instead of creating duplicates
    const duplicate = memories.find(
      (m) =>
        m.layer === item.layer &&
        m.content.toLowerCase().trim() === item.content.toLowerCase().trim()
    );

    if (duplicate) {
      duplicate.importance = Math.max(duplicate.importance, item.importance);
      duplicate.confidence = Math.max(duplicate.confidence, item.confidence);
      duplicate.updatedAt = now;
      duplicate.lastAccessedAt = now;
      duplicate.accessCount += 1;
      if (item.tags) {
        duplicate.tags = Array.from(new Set([...(duplicate.tags || []), ...item.tags]));
      }
      StorageService.saveMemories(memories);
      return duplicate;
    }

    const newMemory: MemoryItem = {
      ...item,
      id: 'mem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      accessCount: 1,
      lastAccessedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    memories.unshift(newMemory);
    StorageService.saveMemories(memories);
    return newMemory;
  }

  /**
   * Hybrid retrieval combining:
   * 1. Full-text token match (BM25-style term frequency)
   * 2. Vector cosine similarity
   * 3. Importance score weighting
   * 4. Recency decay
   */
  static retrieve(req: MemoryRetrievalQuery): ScoredMemory[] {
    const memories = StorageService.getMemories();
    const queryTokens = req.query.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
    const queryVector = this.generateEmbedding(req.query);
    const now = Date.now();

    const scored: ScoredMemory[] = [];

    for (const mem of memories) {
      // Layer filter
      if (req.layers && !req.layers.includes(mem.layer)) continue;

      // Project filter: match specific project or global memories (undefined projectId)
      if (req.projectId && mem.projectId && mem.projectId !== req.projectId) continue;

      // Minimum importance filter
      if (req.minImportance && mem.importance < req.minImportance) continue;

      const reasons: string[] = [];
      const contentLower = mem.content.toLowerCase();

      // 1. Lexical score
      let lexicalHits = 0;
      for (const tok of queryTokens) {
        if (contentLower.includes(tok)) lexicalHits++;
      }
      const lexicalScore = queryTokens.length > 0 ? lexicalHits / queryTokens.length : 0;
      if (lexicalScore > 0) reasons.push(`Keyword match: ${Math.round(lexicalScore * 100)}%`);

      // 2. Vector semantic score
      const memVector = this.generateEmbedding(mem.content);
      const vectorScore = this.cosineSimilarity(queryVector, memVector);
      if (vectorScore > 0.4) reasons.push(`Semantic match: ${Math.round(vectorScore * 100)}%`);

      // 3. Importance weight (1-10 normalized to 0.1-1.0)
      const importanceWeight = (mem.importance || 5) / 10;

      // 4. Recency decay (half life: 30 days)
      const ageDays = (now - new Date(mem.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
      const recencyScore = Math.exp(-ageDays / 30);

      // Composite score calculation
      const compositeScore =
        lexicalScore * 0.45 +
        vectorScore * 0.35 +
        importanceWeight * 0.15 +
        recencyScore * 0.05;

      if (compositeScore > 0.25 || lexicalScore > 0.4) {
        scored.push({
          memory: mem,
          score: compositeScore,
          reasons,
        });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    const limit = req.limit || 5;
    const results = scored.slice(0, limit);

    // Update access count and lastAccessedAt for retrieved memories
    if (results.length > 0) {
      const retrievedIds = new Set(results.map((r) => r.memory.id));
      for (const m of memories) {
        if (retrievedIds.has(m.id)) {
          m.accessCount += 1;
          m.lastAccessedAt = new Date().toISOString();
        }
      }
      StorageService.saveMemories(memories);
    }

    return results;
  }

  /**
   * Automatically analyze a conversation turn and extract potential long-term memories
   */
  static extractCandidateMemories(userText: string, _assistantReply: string): MemoryItem[] {
    const extracted: MemoryItem[] = [];

    // Heuristics for Semantic Memory: Facts & Preferences
    const preferenceMatch = userText.match(
      /(?:i prefer|i like|i love|i usually|my favorite|i always use|my preferred)\s+([^\.,;!\n]+)/i
    );
    if (preferenceMatch) {
      extracted.push(
        this.addMemory({
          layer: 'semantic',
          category: 'preference',
          content: `User preference: ${preferenceMatch[0].trim()}`,
          importance: 7,
          confidence: 0.85,
          tags: ['preference', 'user_fact'],
        })
      );
    }

    // Technology / Skill Facts
    const techMatch = userText.match(
      /(?:i work with|i'm building in|i use|i develop in|my stack is|i know|i'm learning)\s+([A-Za-z0-9#\+\.\s]+)/i
    );
    if (techMatch && techMatch[1].length < 50) {
      extracted.push(
        this.addMemory({
          layer: 'semantic',
          category: 'technology',
          content: `User works with or is learning: ${techMatch[1].trim()}`,
          importance: 8,
          confidence: 0.9,
          tags: ['skills', 'technology'],
        })
      );
    }

    // Procedural Memory: Instructions & Workflow rules
    const proceduralMatch = userText.match(
      /(?:always remember to|make sure you always|never|from now on|when writing code|format your answers as)\s+([^\.,;!\n]+)/i
    );
    if (proceduralMatch) {
      extracted.push(
        this.addMemory({
          layer: 'procedural',
          category: 'workflow_rule',
          content: `Workflow rule: ${proceduralMatch[0].trim()}`,
          importance: 9,
          confidence: 0.95,
          tags: ['instruction', 'workflow'],
        })
      );
    }

    // Episodic Memory: Meaningful decisions & Milestones
    const episodicMatch = userText.match(
      /(?:we decided to|i decided to|i just finished|i launched|i created|i resolved)\s+([^\.,;!\n]+)/i
    );
    if (episodicMatch) {
      extracted.push(
        this.addMemory({
          layer: 'episodic',
          category: 'decision_or_milestone',
          content: `Event: ${episodicMatch[0].trim()}`,
          importance: 6,
          confidence: 0.8,
          tags: ['milestone', 'decision'],
        })
      );
    }

    return extracted;
  }

  /**
   * Delete a memory item by ID
   */
  static deleteMemory(id: string): void {
    const memories = StorageService.getMemories().filter((m) => m.id !== id);
    StorageService.saveMemories(memories);
  }

  /**
   * Update an existing memory
   */
  static updateMemory(id: string, updates: Partial<MemoryItem>): MemoryItem | null {
    const memories = StorageService.getMemories();
    const index = memories.findIndex((m) => m.id === id);
    if (index === -1) return null;

    memories[index] = {
      ...memories[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    StorageService.saveMemories(memories);
    return memories[index];
  }
}
