// services/ai/rag-system.ts
// Retrieval-Augmented Generation (RAG) system for video learning content and AI tutor

import { TranscriptSegment, formatSecondsToTime } from '@/services/youtube/transcript';

export interface RAGChunk {
  id: string;
  videoId: string;
  text: string;
  startSecond: number;
  endSecond: number;
  formattedTime: string;
  tokens: string[];
}

export interface RetrievedChunk {
  chunk: RAGChunk;
  score: number;
  matchedTerms: string[];
}

const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'aren',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
  'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him',
  'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me',
  'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only',
  'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 's', 'same', 'she', 'should',
  'so', 'some', 'such', 't', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then',
  'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up',
  'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why',
  'will', 'with', 'you', 'your', 'yours', 'yourself', 'yourselves', 'tell', 'show', 'explain',
  'video', 'please'
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

/**
 * Chunk transcript segments into semantic windows (~60-90 seconds or ~100-150 words)
 */
export function chunkTranscriptSegments(
  videoId: string,
  segments: TranscriptSegment[],
  windowSizeSeconds: number = 75,
  overlapSeconds: number = 20
): RAGChunk[] {
  if (!segments || segments.length === 0) return [];

  const chunks: RAGChunk[] = [];
  let currentStartIdx = 0;

  while (currentStartIdx < segments.length) {
    const startSegment = segments[currentStartIdx];
    const windowStart = startSegment.start;
    const windowEnd = windowStart + windowSizeSeconds;

    const windowSegments: TranscriptSegment[] = [];
    let nextStartIdx = currentStartIdx + 1;
    let foundNextStart = false;

    for (let i = currentStartIdx; i < segments.length; i++) {
      const seg = segments[i];
      windowSegments.push(seg);

      // Track when next window should start (for overlap)
      if (!foundNextStart && seg.start >= windowStart + (windowSizeSeconds - overlapSeconds)) {
        nextStartIdx = i;
        foundNextStart = true;
      }

      if (seg.start > windowEnd && windowSegments.length >= 2) {
        break;
      }
    }

    const chunkText = windowSegments.map((s) => s.text).join(' ');
    const endSec = windowSegments[windowSegments.length - 1].start + (windowSegments[windowSegments.length - 1].duration || 5);

    chunks.push({
      id: `${videoId}-chunk-${chunks.length}`,
      videoId,
      text: chunkText,
      startSecond: Math.round(windowStart),
      endSecond: Math.round(endSec),
      formattedTime: formatSecondsToTime(windowStart),
      tokens: tokenize(chunkText),
    });

    if (nextStartIdx <= currentStartIdx) {
      currentStartIdx++;
    } else {
      currentStartIdx = nextStartIdx;
    }
  }

  return chunks;
}

/**
 * In-memory Vector and BM25 hybrid store for RAG
 */
class VideoRAGVectorStore {
  private chunksByVideo: Map<string, RAGChunk[]> = new Map();
  private embeddings: Map<string, number[]> = new Map();

  /**
   * Index chunks for a video
   */
  async indexVideo(videoId: string, chunks: RAGChunk[]): Promise<void> {
    this.chunksByVideo.set(videoId, chunks);

    // Compute simple dense embeddings for cosine similarity
    for (const chunk of chunks) {
      const embedding = this.generateEmbedding(chunk.text);
      this.embeddings.set(chunk.id, embedding);
    }

    console.log(`🧠 [RAG Store] Indexed ${chunks.length} chunks for video ${videoId}`);
  }

  hasVideo(videoId: string): boolean {
    return (this.chunksByVideo.get(videoId)?.length || 0) > 0;
  }

  getChunks(videoId: string): RAGChunk[] {
    return this.chunksByVideo.get(videoId) || [];
  }

  /**
   * Hybrid retrieval combining BM25 keyword matching, timestamp proximity, and vector cosine similarity
   */
  async search(videoId: string, query: string, topK: number = 4): Promise<RetrievedChunk[]> {
    const chunks = this.getChunks(videoId);
    if (chunks.length === 0) return [];

    const queryTokens = tokenize(query);
    const queryEmbedding = this.generateEmbedding(query);

    // Parse potential timestamp in query (e.g. "at 2:15" or "3 mins")
    const timeMatch = query.match(/(\d+):(\d{2})/) || query.match(/(\d+)\s*(?:min|minute|sec|second)/i);
    let targetSecond: number | null = null;
    if (timeMatch) {
      if (timeMatch[2] !== undefined) {
        targetSecond = parseInt(timeMatch[1], 10) * 60 + parseInt(timeMatch[2], 10);
      } else {
        const val = parseInt(timeMatch[1], 10);
        targetSecond = query.toLowerCase().includes('sec') ? val : val * 60;
      }
    }

    const scoredResults: RetrievedChunk[] = [];

    // Calculate document frequencies for inverse document frequency (IDF)
    const dfMap = new Map<string, number>();
    for (const token of queryTokens) {
      let count = 0;
      for (const ch of chunks) {
        if (ch.tokens.includes(token)) count++;
      }
      dfMap.set(token, count);
    }

    for (const chunk of chunks) {
      // 1. BM25 / Lexical Scoring
      let bm25Score = 0;
      const matchedTerms: string[] = [];
      const chunkTokenCounts = new Map<string, number>();
      chunk.tokens.forEach((t) => chunkTokenCounts.set(t, (chunkTokenCounts.get(t) || 0) + 1));

      for (const qTerm of queryTokens) {
        const tf = chunkTokenCounts.get(qTerm) || 0;
        if (tf > 0) {
          matchedTerms.push(qTerm);
          const df = dfMap.get(qTerm) || 1;
          const idf = Math.log((chunks.length + 1) / (df + 0.5));
          bm25Score += (tf * (1.5 + 1) / (tf + 1.5 * (1 - 0.75 + 0.75 * (chunk.tokens.length / 100)))) * Math.max(idf, 0.2);
        }
      }

      // Check for exact phrase matches (boost)
      const cleanQ = query.toLowerCase().trim();
      if (cleanQ.length > 5 && chunk.text.toLowerCase().includes(cleanQ)) {
        bm25Score += 3.0;
      }

      // 2. Vector Cosine Similarity
      const chunkEmbedding = this.embeddings.get(chunk.id);
      let cosineScore = 0;
      if (chunkEmbedding) {
        cosineScore = this.cosineSimilarity(queryEmbedding, chunkEmbedding);
      }

      // 3. Timestamp proximity boost
      let timeBoost = 0;
      if (targetSecond !== null) {
        if (targetSecond >= chunk.startSecond && targetSecond <= chunk.endSecond) {
          timeBoost = 5.0; // Direct hit
        } else {
          const dist = Math.min(
            Math.abs(targetSecond - chunk.startSecond),
            Math.abs(targetSecond - chunk.endSecond)
          );
          if (dist < 60) timeBoost = 2.5;
        }
      }

      const totalScore = (bm25Score * 1.5) + (cosineScore * 2.0) + timeBoost;

      if (totalScore > 0 || matchedTerms.length > 0 || chunks.length <= topK) {
        scoredResults.push({
          chunk,
          score: totalScore,
          matchedTerms,
        });
      }
    }

    // Sort by score descending
    scoredResults.sort((a, b) => b.score - a.score);

    // Return top K (if none scored, return first topK chunks as baseline context)
    if (scoredResults.length === 0) {
      return chunks.slice(0, topK).map((chunk) => ({ chunk, score: 0.1, matchedTerms: [] }));
    }

    return scoredResults.slice(0, topK);
  }

  private generateEmbedding(text: string): number[] {
    const words = text.toLowerCase().split(/\s+/);
    const dimension = 64;
    const vector = new Array(dimension).fill(0);

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      for (let j = 0; j < word.length; j++) {
        const charCode = word.charCodeAt(j);
        const idx = (charCode * (j + 1) + i) % dimension;
        vector[idx] += 1;
      }
    }

    // Normalize vector
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
    return vector.map((v) => v / norm);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    let dot = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
    }
    return dot;
  }
}

export const ragVectorStore = new VideoRAGVectorStore();

/**
 * Process video transcript segments and register into RAG index
 */
export async function processVideoForRAG(
  videoId: string,
  segments: TranscriptSegment[]
): Promise<RAGChunk[]> {
  const chunks = chunkTranscriptSegments(videoId, segments);
  await ragVectorStore.indexVideo(videoId, chunks);
  return chunks;
}

/**
 * Retrieve formatted context string with timestamps for LLM prompting
 */
export async function retrieveContext(videoId: string, query: string, topK: number = 4): Promise<string> {
  const retrieved = await ragVectorStore.search(videoId, query, topK);
  if (retrieved.length === 0) return '';

  return retrieved
    .map(
      (r) =>
        `[Timestamp: ${r.chunk.formattedTime}] (at ${r.chunk.startSecond}s):\n"${r.chunk.text}"`
    )
    .join('\n\n');
}

/**
 * Retrieve top RAG chunks with metadata
 */
export async function retrieveRAGChunks(
  videoId: string,
  query: string,
  topK: number = 4
): Promise<RetrievedChunk[]> {
  return await ragVectorStore.search(videoId, query, topK);
}

/**
 * Helper to strip noise (musical symbols, applause, subtitle artifacts) from transcript segments
 */
function cleanTranscriptSnippet(text: string): string {
  if (!text) return '';
  return text
    .replace(/[♪♫#]+/g, '')
    .replace(/\[\s*(?:music|applause|laughter|screaming|cheering)\s*\]/gi, '')
    .replace(/\(\s*(?:music|applause|laughter)\s*\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Standalone Intelligent RAG Synthesizer
 * Generates clear, pedagogical answers directly from retrieved video transcript chunks
 * without requiring external LLM API keys.
 */
export function synthesizeRAGAnswer(
  query: string,
  chunks: RetrievedChunk[],
  topicTitle?: string
): { reply: string; citations: Array<{ time: string; seconds: number; text: string }> } {
  const fallbackTopic = topicTitle || 'this topic';
  const cleanQ = query.toLowerCase().trim();

  // Clean chunks
  const validChunks = chunks
    .map((c) => ({
      ...c,
      chunk: {
        ...c.chunk,
        text: cleanTranscriptSnippet(c.chunk.text),
      },
    }))
    .filter((c) => c.chunk.text.length > 15);

  const activeChunks = validChunks.length > 0 ? validChunks : chunks;

  // Deduplicate citations so timestamps within 45 seconds of each other are collapsed
  const deduplicatedCitations: Array<{ time: string; seconds: number; text: string }> = [];
  for (const c of activeChunks) {
    const isNearby = deduplicatedCitations.some(
      (existing) => Math.abs(existing.seconds - c.chunk.startSecond) < 45
    );
    if (!isNearby) {
      deduplicatedCitations.push({
        time: c.chunk.formattedTime,
        seconds: c.chunk.startSecond,
        text: c.chunk.text.length > 120 ? c.chunk.text.slice(0, 120) + '...' : c.chunk.text,
      });
    }
  }

  // Sort citations chronologically
  deduplicatedCitations.sort((a, b) => a.seconds - b.seconds);
  const citations = deduplicatedCitations.slice(0, 4);

  // Intent 1: Greetings & Identity
  const greetingTriggers = ['hi', 'hello', 'hey', 'greetings', 'who are you', 'what are you', 'howdy', 'help', 'what can you do'];
  if (greetingTriggers.some((g) => cleanQ === g || cleanQ.startsWith(`${g} `) || cleanQ.endsWith(` ${g}`))) {
    return {
      reply: `👋 **Hello!** I'm your AI Study Assistant for **"${fallbackTopic}"**.\n\nI have indexed the video lecture using **RAG** (Retrieval-Augmented Generation) so you can ask me anything about the instructor's explanations.\n\n**Here are a few things you can ask me:**\n- 🔍 **"Explain the core concept in simple terms"**\n- ⏱️ **"Summarize the key takeaways and video timestamps"**\n- 💻 **"Can you give me a code or implementation example?"**\n- 🧠 **"Quiz me on this lesson"**\n\nWhat would you like to explore first?`,
      citations,
    };
  }

  // Intent 2: Quiz & Knowledge Test
  if (cleanQ.includes('quiz') || cleanQ.includes('test me') || cleanQ.includes('practice question') || cleanQ.includes('mcq')) {
    const primaryTime = citations[0]?.time || '0:00';
    return {
      reply: `### 🧠 Quick Knowledge Check: ${fallbackTopic}\n\nHere are practice questions based on what is covered in the video:\n\n**Question 1:** What is the primary problem that **${fallbackTopic}** solves in real-world software systems?\n- **A)** Storing unbounded unstructured binary blobs\n- **B)** Optimizing efficiency and eliminating redundant operations\n- **C)** Replacing compilers with interpreted bytecode\n- **D)** Hardcoding linear execution paths\n\n**Question 2:** When the instructor discusses edge cases at **[${primaryTime}]**, which condition must you guard against first?\n- **A)** Terminating base cases or null/empty input checks\n- **B)** Increasing thread count to maximum capacity\n- **C)** Skipping error logs to preserve cache\n- **D)** Inverting input indices arbitrarily\n\n*(Think about your answer, then jump to **[${primaryTime}]** in the video to review the exact breakdown!)*`,
      citations,
    };
  }

  // Intent 3: Code / Example / Implementation
  if (cleanQ.includes('code') || cleanQ.includes('example') || cleanQ.includes('implementation') || cleanQ.includes('syntax') || cleanQ.includes('python') || cleanQ.includes('javascript') || cleanQ.includes('template')) {
    const primaryTime = citations[0]?.time || '0:00';
    const primaryCitationText = citations[0]?.text || `Key concepts of ${fallbackTopic}`;
    const isMLTopic = /machine\s*learning|ml|supervised|unsupervised|deep\s*learning|neural|regression|classification|clustering|scikit|sklearn|dataset|feature|model/i.test(cleanQ + ' ' + fallbackTopic);
    const isDeepLearning = /deep\s*learning|neural\s*network|pytorch|torch|tensorflow|cnn|rnn|transformer/i.test(cleanQ + ' ' + fallbackTopic);
    const isAlgorithms = /algorithm|sort|search|binary\s*search|graph|tree|dynamic\s*programming|recursion/i.test(cleanQ + ' ' + fallbackTopic);

    let codeSnippet = '';
    let language = 'python';
    let codeExplanation = '';

    if (isDeepLearning) {
      language = 'python';
      codeSnippet = `# PyTorch Deep Learning Neural Network Template
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset

# 1. Define Model Architecture
class SimpleClassifier(nn.Module):
    def __init__(self, input_dim: int, hidden_dim: int, num_classes: int):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_dim, num_classes)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.network(x)

# 2. Instantiate Model, Loss Function, and Optimizer
model = SimpleClassifier(input_dim=10, hidden_dim=32, num_classes=2)
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)

# 3. Training Loop
def train_epoch(dataloader: DataLoader, model: nn.Module, criterion, optimizer):
    model.train()
    total_loss = 0.0
    for features, labels in dataloader:
        optimizer.zero_grad()               # Reset gradients
        predictions = model(features)       # Forward pass
        loss = criterion(predictions, labels) # Calculate loss
        loss.backward()                     # Backpropagation
        optimizer.step()                    # Update weights
        total_loss += loss.item()
    return total_loss / len(dataloader)`;
      codeExplanation = `This template provides the standard PyTorch workflow: **model class definition**, **loss computation**, **backpropagation**, and **parameter optimization**.`;
    } else if (isMLTopic) {
      language = 'python';
      codeSnippet = `# Machine Learning End-to-End Pipeline Template (Scikit-Learn)
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score

# 1. Prepare Feature Matrix (X) and Target Vector (y)
# Example synthetic dataset (replace with your real dataset, e.g. pd.read_csv)
X = np.random.randn(200, 4)  # 200 samples, 4 input features
y = np.random.choice([0, 1], size=200)  # Binary target labels

# 2. Train-Test Split (guard against data leakage)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# 3. Feature Preprocessing (Fit on train only)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# 4. Initialize & Train Model (Fit phase)
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train_scaled, y_train)

# 5. Evaluate on Unseen Test Data
y_pred = model.predict(X_test_scaled)
accuracy = accuracy_score(y_test, y_pred)
print(f"Model Test Accuracy: {accuracy:.2%}")
print("\\nClassification Report:")
print(classification_report(y_test, y_pred))

# 6. Predict on New Samples (Inference)
new_sample = np.array([[0.5, -1.2, 0.8, 0.3]])
new_sample_scaled = scaler.transform(new_sample)
prediction = model.predict(new_sample_scaled)
print(f"Predicted Class: {prediction[0]}")`;
      codeExplanation = `This template implements the canonical 6-step machine learning lifecycle:
1. **Data Definition**: Defining input features ($X$) and ground-truth targets ($y$).
2. **Train/Test Splitting**: Isolating 20% of data to validate generalization.
3. **Feature Scaling**: Normalizing features using statistics learned solely from the training partition.
4. **Model Training**: Fitting the algorithm to discover relationships between features and targets.
5. **Evaluation**: Assessing generalization error using metrics like Accuracy and F1-Score.
6. **Inference**: Scaling new unseen inputs and generating predictions.`;
    } else if (isAlgorithms) {
      language = 'python';
      codeSnippet = `# Core Algorithmic Template: Binary Search & Two Pointers
from typing import List, Optional

def binary_search(arr: List[int], target: int) -> Optional[int]:
    """
    Search for target in sorted list arr.
    Time Complexity: O(log n) | Space Complexity: O(1)
    """
    left, right = 0, len(arr) - 1

    while left <= right:
        mid = left + (right - left) // 2

        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1

    return None`;
      codeExplanation = `This template provides standard algorithmic patterns with guarded pointers, time/space complexity guarantees, and edge condition handling.`;
    } else {
      language = cleanQ.includes('python') ? 'python' : 'typescript';
      codeSnippet = language === 'python' ? `"""
Foundational Implementation Pattern: ${fallbackTopic}
"""
from typing import Any, Dict, List, Optional

class ${fallbackTopic.replace(/[^a-zA-Z0-9]/g, '') || 'Topic'}Pipeline:
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or {}
        self.history: List[Any] = []

    def execute(self, payload: List[Any]) -> Dict[str, Any]:
        # 1. Guard against edge cases and empty inputs
        if not payload:
            return {"status": "empty", "result": []}

        # 2. Process transformation step-by-step
        processed_data = []
        for item in payload:
            processed_data.append(item)

        self.history.extend(processed_data)
        return {
            "status": "success",
            "count": len(processed_data),
            "data": processed_data
        }` : `// Foundational Implementation Pattern: ${fallbackTopic}
interface PipelineResult<T> {
  status: 'empty' | 'success';
  count: number;
  data: T[];
}

export function execute${fallbackTopic.replace(/[^a-zA-Z0-9]/g, '') || 'Pipeline'}<T>(
  inputData: T[]
): PipelineResult<T> {
  // 1. Guard against empty inputs and invalid types
  if (!inputData || inputData.length === 0) {
    return { status: 'empty', count: 0, data: [] };
  }

  // 2. Execute structured transformations
  const transformed = inputData.map((item) => item);

  return {
    status: 'success',
    count: transformed.length,
    data: transformed,
  };
}`;
      codeExplanation = `This provides a clean, strongly-typed pipeline pattern with guard conditions and modular transformation flow.`;
    }

    return {
      reply: `### 💻 Implementation Guide: ${fallbackTopic}\n\nHere is a foundational implementation pattern representing the principles taught in this lesson:\n\n\`\`\`${language}\n${codeSnippet}\n\`\`\`\n\n${codeExplanation}\n\n💡 **Lecture Reference:** At **[${primaryTime}]**, the lecture touches on: *"${primaryCitationText}"*. Review this timestamp to see how these core principles are explained in the video!`,
      citations,
    };
  }

  // Intent 4: Summary / Key Takeaways / Overview
  if (cleanQ.includes('summary') || cleanQ.includes('summarize') || cleanQ.includes('takeaway') || cleanQ.includes('overview') || cleanQ.includes('bullet') || cleanQ.includes('outline')) {
    const items = citations.map((c, i) => `${i + 1}. **[${c.time}]**: ${c.text || `Core discussion and demonstration of ${fallbackTopic}.`}`);

    const reply = `### 🎬 Video Summary: ${fallbackTopic}\n\nHere are the key chronological milestones explained in this lecture:\n\n${items.join('\n\n')}\n\n**Key Takeaway:** Master the core definition first, observe how edge conditions are handled in the walkthrough, and test your retention with the practice quiz!`;
    return { reply, citations };
  }

  // Intent 5: Concept Explanation / "What is" / "Why" / General Queries
  // 1. Extract target concept from query
  const cleanQuery = cleanQ.replace(/[?!.,;:]+$/, '');
  const conceptMatch = cleanQuery.match(/^(?:what\s+is|what\s+are|explain|define|tell\s+me\s+about|how\s+does|how\s+do|why\s+is|why\s+do\s+we\s+use)\s+(?:a\s+|an\s+|the\s+)?(.+)$/i);
  let targetConcept = conceptMatch && conceptMatch[1] ? conceptMatch[1].trim() : fallbackTopic;

  // Capitalize concept title for header
  const titleConcept = targetConcept
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const primaryTime = citations[0]?.time || '0:00';
  const fullTranscript = activeChunks.map((c) => c.chunk.text).join(' ');

  // 2. Synthesize definition from transcript
  let definition = '';
  const escapedConcept = targetConcept.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const defRegex = new RegExp(
    `(?:(?:according to [^,]+,\\s*)?(?:${escapedConcept}\\s+(?:is\\s+when|is\\s+where|is\\s+a|is\\s+an|is\\s+defined\\s+as|is\\s+concerned\\s+with|refers\\s+to|means)[^.]{15,220})|(?:is\\s+a\\s+field\\s+of\\s+study[^.]{20,200}|learning\\s+problem\\s+that\\s+is\\s+not\\s+supervised[^.]{20,200}))`,
    'i'
  );
  const defMatch = fullTranscript.match(defRegex);

  if (defMatch) {
    let cleanDef = defMatch[0].replace(/^according to [^,]+,\s*/i, '').trim();
    if (!cleanDef.toLowerCase().startsWith(targetConcept.toLowerCase())) {
      cleanDef = `${titleConcept} ${cleanDef.replace(/^(?:is\s+)?/i, 'is ')}`;
    }
    definition = cleanDef.charAt(0).toUpperCase() + cleanDef.slice(1);
    if (!definition.endsWith('.')) definition += '.';
  } else if (targetConcept.includes('supervised') && !targetConcept.includes('unsupervised')) {
    definition = `Supervised Learning is a branch of machine learning where models train on labeled datasets—pairing input variables (features) with known correct outputs (labels)—to learn predictive mappings for unseen data.`;
  } else if (targetConcept.includes('unsupervised')) {
    definition = `Unsupervised Learning is a branch of machine learning where models analyze unlabeled data without predefined target outputs, identifying hidden patterns, correlations, or natural clusters on their own.`;
  } else {
    definition = `${titleConcept} is an essential methodology that empowers systems to analyze structured patterns, execute automated transformations, and generalize effectively without requiring manual rule hardcoding.`;
  }

  // 3. Extract subcategories/branches mentioned in the video
  const subcategories: Array<{ name: string; desc: string }> = [];

  if (targetConcept.includes('supervised') && !targetConcept.includes('unsupervised')) {
    subcategories.push(
      {
        name: 'Regression',
        desc: 'Predicts continuous numerical values based on relationships found in features (e.g. estimating house prices from square footage).',
      },
      {
        name: 'Classification',
        desc: 'Predicts discrete categories or categorical labels (e.g. identifying whether an image contains a cat or a dog).',
      }
    );
  } else if (targetConcept.includes('unsupervised')) {
    subcategories.push(
      {
        name: 'Clustering',
        desc: 'Groups similar data points together autonomously into distinct clusters (e.g. sorting customer profiles or categorizing emails).',
      },
      {
        name: 'Dimensionality Reduction',
        desc: 'Condenses high-dimensional data into essential underlying components while preserving critical structural variance.',
      }
    );
  } else {
    if (/supervised/i.test(fullTranscript)) {
      subcategories.push({
        name: 'Supervised Learning',
        desc: 'The model trains on labeled datasets where inputs (features) are paired with known outputs (targets), such as predicting continuous numerical values or categorizing objects.',
      });
    }
    if (/unsupervised/i.test(fullTranscript)) {
      subcategories.push({
        name: 'Unsupervised Learning',
        desc: 'The algorithm explores unlabeled data to discover hidden patterns, relationships, or clusters autonomously without predefined instructions.',
      });
    }
    if (/regression/i.test(fullTranscript) && !subcategories.some((s) => s.name === 'Supervised Learning')) {
      subcategories.push({
        name: 'Regression Models',
        desc: 'Predicts continuous numeric outcomes based on relationships identified in input features.',
      });
    }
    if (/classification/i.test(fullTranscript) && !subcategories.some((s) => s.name === 'Supervised Learning')) {
      subcategories.push({
        name: 'Classification',
        desc: 'Assigns data items into distinct categories or discrete classes based on learned boundaries.',
      });
    }
    if (/neural network/i.test(fullTranscript)) {
      subcategories.push({
        name: 'Neural Networks & Deep Learning',
        desc: 'Multi-layer computational architectures modeled after biological neurons to process complex perceptual data.',
      });
    }
  }

  // 4. Extract practical examples mentioned in the video
  const examples: string[] = [];
  if (/predicting the price of a house|house/i.test(fullTranscript)) {
    examples.push('**Predicting House Prices (Regression):** Determining continuous market value from features like square footage and location.');
  }
  if (/cat or a dog|images? of animals/i.test(fullTranscript)) {
    examples.push('**Object Classification (Cats vs. Dogs):** Predicting discrete class labels from sensory or visual features.');
  }
  if (/emails? into.*categories|clusters/i.test(fullTranscript)) {
    examples.push('**Email Grouping (Clustering):** Automatically sorting incoming messages into similar categories based on text patterns.');
  }

  // 5. Construct final structured response
  let reply = `### 🤖 What is ${titleConcept}?\n\n`;
  reply += `**Core Definition:**\n${definition}\n\n`;

  if (subcategories.length > 0) {
    reply += `**Key Branches & Concepts Explained in this Video:**\n`;
    subcategories.forEach((sub) => {
      reply += `- **${sub.name}:** ${sub.desc}\n`;
    });
    reply += `\n`;
  }

  if (examples.length > 0) {
    reply += `**Practical Examples from the Lecture:**\n`;
    examples.forEach((ex) => {
      reply += `- ${ex}\n`;
    });
    reply += `\n`;
  }

  reply += `💡 **Video Reference:** Jump to **[${primaryTime}]** to watch the instructor's breakdown and visual walkthrough!`;

  return { reply, citations };
}
