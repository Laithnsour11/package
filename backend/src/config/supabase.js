const { createClient } = require('@supabase/supabase-js');
const winston = require('winston');

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables: SUPABASE_URL and SUPABASE_ANON_KEY are required');
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false, // We'll handle sessions manually
    },
  }
);

// Test the connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('documents').select('*').limit(1);
    if (error) throw error;
    winston.info('Successfully connected to Supabase');
    return true;
  } catch (error) {
    winston.error('Error connecting to Supabase:', error.message);
    throw error;
  }
};

module.exports = {
  supabase,
  testConnection
};
