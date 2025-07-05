import { ArrowUpCircleIcon, ChevronDown, Sun, Moon } from "lucide-react";
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "../../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { IconLink } from "../../components/ui/IconLink";

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
  const [placeholder, setPlaceholder] = useState("输入你的问题");
  const [charCount, setCharCount] = useState(0);
  const [shouldAutoSend, setShouldAutoSend] = useState(false);
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
    setPlaceholder("输入你的问题");
    setCharCount(0);
  }, [selectedModel]);

  // Model data for mapping
  const models = [
    {
      id: "deepseek",
      name: "DeepSeek",
      icon: "/deepseek.png",
      url: "https://chat.deepseek.com",
      link:"https://chat.deepseek.com"
    },
    {
      id: "chatgpt",
      name: "ChatGPT",
      icon: "/chatGPT.png",
      url: "https://chatgpt.com",
      link:"https://chatgpt.com"
    },
    {
      id: "doubao",
      name: "Doubao",
      icon: "/logo/doubao.png",
      url: "https://www.doubao.com/chat/",
      link:"https://www.doubao.com/chat/"
    },
    {
      id: "gemini",
      name: "Gemini",
      icon: "/logo/gemini.png",
      url: "https://gemini.google.com",
      link:"https://gemini.google.com"
    }
  ];

  // 解析URL参数
  useEffect(() => {
    // 解析URL查询参数
    const searchParams = new URLSearchParams(window.location.search);
    const queryParam = searchParams.get('q');
    const modelParam = searchParams.get('model');
    
    if (queryParam) {
      // 解码URL编码的查询参数
      const decodedQuery = decodeURIComponent(queryParam);
      
      // 设置输入值
      setInputValue(decodedQuery);
      
      // 更新字符计数
      setCharCount(decodedQuery.length);
      
      // 如果URL中指定了模型，则设置为当前模型
      if (modelParam && models.some(m => m.id === modelParam)) {
        setSelectedModel(modelParam);
      }
      
      // 标记需要自动发送
      setShouldAutoSend(true);
    }
  }, []);
  
  // 处理发送功能
  const handleSend = () => {
    if (!inputValue.trim()) return;
    const model = models.find(m => m.id === selectedModel);
    if (model) {
      const encodedQuery = encodeURIComponent(inputValue);
      const url = `${model.url}?q=${encodedQuery}`;
      window.location.href = url;
    }
  };
  
  // 自动发送处理
  useEffect(() => {
    if (shouldAutoSend) {
      // 自动调整输入框高度
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.style.height = '40px';
        textarea.style.height = `${Math.min(120, textarea.scrollHeight)}px`;
      }
      
      // 延迟发送，确保所有状态都已更新
      const timer = setTimeout(() => {
        handleSend();
        setShouldAutoSend(false); // 重置标记
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [shouldAutoSend, handleSend, selectedModel, inputValue]);

  // Helper function to check if text is primarily Chinese
  const isPrimarilyChinese = (text: string): boolean => {
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g)?.length || 0;
    return chineseChars > text.length / 2;
  };

  // Get max char limit based on input type
  const getCharLimit = (): number => {
    return isPrimarilyChinese(inputValue) ? 200 : 1500;
  };

  // Update input with char limit check
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const isChinese = isPrimarilyChinese(newText);
    const limit = isChinese ? 200 : 1500;
    // Only update if we're within limits or deleting
    if (newText.length <= limit || newText.length < inputValue.length) {
      setInputValue(newText);
      setCharCount(newText.length);
      // Auto-adjust height
      e.target.style.height = '40px'; // Reset height
      e.target.style.height = `${Math.min(120, e.target.scrollHeight)}px`; // Set new height with max limit
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
              <div className={`absolute right-5 bottom-0 text-xs ${
                charCount >= getCharLimit() ? 'text-red-500' : (isDark ? 'text-gray-400' : 'text-gray-500')
              }`}>
                {charCount}/{getCharLimit()}
              </div>
            </div>
            
            {/* Bottom bar with model selector and send button */}
            <div className="flex items-center justify-between">
              <div className="">
                <div className={`h-[32px] ${isDark ? 'bg-gray-700' : 'bg-[#f2f2f2]'} rounded-[20px] px-4 flex items-center group`}>
                  <div className="flex items-center gap-1">
                    <Select 
                      value={selectedModel} 
                      onValueChange={setSelectedModel}
                      onOpenChange={setIsOpen}
                    >
                      <SelectTrigger className="w-full h-[30px] bg-transparent border-none shadow-none focus:ring-0 px-0 py-0 flex items-center cursor-pointer justify-start">
                        <SelectValue>
                          <div className="flex items-center">
                            <img
                              className="w-5 h-5 object-cover mr-2"
                              alt={`${selectedModel} icon`}
                              src={models.find(m => m.id === selectedModel)?.icon}
                            />
                            <span className={`font-['Roboto',Helvetica] font-normal ${
                              isDark ? 'text-gray-200' : 'text-[#666666]'
                            } text-sm tracking-[0.50px]`}>
                              {models.find(m => m.id === selectedModel)?.name}
                            </span>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent position="popper" className={`w-[180px] ${
                        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'
                      } rounded-[10px] shadow-md z-50 p-1`}>
                        {models.map((model) => (
                          <SelectItem
                            key={model.id}
                            value={model.id}
                            className={`group flex items-center py-1.5 px-2 ${
                              isDark ? 'hover:bg-gray-700' : 'hover:bg-[#f5f5f5]'
                            } rounded-[5px] cursor-pointer relative`}
                          >
                            <div className="flex items-center flex-1 min-w-0">
                              <img 
                                className="w-5 h-5 object-cover mr-2"
                                alt={`${model.name} icon`}
                                src={model.icon}
                              />
                              <span className={`font-['Roboto',Helvetica] font-normal truncate ${
                                isDark ? 'text-gray-200' : 'text-[#666666]'
                              } text-sm tracking-[0.50px]`}>
                                {model.name}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <IconLink
                      href={models.find(m => m.id === selectedModel)?.link}
                      target="_blank"
                      className="ml-2 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                      style={{ maxHeight: '1.5em' }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <button 
                  onClick={handleSend}
                  className="cursor-pointer"
                >
                  <ArrowUpCircleIcon className={`w-8 h-8 ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-500'}`} />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};