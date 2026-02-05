import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getFlomoApiUrl, setFlomoApiUrl } from '../../lib/models';

interface FlomoApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

export const FlomoApiModal: React.FC<FlomoApiModalProps> = ({
  isOpen,
  onClose,
  isDark
}) => {
  const { t } = useTranslation();
  const [apiUrl, setApiUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      const savedUrl = getFlomoApiUrl();
      setApiUrl(savedUrl || '');
    }
  }, [isOpen]);

  const handleSave = () => {
    if (apiUrl.trim()) {
      setFlomoApiUrl(apiUrl.trim());
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 z-50 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div
        className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md rounded-lg shadow-xl z-50 ${
          isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
        }`}
      >
        <div className="flex flex-col">
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <h2 className="text-lg font-semibold">{t('settings.flomoApiTitle')}</h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-full transition-colors ${
                isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {t('settings.flomoApiLabel')}
              </label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder={t('settings.flomoApiPlaceholder')}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              <p className={`mt-2 text-xs ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {t('settings.flomoApiHint')}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className={`flex justify-end gap-2 p-4 border-t ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isDark
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={!apiUrl.trim()}
              className={`px-4 py-2 rounded-lg transition-colors ${
                apiUrl.trim()
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : isDark
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {t('common.save')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
