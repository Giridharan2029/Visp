import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryEngine } from '../services/memoryEngine';
import { StorageService } from '../services/storage';

describe('MemoryEngine (Second Brain)', () => {
  beforeEach(() => {
    StorageService.clearAllData();
  });

  it('generates normalized vector embeddings', () => {
    const text = 'learning Rust and developing systems with Tauri';
    const vec = MemoryEngine.generateEmbedding(text);

    expect(vec.length).toBe(64);

    // Calculate magnitude
    let mag = 0;
    for (const v of vec) mag += v * v;
    mag = Math.sqrt(mag);

    // Should be unit vector (~1.0)
    expect(mag).toBeCloseTo(1.0, 3);
  });

  it('calculates cosine similarity correctly', () => {
    const v1 = MemoryEngine.generateEmbedding('Rust systems programming');
    const v2 = MemoryEngine.generateEmbedding('Rust systems software development');
    const v3 = MemoryEngine.generateEmbedding('Cooking delicious Italian pasta recipes');

    const similaritySimilar = MemoryEngine.cosineSimilarity(v1, v2);
    const similarityDifferent = MemoryEngine.cosineSimilarity(v1, v3);

    expect(similaritySimilar).toBeGreaterThan(0.35);
    expect(similaritySimilar).toBeGreaterThan(similarityDifferent);
  });

  it('adds and deduplicates memories', () => {
    const mem1 = MemoryEngine.addMemory({
      layer: 'semantic',
      category: 'preference',
      content: 'User prefers dark mode and minimalist interfaces',
      importance: 7,
      confidence: 0.9,
    });

    expect(mem1.id).toBeDefined();
    expect(StorageService.getMemories().length).toBe(1);

    // Add same content with higher importance
    const mem2 = MemoryEngine.addMemory({
      layer: 'semantic',
      category: 'preference',
      content: 'User prefers dark mode and minimalist interfaces',
      importance: 9,
      confidence: 0.95,
    });

    // Should update existing memory instead of duplicate
    expect(StorageService.getMemories().length).toBe(1);
    expect(mem2.importance).toBe(9);
    expect(mem2.accessCount).toBe(2);
  });

  it('performs hybrid retrieval ranking', () => {
    MemoryEngine.addMemory({
      layer: 'semantic',
      category: 'technology',
      content: 'User is building an AI assistant with Tauri 2 and React',
      importance: 8,
      confidence: 0.9,
    });

    MemoryEngine.addMemory({
      layer: 'episodic',
      category: 'decision',
      content: 'Decided to use SQLite with FTS5 for local second brain persistence',
      importance: 7,
      confidence: 0.85,
    });

    MemoryEngine.addMemory({
      layer: 'semantic',
      category: 'preference',
      content: 'Favorite beverage is Earl Grey tea',
      importance: 3,
      confidence: 0.8,
    });

    const results = MemoryEngine.retrieve({ query: 'Tauri React architecture', limit: 3 });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].memory.content).toContain('Tauri 2');
    expect(results[0].score).toBeGreaterThan(0.3);
  });

  it('extracts candidate memories from conversational text', () => {
    const userText = 'I prefer concise answers without unnecessary fluff, and my favorite language is TypeScript.';
    const extracted = MemoryEngine.extractCandidateMemories(userText, 'Understood.');

    expect(extracted.length).toBeGreaterThan(0);
    expect(extracted.some((m) => m.content.toLowerCase().includes('concise'))).toBe(true);
  });
});

