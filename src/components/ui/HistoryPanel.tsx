import React, { useState, useRef, useEffect } from 'react';
import { X, Clock, Trash2, MoreHorizontal, Edit2, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  onRename?: (id: string, newText: string) => void;
  onDelete?: (id: string) => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  isOpen,
  onClose,
  isDark,
  history,
  models,
  onSelect,
  onClear,
  onRename,
  onDelete
}) => {
  const { t } = useTranslation();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  
  // Click outside handler to close menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (activeMenuId) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeMenuId]);

  const handleRenameStart = (item: HistoryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(item.id);
    setEditValue(item.text);
    setActiveMenuId(null);
  };

  const handleRenameSave = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (editValue.trim() && onRename) {
      onRename(id, editValue.trim());
    }
    setEditingId(null);
    setEditValue("");
  };

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(id);
    }
    setActiveMenuId(null);
  };

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
              <h2 className="text-lg font-semibold">{t('common.history')}</h2>
            </div>
            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <button
                  onClick={onClear}
                  className={`p-2 rounded-full transition-colors ${
                    isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-red-400' : 'hover:bg-gray-100 text-gray-500 hover:text-red-500'
                  }`}
                  title={t('history.clearHistory')}
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
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {history.length === 0 ? (
              <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {t('history.noHistory')}
              </div>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (editingId !== item.id) {
                      onSelect(item.text);
                      onClose();
                    }
                  }}
                  className={`p-2 rounded-lg cursor-pointer transition-colors relative group ${
                    isDark 
                      ? 'hover:bg-gray-700' 
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3 justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex -space-x-2 overflow-hidden shrink-0">
                        {item.modelIds.map((modelId) => {
                          const model = models.find(m => m.id === modelId);
                          if (!model) return null;
                          return (
                            <div 
                              key={`${item.id}-${modelId}`}
                              className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                                isDark ? 'bg-gray-800 border-gray-800' : 'bg-white border-white'
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
                      
                      {editingId === item.id ? (
                        <div className="flex items-center gap-1 flex-1" onClick={e => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameSave(item.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            autoFocus
                            className={`w-full px-2 py-1 rounded text-sm ${
                              isDark ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'
                            } border focus:outline-none focus:border-blue-500`}
                          />
                          <button
                            onClick={(e) => handleRenameSave(item.id, e)}
                            className={`p-1 rounded-full ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                          >
                            <Check className="w-4 h-4 text-green-500" />
                          </button>
                        </div>
                      ) : (
                        <span className={`text-sm font-medium truncate flex-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                          {item.text.length > 20 ? item.text.substring(0, 20) + '...' : item.text}
                        </span>
                      )}
                    </div>

                    {editingId !== item.id && (
                      <div className="relative shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === item.id ? null : item.id);
                          }}
                          className={`p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
                            activeMenuId === item.id ? 'opacity-100 bg-gray-200/20' : ''
                          } ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                        >
                          <MoreHorizontal className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                        </button>

                        {/* Dropdown Menu */}
                        {activeMenuId === item.id && (
                          <div 
                            className={`absolute right-0 top-full mt-1 w-32 rounded-md shadow-lg py-1 z-10 ${
                              isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                            }`}
                            onClick={e => e.stopPropagation()}
                          >
                            <button
                              onClick={(e) => handleRenameStart(item, e)}
                              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                                isDark ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                              }`}
                            >
                              <Edit2 className="w-4 h-4" />
                              {t('history.rename')}
                            </button>
                            <button
                              onClick={(e) => handleDeleteClick(item.id, e)}
                              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 text-red-500 ${
                                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                              {t('history.delete')}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
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
