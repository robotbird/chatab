import React, { useState, useEffect } from 'react';
import { X, Palette, Grid3X3, Edit2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Switch } from './switch';
import { WallpaperSection } from './WallpaperSection';
import { FlomoApiModal } from './FlomoApiModal';
import { originalModels, getAppToggleStates, setAppToggleStates, AppToggleState, getFlomoApiUrl } from '../../lib/models';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  onThemeChange: (theme: 'light' | 'dark' | 'auto') => void;
  onAppToggleChange?: () => void; // 新增：当应用开关状态改变时的回调
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  isDark,
  onThemeChange,
  onAppToggleChange
}) => {
  const { t } = useTranslation();
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'auto'>('auto');
  const [appToggleStates, setAppToggleStatesLocal] = useState<AppToggleState>({});
  const [isFlomoApiModalOpen, setIsFlomoApiModalOpen] = useState(false);

  const themes = [
    { id: 'light', name: t('settings.light'), icon: '☀️' },
    { id: 'dark', name: t('settings.dark'), icon: '🌙' },
    { id: 'auto', name: t('settings.auto'), icon: '🔄' }
  ];

  useEffect(() => {
    // Load saved settings from localStorage
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'auto';
    
    if (savedTheme) setSelectedTheme(savedTheme);
    
    // 加载应用开关状态
    setAppToggleStatesLocal(getAppToggleStates());
  }, []);

  const handleThemeChange = (theme: 'light' | 'dark' | 'auto') => {
    setSelectedTheme(theme);
    localStorage.setItem('theme', theme);
    onThemeChange(theme);
  };

  const handleAppToggle = (appId: string) => {
    const isCurrentlyEnabled = appToggleStates[appId] ?? (appId === 'flomo' ? false : true);
    const willBeEnabled = !isCurrentlyEnabled;
    
    // 如果是 flomo 且要开启，检查是否有 API URL
    if (appId === 'flomo' && willBeEnabled) {
      const apiUrl = getFlomoApiUrl();
      if (!apiUrl || !apiUrl.trim()) {
        // 没有 API URL，打开配置 modal
        setIsFlomoApiModalOpen(true);
        return; // 不切换开关状态，等待用户配置
      }
      // 如果有 API URL，直接开启，不需要弹出 modal
    }
    
    const newStates = {
      ...appToggleStates,
      [appId]: willBeEnabled
    };
    setAppToggleStatesLocal(newStates);
    setAppToggleStates(newStates);
    
    // 通知父组件状态改变
    onAppToggleChange?.();
  };
  
  const handleFlomoApiEdit = () => {
    setIsFlomoApiModalOpen(true);
  };
  
  const handleFlomoApiModalClose = () => {
    setIsFlomoApiModalOpen(false);
    // 检查是否有 API URL，如果有则开启 flomo（如果之前是关闭状态）
    const apiUrl = getFlomoApiUrl();
    if (apiUrl && apiUrl.trim() && !appToggleStates.flomo) {
      const newStates = {
        ...appToggleStates,
        flomo: true
      };
      setAppToggleStatesLocal(newStates);
      setAppToggleStates(newStates);
      onAppToggleChange?.();
    }
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
      
      {/* Settings Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-80 transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} shadow-xl`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b ${
            isDark ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <h2 className="text-lg font-semibold">{t('common.settings')}</h2>
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
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Appearance Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Palette className="w-4 h-4" />
                <h3 className="text-sm font-medium">{t('settings.appearance')}</h3>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => handleThemeChange(theme.id as 'light' | 'dark' | 'auto')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      selectedTheme === theme.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : isDark
                        ? 'border-gray-600 hover:border-gray-500'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-lg mb-1">{theme.icon}</div>
                    <div className="text-xs">{theme.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Wallpaper Section */}
            <WallpaperSection isDark={isDark} />

            {/* Applications Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Grid3X3 className="w-4 h-4" />
                <h3 className="text-sm font-medium">{t('settings.applications')}</h3>
              </div>
              <div className="space-y-1">
                {originalModels.map((model) => (
                  <div
                    key={model.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={model.icon}
                        alt={model.name}
                        className="w-6 h-6 rounded"
                      />
                      <span className="text-sm font-medium">{model.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {model.id === 'flomo' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFlomoApiEdit();
                          }}
                          className={`p-1 rounded transition-colors opacity-0 group-hover:opacity-100 ${
                            isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' : 'hover:bg-gray-200 text-gray-400 hover:text-gray-600'
                          }`}
                          title={t('settings.editFlomoApi')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      <Switch
                        checked={appToggleStates[model.id] ?? (model.id === 'flomo' ? false : true)}
                        onChange={() => handleAppToggle(model.id)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Flomo API Modal */}
      <FlomoApiModal
        isOpen={isFlomoApiModalOpen}
        onClose={handleFlomoApiModalClose}
        isDark={isDark}
      />
    </>
  );
}; 