// services/ai/rag-system.ts
// RAG (Retrieval-Augmented Generation) system for video content analysis

export interface TextChunk {
  id: string;
  text: string;
  metadata: {
    videoId: string;
    timestamp?: number;
    index: number;
  };
}

export interface RetrievedChunk {
  chunk: TextChunk;
  score: number;
}

/**
 * Simple text chunking for RAG
 * Splits text into smaller chunks for better retrieval
 */
export function chunkText(text: string, chunkSize: number = 500, overlap: number = 50): TextChunk[] {
  const chunks: TextChunk[] = [];
  const words = text.split(/\s+/);
  
  for (let i = 0; i < words.length; i += (chunkSize - overlap)) {
    const chunkWords = words.slice(i, i + chunkSize);
    const chunkText = chunkWords.join(' ');
    
    if (chunkText.length > 10) { // Skip very small chunks
      chunks.push({
        id: `chunk-${i}`,
        text: chunkText,
        metadata: {
          videoId: '',
          index: Math.floor(i / (chunkSize - overlap)),
        },
      });
    }
  }
  
  return chunks;
}

/**
 * Simple vector store using in-memory storage
 * In production, you'd use a proper vector database like Pinecone, Weaviate, etc.
 */
class SimpleVectorStore {
  private chunks: Map<string, TextChunk> = new Map();
  private embeddings: Map<string, number[]> = new Map();
  
  /**
   * Add chunks to the vector store
   */
  async addChunks(chunks: TextChunk[]): Promise<void> {
    for (const chunk of chunks) {
      this.chunks.set(chunk.id, chunk);
      // Generate simple embedding (in production, use actual embedding model)
      const embedding = this.generateSimpleEmbedding(chunk.text);
      this.embeddings.set(chunk.id, embedding);
    }
  }
  
  /**
   * Search for relevant chunks based on query
   */
  async search(query: string, topK: number = 3): Promise<RetrievedChunk[]> {
    const queryEmbedding = this.generateSimpleEmbedding(query);
    const results: RetrievedChunk[] = [];
    
    for (const [chunkId, chunkEmbedding] of this.embeddings.entries()) {
      const chunk = this.chunks.get(chunkId);
      if (!chunk) continue;
      
      const score = this.cosineSimilarity(queryEmbedding, chunkEmbedding);
      results.push({ chunk, score });
    }
    
    // Sort by score and return top K
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }
  
  /**
   * Generate simple embedding (word frequency based)
   * In production, use actual embedding model like OpenAI's text-embedding-ada-002
   */
  private generateSimpleEmbedding(text: string): number[] {
    const words = text.toLowerCase().split(/\s+/);
    const wordFreq: Map<string, number> = new Map();
    
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });
    
    // Convert to simple vector (first 100 dimensions)
    const vector: number[] = [];
    const dimension = 100;
    
    for (let i = 0; i < dimension; i++) {
      let sum = 0;
      wordFreq.forEach((freq, word) => {
        const charCode = word.charCodeAt(i % word.length) || 0;
        sum += freq * charCode;
      });
      vector.push(sum / (words.length || 1));
    }
    
    return vector;
  }
  
  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
  
  /**
   * Clear the vector store
   */
  clear(): void {
    this.chunks.clear();
    this.embeddings.clear();
  }
  
  /**
   * Get all chunks for a video
   */
  getChunksByVideoId(videoId: string): TextChunk[] {
    return Array.from(this.chunks.values()).filter(
      chunk => chunk.metadata.videoId === videoId
    );
  }
}

// Singleton instance
const vectorStore = new SimpleVectorStore();

/**
 * Process video transcript and add to RAG system
 */
export async function processVideoForRAG(videoId: string, transcript: string): Promise<void> {
  console.log(`🔄 Processing video ${videoId} for RAG...`);
  
  // Chunk the transcript
  const chunks = chunkText(transcript, 500, 50);
  
  // Add video ID to metadata
  chunks.forEach(chunk => {
    chunk.metadata.videoId = videoId;
  });
  
  // Add to vector store
  await vectorStore.addChunks(chunks);
  
  console.log(`✅ Processed ${chunks.length} chunks for video ${videoId}`);
}

/**
 * Retrieve relevant context for a query
 */
export async function retrieveContext(videoId: string, query: string): Promise<string> {
  const videoChunks = vectorStore.getChunksByVideoId(videoId);
  
  if (videoChunks.length === 0) {
    console.warn(`No chunks found for video ${videoId}`);
    return '';
  }
  
  // Search for relevant chunks
  const results = await vectorStore.search(query, 3);
  
  // Combine retrieved chunks into context
  const context = results
    .map(r => r.chunk.text)
    .join('\n\n');
  
  return context;
}

/**
 * Clear RAG data for a video
 */
export function clearVideoRAG(videoId: string): void {
  const chunks = vectorStore.getChunksByVideoId(videoId);
  chunks.forEach(chunk => {
    vectorStore.chunks.delete(chunk.id);
    vectorStore.embeddings.delete(chunk.id);
  });
}

export { vectorStore };
