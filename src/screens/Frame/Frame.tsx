import { ChevronDown, Sun, Moon } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { IconLink } from "../../components/ui/IconLink";
import { SendIcon } from "../../components/ui/SendIcon";

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
  const [selectedModel, setSelectedModel] = useState("chatgpt");
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [placeholder, setPlaceholder] = useState("Ask anything");
  const [charCount, setCharCount] = useState(0);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // Update placeholder when model changes
  useEffect(() => {
    setPlaceholder("Ask anything");
    setCharCount(0);
  }, [selectedModel]);

  // Model data for mapping
  const originalModels = [
    {
      id: "deepseek",
      name: "DeepSeek",
      icon: "/deepseek.png",
      url: "https://chat.deepseek.com",
      link: "https://chat.deepseek.com"
    },
    {
      id: "chatgpt",
      name: "ChatGPT",
      icon: "/chatGPT.png",
      url: "https://chatgpt.com",
      link: "https://chatgpt.com"
    },
    {
      id: "doubao",
      name: "Doubao",
      icon: "/logo/doubao.png",
      url: "https://www.doubao.com/chat/",
      link: "https://www.doubao.com/chat/"
    },
    {
      id: "gemini",
      name: "Gemini",
      icon: "/logo/gemini.png",
      url: "https://gemini.google.com",
      link: "https://gemini.google.com"
    },
    {
      id: "perplexity",
      name: "Perplexity",
      icon: "/logo/perplexity.png",
      url: "https://www.perplexity.ai",
      link: "https://www.perplexity.ai"
    },{
      id:"kimi",
      name:"Kimi",
      icon:"/logo/kimi.png",
      url:"https://www.kimi.com",
      link:"https://www.kimi.com"
    },{
      id:"tongyi",
      name:"Tongyi",
      icon:"/logo/tongyi.png",
      url:"https://tongyi.com",
      link:"https://tongyi.com"
    },{
      id:"yuanbao",
      name:"Yuanbao",
      icon:"/logo/yuanbao.png",
      url:"https://yuanbao.tencent.com",
      link:"https://yuanbao.tencent.com"
    }
  ];

  // 工具函数：读取 recentModels
  function getRecentModels(): string[] {
    try {
      const stored = localStorage.getItem('recentModels');
      if (stored) {
        const arr = JSON.parse(stored);
        if (Array.isArray(arr)) return arr;
      }
    } catch {}
    return [];
  }
  // 工具函数：写入 recentModels
  function setRecentModels(arr: string[]) {
    localStorage.setItem('recentModels', JSON.stringify(arr));
  }

  // 根据 recentModels 排序 models
  function getSortedModels(recent: string[]): typeof originalModels {
    const idSet = new Set(recent);
    const sorted = [
      ...recent
        .map(id => originalModels.find(m => m.id === id))
        .filter(Boolean) as typeof originalModels,
      ...originalModels.filter(m => !idSet.has(m.id))
    ];
    return sorted;
  }

  const [models, setModels] = useState(originalModels);
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

  // 初始化 recentModels 和 selectedModel
  useEffect(() => {
    const recent = getRecentModels();
    if (recent.length > 0) {
      setModels(getSortedModels(recent));
      setSelectedModel(recent[0]);
    } else {
      setModels(originalModels);
      setSelectedModel("chatgpt");
    }
  }, []);
  
  // 处理发送功能 - 移除URL参数传递
  const handleSend = () => {
    if (!inputValue.trim()) return;
    const model = models.find(m => m.id === selectedModel);
    if (model) {
      window.location.href = model.url;
    }
  };
  
  // Update input without char limit check
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setInputValue(newText);
    setCharCount(newText.length);
    // Auto-adjust height
    e.target.style.height = '40px'; // Reset height
    e.target.style.height = `${Math.min(120, e.target.scrollHeight)}px`; // Set new height with max limit
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
      textarea.style.height = `${Math.min(120, textarea.scrollHeight)}px`;
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
    setModels(prev => {
      const newRecent = [modelId, ...prev.filter(m => m.id !== modelId).map(m => m.id)];
      setRecentModels(newRecent);
      return getSortedModels(newRecent);
    });
  };

  return (
    <div className={`transition-colors duration-200 ${isDark ? 'bg-gray-900' : 'bg-transparent'} flex flex-col items-center justify-center w-full min-h-screen`}>
      <div className="w-full max-w-[800px] mx-auto relative">
 
        
        <button
          onClick={() => setIsDark(!isDark)}
          className="absolute right-2 top-[-40px] p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-yellow-500" />
          ) : (
            <Moon className="w-5 h-5 text-gray-600" />
          )}
        </button>
        <Card className={`relative p-2 rounded-[20px] min-h-[120px] ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
          <CardContent className="p-0 flex flex-col">
            {/* Main content area - input field */}
            <div className="flex-1 px-4 mb-[5px] relative">
              <textarea
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={`w-full h-[40px] min-h-[60px]  rounded-lg bg-transparent focus:outline-none resize-none text-[14px] leading-tight ${
                  isDark ? 'text-white placeholder:text-gray-400' : 'text-[#1e1e1e] placeholder:text-gray-400'
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
                    className={`h-[34px] ${isDark ? 'bg-gray-700' : 'bg-[#f2f2f2]'} rounded-[20px] px-2.5 flex items-center group select-none`}
                  style={{ minWidth: 40, maxWidth: isModelDropdownOpen ? 180 : 40, transition: 'max-width 0.2s cubic-bezier(0.4,0,0.2,1)' }}
                >
                  <div className="flex items-center gap-1 cursor-pointer">
                    {/* 当前选中模型图标始终显示，名称和链接icon仅在hover时显示 */}
                    <div className="flex items-center">
                      <img
                        className="w-5 h-5 object-cover mr-0"
                        alt={`${selectedModel} icon`}
                        src={models.find(m => m.id === selectedModel)?.icon}
                      />
                      <span
                        className={`font-['Roboto',Helvetica] font-normal ${isDark ? 'text-gray-200' : 'text-[#666666]'} text-sm tracking-[0.50px] ml-2 transition-all duration-200 ${isModelDropdownOpen ? 'opacity-100 max-w-[100px]' : 'opacity-0 max-w-0 overflow-hidden'}`}
                        style={{ transition: 'opacity 0.2s, max-width 0.2s, margin-left 0.2s' }}
                      >
                        {models.find(m => m.id === selectedModel)?.name}
                      </span>
                      <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-200 ${isModelDropdownOpen ? 'opacity-100' : 'opacity-0'} ${isModelDropdownOpen ? 'rotate-180' : ''} ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    </div>
                      <IconLink
                        href={models.find(m => m.id === selectedModel)?.link}
                        target="_blank"
                        className={`ml-2 w-5 h-5 transition-opacity duration-150 ${isModelDropdownOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                        style={{ maxHeight: '1.5em' }}
                      />
                    </div>
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
              <div className="flex items-center">
                <button 
                  onClick={handleSend}
                  className="cursor-pointer"
                >
                  <SendIcon 
                    size={32}
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
    </div>
  );
};