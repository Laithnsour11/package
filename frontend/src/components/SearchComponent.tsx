import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface SearchResult {
  content: string;
  metadata: {
    title?: string;
    [key: string]: any;
  };
  similarity: number;
  source: string;
}

const SearchComponent = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState('unknown');

  // Check API health on component mount
  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const health = await axios.get('http://localhost:5000/api/health');
        setApiStatus(health.data.status === 'ok' ? 'online' : 'offline');
      } catch (error) {
        setApiStatus('offline');
        console.error('API health check failed:', error);
      }
    };

    checkApiHealth();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('http://localhost:5000/api/search', { query });
      setResults(response.data.results || []);
    } catch (error) {
      setError('Search failed. Please try again later.');
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="mb-4 flex items-center">
        <div className={`w-3 h-3 rounded-full mr-2 ${
          apiStatus === 'online' ? 'bg-green-500' : 
          apiStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
        }`}></div>
        <span className="text-sm text-gray-500">
          API Status: {apiStatus === 'online' ? 'Online' : 
                      apiStatus === 'offline' ? 'Offline' : 'Checking...'}
        </span>
      </div>
      
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your knowledge base..."
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={apiStatus !== 'online'}
          />
          <button
            type="submit"
            className={`px-6 py-3 rounded-lg ${
              apiStatus === 'online' 
                ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            disabled={apiStatus !== 'online' || loading}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>
      
      {error && (
        <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      {results.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Search Results</h3>
          {results.map((result, index) => (
            <div key={index} className="p-4 border rounded-lg bg-white">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium">
                  {result.metadata?.title || `Result ${index + 1}`}
                </h4>
                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {Math.round(result.similarity * 100)}% match
                </span>
              </div>
              <p className="text-gray-700 mb-2">{result.content}</p>
              <div className="text-xs text-gray-500">
                Source: {result.source || 'Unknown'}
              </div>
            </div>
          ))}
        </div>
      ) : (
        !loading && (
          <div className="text-center p-8 text-gray-500">
            {query ? 'No results found. Try a different search term.' : 'Enter a query to search your knowledge base'}
          </div>
        )
      )}
      
      {loading && (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};

export default SearchComponent;
