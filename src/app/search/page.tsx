// Search component
'use client';

import { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../lib/firebase';

interface SearchResult {
  id: string;
  filename: string;
  contentType: string;
  snippet: string;
  uploadedAt: string;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) return;

    setSearching(true);
    setError(null);
    setHasSearched(true);

    try {
      const functions = getFunctions(app);
      const searchDocuments = httpsCallable(functions, 'searchDocuments');

      const response = await searchDocuments({ query: query.trim() });
      const data = response.data as { results: SearchResult[] };

      setResults(data.results);
    } catch (err) {
      console.error('Error searching documents:', err);
      setError('Error searching documents. Please try again.');
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const getFileIcon = (contentType: string) => {
    if (contentType.includes('pdf')) return '📄';
    if (contentType.includes('html')) return '🌐';
    if (contentType.includes('markdown') || contentType.includes('md')) return '📝';
    return '📄';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow-xl rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Search Documents</h1>

            <form onSubmit={handleSearch}>
              <div className="mt-1 flex rounded-md shadow-sm">
                <div className="relative flex items-stretch flex-grow">
                  <input
                    type="text"
                    name="query"
                    id="query"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300"
                    placeholder="Enter search terms..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={searching || !query.trim()}
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </form>

            {error && (
              <div className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded">
                {error}
              </div>
            )}

            {hasSearched && !error && (
              <div className="mt-6">
                <h2 className="text-lg font-medium text-gray-900">
                  {results.length} result{results.length !== 1 ? 's' : ''} found
                </h2>

                {results.length === 0 ? (
                  <div className="mt-4 bg-gray-50 p-4 rounded text-center text-gray-500">
                    No documents matching your search terms were found.
                  </div>
                ) : (
                  <ul className="mt-4 divide-y divide-gray-200">
                    {results.map((result) => (
                      <li key={result.id} className="py-4">
                        <div className="flex items-start">
                          <div className="mr-4 text-2xl">
                            {getFileIcon(result.contentType)}
                          </div>
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {result.filename}
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                              {formatDate(result.uploadedAt)}
                            </p>
                            <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded">
                              {result.snippet}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
