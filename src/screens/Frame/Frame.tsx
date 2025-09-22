import { ChevronDown, Settings } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { IconLink } from "../../components/ui/IconLink";
import { SendIcon } from "../../components/ui/SendIcon";
import { SettingsPanel } from "../../components/ui/SettingsPanel";
import { useToast } from "../../components/ui/Toast";
import { 
  ModelInfo,
  getSortedEnabledModels,
  getRecentModels,
  setRecentModels 
} from "../../lib/models";
import { wallpaperService } from "../../lib/wallpaperService";

declare global {
  interface Window {
    chrome: {
      storage: {
        sync: {
          get: (keys: string[], callback: (result: { [key: string]: string }) => void) => void;
          set: (items: { [key: string]: string }, callback?: () => void) => void;
          remove: (keys: string | string[], callback?: () => void) => void;
        };
        local: {
          get: (keys: string[], callback: (result: { [key: string]: any }) => void) => void;
          set: (items: { [key: string]: any }, callback?: () => void) => void;
          remove: (keys: string | string[], callback?: () => void) => void;
        };
      };
      runtime: {
        onMessage: {
          addListener: (callback: (message: any, sender: any, sendResponse: any) => void) => void;
        };
        sendMessage: (message: any) => void;
      };
    };
  }

  interface DeepSeekPageStatus {
    isActive: boolean;
    pageInfo: any;
    tabId: number | null;
  }
}

export const Frame = (): JSX.Element => {
  // 从 recentModels 中获取最后使用的模型作为初始值，如果没有则默认为 chatgpt
  const getInitialSelectedModel = () => {
    const recent = getRecentModels();
    return recent.length > 0 ? recent[0] : "chatgpt";
  };
  
  const [selectedModel, setSelectedModel] = useState(getInitialSelectedModel());
  const [selectedModels, setSelectedModels] = useState<string[]>([getInitialSelectedModel()]); // 新增：多模型选择状态
  const [inputValue, setInputValue] = useState("");
  const [placeholder, setPlaceholder] = useState("Ask anything");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false); // 新增：发送状态管理
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'auto';
      if (savedTheme === 'dark') return true;
      if (savedTheme === 'light') return false;
      // 如果是'auto'或没有设置，则使用系统偏好
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });
  
  
  // Toast通知
  const { showToast, ToastContainer } = useToast();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // Handle theme changes from settings panel
  const handleThemeChange = (theme: 'light' | 'dark' | 'auto') => {
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(prefersDark);
    } else {
      setIsDark(theme === 'dark');
    }
  };

  // Load theme on component mount and listen for system theme changes
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'auto';
    if (savedTheme) {
      handleThemeChange(savedTheme);
    }

    // Listen for system theme changes when using 'auto' mode
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      const currentTheme = localStorage.getItem('theme');
      if (currentTheme === 'auto') {
        setIsDark(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, []);

  // 注释：移除了默认加载存储的输入内容的逻辑
  // 现在tab页默认加载时不会从storage读取之前的输入数据



  // Update placeholder when model changes
  useEffect(() => {
    setPlaceholder("Ask anything");
  }, [selectedModel]);


  const [models, setModels] = useState<ModelInfo[]>([]);
  // 新增：控制模型下拉菜单 hover 展开
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  // 新增：用于延迟隐藏下拉菜单的定时器
  const hideDropdownTimer = useRef<number | null>(null);

  // 延迟隐藏下拉菜单的处理函数
  const handleModelDropdownMouseEnter = () => {
    if (hideDropdownTimer.current) {
      clearTimeout(hideDropdownTimer.current);
      hideDropdownTimer.current = null;
    }
    setIsModelDropdownOpen(true);
  };
  const handleModelDropdownMouseLeave = () => {
    hideDropdownTimer.current = window.setTimeout(() => {
      setIsModelDropdownOpen(false);
    }, 150);
  };

  // 初始化模型列表和选中模型
  const loadModels = () => {
    const recent = getRecentModels();
    const enabledModels = getSortedEnabledModels(recent);
    
    if (enabledModels.length > 0) {
      setModels(enabledModels);
      
      // 如果当前选中的模型被禁用了，选择第一个启用的模型
      const currentModelEnabled = enabledModels.some(m => m.id === selectedModel);
      if (!currentModelEnabled) {
        const newSelectedModel = enabledModels[0].id;
        setSelectedModel(newSelectedModel);
        setSelectedModels([newSelectedModel]);
      } else {
        // 确保 selectedModels 包含当前选中的模型
        setSelectedModels(prev => {
          if (!prev.includes(selectedModel)) {
            return [selectedModel];
          }
          return prev;
        });
      }
    } else {
      // 如果所有模型都被禁用，显示空列表但保持当前选中状态
      setModels([]);
    }
  };

  // 初始化 recentModels 和 selectedModel
  useEffect(() => {
    loadModels();
  }, []);

  // 初始化壁纸服务
  useEffect(() => {
    const initWallpaper = async () => {
      try {
        await wallpaperService.initialize();
      } catch (error) {
        console.error('Failed to initialize wallpaper service:', error);
      }
    };

    initWallpaper();

    // 设置定期检查壁纸更新（每分钟检查一次）
    const wallpaperInterval = setInterval(async () => {
      try {
        await wallpaperService.autoUpdateWallpaper();
      } catch (error) {
        console.error('Failed to auto update wallpaper:', error);
      }
    }, 60000); // 每分钟检查一次

    return () => {
      clearInterval(wallpaperInterval);
    };
  }, []);
  
  // 处理发送功能
  const handleSend = () => {
    if (!inputValue.trim()) {
      showToast('请输入内容', 'info');
      return;
    }
    
    if (isSending) {
      return; // 如果正在发送中，直接返回
    }
    
    setIsSending(true); // 设置发送状态为true
    
    if (selectedModels.length === 1) {
      // 单模型：直接跳转
      const model = models.find(m => m.id === selectedModels[0]);
      if (model) {
        if (window.chrome?.storage?.local) {
          window.chrome.storage.local.set({ inputValue: inputValue });
        }
        // 延迟一小段时间显示禁用状态，然后跳转
        setTimeout(() => {
          window.location.href = model.url;
        }, 100);
      }
    } else if (selectedModels.length > 1) {
      // 多模型：所有模型都在新标签页打开
      if (window.chrome?.storage?.local) {
        window.chrome.storage.local.set({ inputValue: inputValue });
      }
      
      // 逐个显示 toast 并打开新标签页
      selectedModels.forEach((modelId, index) => {
        const model = models.find(m => m.id === modelId);
        if (model) {
          setTimeout(() => {
            // 显示当前模型的 toast
            showToast(`正在 ${model.name} 中发送问题...`, 'success');
            
            // 延迟一点时间再打开标签页，确保 toast 能显示
            setTimeout(() => {
              window.open(model.url, '_blank');
            }, 200);
          }, index * 600); // 每个模型间隔 600ms
        }
      });
      
      // 在所有模型都打开后设置storage清空逻辑
      const totalDelay = selectedModels.length * 600 + 2000; // 最后一个模型打开后额外等待2秒，确保所有模型都有足够时间读取storage
      
      // 设置多模型storage清空标记
      if (window.chrome?.storage?.local) {
        const clearTime = Date.now() + 60000; // 1分钟后清空
        window.chrome.storage.local.set({ 
          multiModelClearTime: clearTime,
          multiModelCount: selectedModels.length,
          multiModelProcessed: 0
        });
      }
      
      setTimeout(() => {
        setInputValue(''); // 清空输入框
        setIsSending(false); // 重置发送状态
      }, totalDelay);
    }
  };
  
  // Update input without char limit check
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setInputValue(newText);
    // Auto-adjust height
    e.target.style.height = '40px'; // Reset height
    e.target.style.height = `${Math.min(240, e.target.scrollHeight)}px`; // Set new height with max limit (doubled from 120 to 240)
    // 输入变化时实时写入 storage
    if (window.chrome?.storage?.local) {
      window.chrome.storage.local.set({ inputValue: newText });
    }
  };

  // Auto-adjust height on component mount/update
  useEffect(() => {
    const textarea = document.querySelector('textarea');
    if (textarea) {
      textarea.style.height = '40px'; // Reset height
      textarea.style.height = `${Math.min(240, textarea.scrollHeight)}px`; // Doubled max height from 120 to 240
    }
  }, [inputValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 多模型选择切换处理函数
  const handleMultiModelToggle = (modelId: string) => {
    setSelectedModels(prev => {
      const isCurrentlySelected = prev.includes(modelId);
      let newSelected;
      
      if (isCurrentlySelected) {
        // 如果已选中，则取消选择（但至少保留一个）
        if (prev.length > 1) {
          newSelected = prev.filter(id => id !== modelId);
        } else {
          newSelected = prev; // 不允许全部取消选择
        }
      } else {
        // 如果未选中，则添加到选中列表
        newSelected = [...prev, modelId];
      }
      
      // 更新主要选中模型为列表中的第一个
      if (newSelected.length > 0) {
        setSelectedModel(newSelected[0]);
        // 更新 recent models
        const newRecent = [newSelected[0], ...models.filter(m => !newSelected.includes(m.id)).map(m => m.id)];
        setRecentModels(newRecent);
      }
      
      return newSelected;
    });
  };

  // 当应用开关状态改变时重新加载模型列表
  const handleAppToggleChange = () => {
    loadModels();
  };

  return (
    <div className={`transition-colors duration-200 bg-transparent flex flex-col items-center justify-center w-full min-h-screen relative`}>
      {/* Settings Button - positioned relative to the entire page */}
      <div className="absolute top-[30px] right-[30px] flex gap-2 z-10">
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 rounded-full bg-gray-200/30 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <Settings className={`w-5 h-5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
        </button>
      </div>
      
      <div className="w-full max-w-[800px] mx-auto relative">
        <Card className={`relative p-2 rounded-[20px] min-h-[120px] ${isDark ? 'bg-gray-800/90 border-gray-700' : 'bg-white/80'}`}>
          <CardContent className="p-0 flex flex-col">
            
            {/* Main content area - input field */}
            <div className="flex-1 px-4 mb-[5px] relative">
              <textarea
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                style={{
                  fontFamily: 'ui-sans-serif, -apple-system, system-ui, "Segoe UI", Helvetica, "Apple Color Emoji", Arial, sans-serif, "Segoe UI Emoji", "Segoe UI Symbol"'
                }}
                className={`w-full h-[40px] min-h-[60px] rounded-lg bg-transparent focus:outline-none resize-none text-[14px] leading-tight ${
                  isDark ? 'text-white placeholder:text-gray-400' : 'text-gray-700 placeholder:text-gray-400'
                }`}
              />
            </div>
            
            {/* Bottom bar with model selector and send button */}
            <div className="flex items-center justify-between">
              <div className="">
                {/* 延迟隐藏：onMouseEnter/onMouseLeave 绑定外层，穿越空白区域不立即关闭 */}
                <div
                  className="relative inline-block"
                  onMouseEnter={handleModelDropdownMouseEnter}
                  onMouseLeave={handleModelDropdownMouseLeave}
                  style={{
                    width: isModelDropdownOpen ? 180 : (
                      selectedModels.length === 0 ? 36 : 
                      selectedModels.length === 1 ? 36 : 
                      Math.min(160, 24 + selectedModels.length * 14)
                    ),
                    transition: 'width 0.2s cubic-bezier(0.4,0,0.2,1)'
                  }}
                >
                  {/* 按钮内容 */}
                <div
                    className={`h-[36px] w-full ${isDark ? 'bg-gray-700' : 'bg-[#f2f2f2]'} rounded-full flex items-center justify-center group select-none transition-all duration-200 cursor-pointer`}
                >
                  {/* 默认状态：显示所有选中模型的logo */}
                  {!isModelDropdownOpen && (
                    <div className="flex items-center">
                      {selectedModels.map((modelId, index) => {
                        const model = models.find(m => m.id === modelId);
                        return (
                          <div
                            key={modelId}
                            className={`w-6 h-6 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-600' : 'bg-white'}`}
                            style={{
                              marginLeft: index > 0 ? '-10px' : '0',
                              zIndex: selectedModels.length - index,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }}
                          >
                            <img
                              className="w-4 h-4 object-cover"
                              alt={`${model?.name} icon`}
                              src={model?.icon}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* 展开状态：显示完整内容 */}
                  {isModelDropdownOpen && (
                    <div className="flex items-center w-full px-2.5">
                      <div className="flex items-center">
                        {selectedModels.slice(0, 2).map((modelId, index) => {
                          const model = models.find(m => m.id === modelId);
                          return (
                            <div
                              key={modelId}
                              className={`w-5 h-5 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-600' : 'bg-white'}`}
                              style={{
                                marginLeft: index > 0 ? '-6px' : '0',
                                zIndex: selectedModels.length - index,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                              }}
                            >
                              <img
                                className="w-3.5 h-3.5 object-cover"
                                alt={`${model?.name} icon`}
                                src={model?.icon}
                              />
                            </div>
                          );
                        })}
                      </div>
                      <span
                        className={`font-['Roboto',Helvetica] font-normal ${isDark ? 'text-gray-200' : 'text-[#666666]'} text-sm tracking-[0.50px] ml-2 transition-all duration-200 opacity-100 max-w-[100px]`}
                      >
                        {selectedModels.length === 1 
                          ? models.find(m => m.id === selectedModels[0])?.name
                          : `${selectedModels.length} 个模型`}
                      </span>
                      <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-200 opacity-100 rotate-180 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                      {selectedModels.length === 1 && (
                        <IconLink
                          href={models.find(m => m.id === selectedModels[0])?.link}
                          target="_blank"
                          className="ml-2 w-5 h-5 opacity-100"
                          style={{ maxHeight: '1.5em' }}
                          isDark={isDark}
                        />
                      )}
                    </div>
                  )}
                </div>
                  {/* 下拉菜单内容，和按钮为兄弟节点 */}
                    <ul
                      className={`absolute left-0 top-[110%] w-[180px] z-50 rounded-[10px] shadow-md p-1 transition-all duration-200 overflow-y-auto
                        ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'}
                        ${isModelDropdownOpen ? 'opacity-100 pointer-events-auto translate-y-0 max-h-80' : 'opacity-0 pointer-events-none -translate-y-2 max-h-0'}
                      `}
                      style={{ boxShadow: isModelDropdownOpen ? '0 4px 16px 0 rgba(0,0,0,0.10)' : 'none' }}
                    >
                      {models.map((model) => {
                        const isSelected = selectedModels.includes(model.id);
                        return (
                          <li
                            key={model.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMultiModelToggle(model.id);
                            }}
                            className={`flex items-center py-1.5 px-2 rounded-[5px] cursor-pointer relative group
                              ${isDark ? 'hover:bg-gray-700' : 'hover:bg-[#f5f5f5]'}
                              ${isSelected ? (isDark ? 'bg-gray-700' : 'bg-[#f5f5f5]') : ''}
                            `}
                          >
                            <div className="relative mr-2">
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center ${
                                  isSelected 
                                    ? (isDark ? 'bg-blue-600' : 'bg-blue-500')
                                    : (isDark ? 'bg-gray-600' : 'bg-gray-200')
                                } transition-colors duration-200`}
                              >
                                <img 
                                  className="w-3.5 h-3.5 object-cover"
                                  alt={`${model.name} icon`}
                                  src={model.icon}
                                />
                              </div>
                              {isSelected && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                                  <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                </div>
                              )}
                            </div>
                            <span className={`font-['Roboto',Helvetica] font-normal truncate ${isDark ? 'text-gray-200' : 'text-[#666666]'} text-sm tracking-[0.50px]`}>
                              {model.name}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Send Button */}
                <button 
                  onClick={handleSend}
                  className={`${isSending || !inputValue.trim() ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                  disabled={isSending || !inputValue.trim()}
                >
                  <SendIcon 
                    size={36}
                    disabled={!inputValue.trim()}
                    isSending={isSending}
                    isDark={isDark}
                    className="transition-all duration-200"
                  />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isDark={isDark}
        onThemeChange={handleThemeChange}
        onAppToggleChange={handleAppToggleChange}
      />
      
      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
};