import dotenv from 'dotenv';
dotenv.config();

let embedder;

// Load model only once
async function getEmbedder() {
  if (!embedder) {
    console.log("⏳ Loading embedding model...");
    const { pipeline } = await import('@xenova/transformers');
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      quantized: true,
      auth: process.env.HF_API_KEY || undefined,
    });
    console.log("✅ Model loaded successfully!");
  }
  return embedder;
}

// 🔹 Split text into chunks (~350 words each, safe for 512 tokens)
function chunkText(text, chunkSize = 350) {
  const words = text.split(/\s+/);
  const chunks = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(" "));
  }
  return chunks;
}

async function embedText(text) {
  if (!text || text.trim().length === 0) return [];
  const pipe = await getEmbedder();
  const result = await pipe(text, { pooling: "mean", normalize: true });

  return Array.from(result.data); // Float32Array → Array
}

async function embedLargeText(text) {
  const chunks = chunkText(text);
  if (!chunks.length) return [];

  console.log(`📑 Embedding text in ${chunks.length} chunk(s)...`);

  const embeddings = [];
  for (const chunk of chunks) {
    const emb = await embedText(chunk);
    if (emb.length) embeddings.push(emb);
  }

  if (embeddings.length === 0) return [];

  // 🔹 Average embeddings across all chunks
  const avg = embeddings[0].map((_, i) =>
    embeddings.reduce((sum, emb) => sum + emb[i], 0) / embeddings.length
  );

  return avg;
}

function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const normB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  const sim = normA && normB ? dot / (normA * normB) : 0;
  return isNaN(sim) ? 0 : Math.max(0, Math.min(1, sim)); // clamp [0,1]
}

async function computeSimilarity(textA, textB) {
  try {
    const [embA, embB] = await Promise.all([
      embedLargeText(textA),
      embedLargeText(textB),
    ]);

    if (!embA.length || !embB.length) {
      console.warn("⚠️ One of the embeddings is empty.");
      return 0;
    }

    const score = cosineSimilarity(embA, embB);
    console.log("📊 rawSimilarity:", score);
    return isNaN(score) ? 0 : score;
  } catch (err) {
    console.error("❌ computeSimilarity error:", err.message);
    return 0;
  }
}

// --- ADD THIS FUNCTION FOR YOUR TESTS ---
/**
 * Simple skill match score for arrays of skills.
 * Returns { score: number } where score is 0-100.
 */
function calculateMatchScore(resumeSkills, jobSkills) {
  if (!Array.isArray(resumeSkills) || !Array.isArray(jobSkills) || jobSkills.length === 0) {
    return { score: 0 };
  }
  const matches = jobSkills.filter(skill => resumeSkills.includes(skill)).length;
  const score = Math.round((matches / jobSkills.length) * 100);
  return { score };
}

// ✅ Explicit exports
export { computeSimilarity, embedText, calculateMatchScore };