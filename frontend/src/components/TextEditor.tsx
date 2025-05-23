import React, { useState, useEffect } from 'react';

interface TextEditorProps {
  onSave: (content: string) => void;
}

const TextEditor: React.FC<TextEditorProps> = ({ onSave }) => {
  const [content, setContent] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled || content.trim() === '') return;
    
    const autoSaveTimer = setTimeout(() => {
      handleSave();
    }, 5000); // Auto-save after 5 seconds of inactivity
    
    return () => clearTimeout(autoSaveTimer);
  }, [content, autoSaveEnabled]);

  const handleSave = async () => {
    if (content.trim() === '') return;
    
    setIsSaving(true);
    
    try {
      // In a real app, you would send the content to your backend here
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      onSave(content);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save content:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter title..."
            className="text-xl font-semibold focus:outline-none w-full"
          />
          <div className="flex items-center space-x-2">
            <label className="flex items-center cursor-pointer">
              <span className="text-sm text-gray-600 mr-2">Auto-save</span>
              <div className="relative">
                <input 
                  type="checkbox" 
                  checked={autoSaveEnabled}
                  onChange={() => setAutoSaveEnabled(!autoSaveEnabled)}
                  className="sr-only" 
                />
                <div className={`block w-10 h-6 rounded-full ${autoSaveEnabled ? 'bg-blue-400' : 'bg-gray-300'}`}></div>
                <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${autoSaveEnabled ? 'transform translate-x-4' : ''}`}></div>
              </div>
            </label>
          </div>
        </div>
        
        <div className="flex items-center text-sm text-gray-500">
          {lastSaved && (
            <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
          )}
        </div>
      </div>
      
      <div className="p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start typing your knowledge here..."
          className="w-full h-64 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
        />
      </div>
      
      <div className="p-4 border-t flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {content.length} characters
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setContent('');
              setTitle('');
            }}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-100"
          >
            Clear
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving || content.trim() === ''}
            className={`px-4 py-1 text-sm text-white rounded-md ${
              isSaving || content.trim() === '' 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextEditor;
