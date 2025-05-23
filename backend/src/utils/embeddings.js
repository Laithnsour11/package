// Helper function to generate simple embeddings (for demo purposes)
export function generateSimpleEmbedding(text) {
  // This is a simplified version - use a real ML model in production
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(10).fill(0);
  
  words.forEach(word => {
    const hash = word.split('').reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    
    for (let i = 0; i < embedding.length; i++) {
      const value = Math.sin(hash * (i + 1)) * 0.5 + 0.5;
      embedding[i] = (embedding[i] + value) / 2;
    }
  });
  
  return embedding;
}

// Helper function to calculate cosine similarity
export function cosineSimilarity(vec1, vec2) {
  if (!vec1 || !vec2 || vec1.length !== vec2.length) return 0;
  
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;
  
  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    mag1 += vec1[i] * vec1[i];
    mag2 += vec2[i] * vec2[i];
  }
  
  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);
  
  if (mag1 === 0 || mag2 === 0) return 0;
  
  return dotProduct / (mag1 * mag2);
}
