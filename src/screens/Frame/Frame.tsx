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
  const [inputValue, setInputValue] = useState("");
  const [placeholder, setPlaceholder] = useState("Ask anything");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
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

  // 加载存储的输入内容
  useEffect(() => {
    const loadStoredData = async () => {
      if (window.chrome?.storage?.local) {
        try {
          // Promise化Chrome Storage API
          const chromeStorageGet = (keys: string[]): Promise<{ [key: string]: any }> => {
            return new Promise((resolve) => {
              window.chrome.storage.local.get(keys, resolve);
            });
          };

          const result = await chromeStorageGet(['inputValue']);
          
          if (result.inputValue) {
            setInputValue(result.inputValue);
          }
        } catch (error) {
          console.error('ChatAB: 加载存储数据失败:', error);
        }
      }
    };

    loadStoredData();
  }, []);



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
        setSelectedModel(enabledModels[0].id);
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
    
    const model = models.find(m => m.id === selectedModel);
    if (model) {
      // 直接存储原始输入内容，contentScript会正确处理换行符
      if (window.chrome?.storage?.local) {
        window.chrome.storage.local.set({ inputValue: inputValue });
      }
      window.location.href = model.url;
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

  // 选择 model 时，更新 recentModels 顺序和存储
  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    const newRecent = [modelId, ...models.filter(m => m.id !== modelId).map(m => m.id)];
    setRecentModels(newRecent);
    setModels(getSortedEnabledModels(newRecent));
  };

  // 当应用开关状态改变时重新加载模型列表
  const handleAppToggleChange = () => {
    loadModels();
  };

  return (
    <div className={`transition-colors duration-200 bg-transparent flex flex-col items-center justify-center w-full min-h-screen`}>
      <div className="w-full max-w-[800px] mx-auto relative">
 
        
        <div className="absolute right-2 top-[-40px] flex gap-2">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-full bg-gray-200/30 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <Settings className={`w-5 h-5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
          </button>
        </div>
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
                >
                  {/* 按钮内容 */}
                <div
                    className={`h-[36px] ${isDark ? 'bg-gray-700' : 'bg-[#f2f2f2]'} rounded-full flex items-center justify-center group select-none transition-all duration-200 cursor-pointer`}
                  style={{ minWidth: 36, maxWidth: isModelDropdownOpen ? 180 : 36, transition: 'max-width 0.2s cubic-bezier(0.4,0,0.2,1)' }}
                >
                  {/* 默认状态：只显示居中的logo */}
                  {!isModelDropdownOpen && (
                    <img
                      className="w-5 h-5 object-cover"
                      alt={`${selectedModel} icon`}
                      src={models.find(m => m.id === selectedModel)?.icon}
                    />
                  )}
                  
                  {/* 展开状态：显示完整内容 */}
                  {isModelDropdownOpen && (
                    <div className="flex items-center w-full px-2.5">
                      <img
                        className="w-5 h-5 object-cover"
                        alt={`${selectedModel} icon`}
                        src={models.find(m => m.id === selectedModel)?.icon}
                      />
                      <span
                        className={`font-['Roboto',Helvetica] font-normal ${isDark ? 'text-gray-200' : 'text-[#666666]'} text-sm tracking-[0.50px] ml-2 transition-all duration-200 opacity-100 max-w-[100px]`}
                      >
                        {models.find(m => m.id === selectedModel)?.name}
                      </span>
                      <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-200 opacity-100 rotate-180 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                      <IconLink
                        href={models.find(m => m.id === selectedModel)?.link}
                        target="_blank"
                        className="ml-2 w-5 h-5 opacity-100"
                        style={{ maxHeight: '1.5em' }}
                      />
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
                      {models.map((model) => (
                        <li
                          key={model.id}
                          onClick={() => {
                            handleModelChange(model.id);
                            setIsModelDropdownOpen(false);
                          }}
                          className={`flex items-center py-1.5 px-2 rounded-[5px] cursor-pointer relative group
                            ${isDark ? 'hover:bg-gray-700' : 'hover:bg-[#f5f5f5]'}
                            ${selectedModel === model.id ? (isDark ? 'bg-gray-700' : 'bg-[#f5f5f5]') : ''}
                          `}
                        >
                          <img 
                            className="w-5 h-5 object-cover mr-2"
                            alt={`${model.name} icon`}
                            src={model.icon}
                          />
                          <span className={`font-['Roboto',Helvetica] font-normal truncate ${isDark ? 'text-gray-200' : 'text-[#666666]'} text-sm tracking-[0.50px]`}>
                            {model.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Send Button */}
                <button 
                  onClick={handleSend}
                  className="cursor-pointer"
                >
                  <SendIcon 
                    size={36}
                    className={`transition-all duration-200 hover:opacity-80 ${
                      inputValue.trim() 
                        ? (isDark ? 'text-white hover:text-gray-200' : 'text-black hover:text-gray-800')
                        : (isDark ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-500')
                    }`} 
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