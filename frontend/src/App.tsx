import React, { useState } from 'react';
import './App.css';
import FileUpload from './components/FileUpload';
import TextEditor from './components/TextEditor';
import VideoRecorder from './components/VideoRecorder';

function App() {
  const [activeTab, setActiveTab] = useState<'files' | 'text' | 'video' | 'search'>('files');
  const [searchQuery, setSearchQuery] = useState('');

  const handleFileUpload = (files: File[]) => {
    console.log('Files to upload:', files);
    // In a real app, you would send these files to your backend
  };

  const handleTextSave = (content: string) => {
    console.log('Text content to save:', content);
    // In a real app, you would send this content to your backend
  };

  const handleVideoSave = (videoBlob: Blob) => {
    console.log('Video to save:', videoBlob);
    // In a real app, you would send this video to your backend
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
    // In a real app, you would query your backend API
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Knowledge Base System</h1>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('files')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'files'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              File Upload
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'text'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Text Input
            </button>
            <button
              onClick={() => setActiveTab('video')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'video'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Video Recording
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'search'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Search
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="mt-6">
          {activeTab === 'files' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Upload Files to Knowledge Base</h2>
              <FileUpload onUpload={handleFileUpload} />
            </div>
          )}
          
          {activeTab === 'text' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Add Text to Knowledge Base</h2>
              <TextEditor onSave={handleTextSave} />
            </div>
          )}
          
          {activeTab === 'video' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Record Video for Knowledge Base</h2>
              <VideoRecorder onRecordingComplete={handleVideoSave} />
            </div>
          )}
          
          {activeTab === 'search' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Search Knowledge Base</h2>
              <div className="max-w-3xl mx-auto">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search your knowledge base..."
                    className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Search
                  </button>
                </form>
                
                <div className="mt-8">
                  {/* Search results would go here */}
                  <p className="text-gray-500 text-center">Enter a query to search your knowledge base</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
