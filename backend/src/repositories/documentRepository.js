const { supabase } = require('../config/supabase');

class DocumentRepository {
  static TABLE_NAME = 'documents';

  static async create(documentData) {
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .insert([documentData])
      .select();

    if (error) throw error;
    return data[0];
  }

  static async findById(id) {
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async findByEmbedding(embedding, threshold = 0.7, limit = 10) {
    // This requires the pgvector extension and a vector index in Supabase
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: limit,
    });

    if (error) throw error;
    return data;
  }

  static async update(id, updates) {
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data[0];
  }

  static async delete(id) {
    const { error } = await supabase
      .from(this.TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  static async list({ limit = 10, offset = 0 } = {}) {
    const { data, error } = await supabase
      .from(this.TABLE_NAME)
      .select('*')
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data;
  }
}

module.exports = DocumentRepository;
