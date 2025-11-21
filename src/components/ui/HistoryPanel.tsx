import React from 'react';
import { X, Clock, Trash2 } from 'lucide-react';
import { ModelInfo } from '../../lib/models';

export interface HistoryItem {
  id: string;
  text: string;
  modelIds: string[];
  timestamp: number;
}

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  history: HistoryItem[];
  models: ModelInfo[];
  onSelect: (text: string) => void;
  onClear: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  isOpen,
  onClose,
  isDark,
  history,
  models,
  onSelect,
  onClear
}) => {
  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 z-40 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* History Panel */}
      <div
        className={`fixed top-0 left-0 h-full w-80 transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} shadow-xl`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <h2 className="text-lg font-semibold">历史记录</h2>
            </div>
            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <button
                  onClick={onClear}
                  className={`p-2 rounded-full transition-colors ${
                    isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-red-400' : 'hover:bg-gray-100 text-gray-500 hover:text-red-500'
                  }`}
                  title="清空历史"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={onClose}
                className={`p-2 rounded-full transition-colors ${
                  isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {history.length === 0 ? (
              <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                暂无历史记录
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelect(item.text);
                    onClose();
                  }}
                  className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                    isDark 
                      ? 'bg-gray-700/50 border-gray-700 hover:bg-gray-700' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2 overflow-hidden shrink-0">
                      {item.modelIds.map((modelId) => {
                        const model = models.find(m => m.id === modelId);
                        if (!model) return null;
                        return (
                          <div 
                            key={`${item.id}-${modelId}`}
                            className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-50'
                            }`}
                          >
                            <img 
                              src={model.icon} 
                              alt={model.name} 
                              className="w-4 h-4 object-cover"
                            />
                          </div>
                        );
                      })}
                    </div>
                    <span className={`text-sm font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                      {item.text.length > 20 ? item.text.substring(0, 20) + '...' : item.text}
                    </span>
                  </div>
                  <div className={`mt-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'} flex justify-between`}>
                    <span>{new Date(item.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

