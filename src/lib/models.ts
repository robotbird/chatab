// 共享的AI模型数据和相关工具函数

export interface ModelInfo {
  id: string;
  name: string;
  icon: string;
  url: string;
  link: string;
}

export const originalModels: ModelInfo[] = [
  {
    id: "deepseek",
    name: "DeepSeek",
    icon: "/logo/deepseek.svg",
    url: "https://chat.deepseek.com",
    link: "https://chat.deepseek.com"
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    icon: "/logo/chatGPT.svg",
    url: "https://chatgpt.com",
    link: "https://chatgpt.com"
  },
  {
    id: "doubao",
    name: "Doubao",
    icon: "/logo/doubao.svg",
    url: "https://www.doubao.com/chat/",
    link: "https://www.doubao.com/chat/"
  },
  {
    id: "gemini",
    name: "Gemini",
    icon: "/logo/gemini.svg",
    url: "https://gemini.google.com",
    link: "https://gemini.google.com"
  },
  {
    id: "perplexity",
    name: "Perplexity",
    icon: "/logo/perplexity.svg",
    url: "https://www.perplexity.ai",
    link: "https://www.perplexity.ai"
  },
  {
    id: "kimi",
    name: "Kimi",
    icon: "/logo/kimi.svg",
    url: "https://www.kimi.com",
    link: "https://www.kimi.com"
  },
  {
    id: "tongyi",
    name: "Tongyi",
    icon: "/logo/tongyi.svg",
    url: "https://tongyi.com",
    link: "https://tongyi.com"
  },
  {
    id: "yuanbao",
    name: "Yuanbao",
    icon: "/logo/yuanbao.svg",
    url: "https://yuanbao.tencent.com",
    link: "https://yuanbao.tencent.com"
  },
  {
    id: "grok",
    name: "Grok",
    icon: "/logo/grok.svg",
    url: "https://grok.com",
    link: "https://grok.com"
  },
  // {  放弃支持百度这种垃圾公司
  //   id: "yiyan",
  //   name: "Yiyan",
  //   icon: "/logo/yiyan.svg",
  //   url: "https://yiyan.baidu.com",
  //   link: "https://yiyan.baidu.com"
  // }
];

// 应用开关状态管理
export interface AppToggleState {
  [modelId: string]: boolean;
}

// 获取应用开关状态，默认所有应用都启用
export function getAppToggleStates(): AppToggleState {
  try {
    const stored = localStorage.getItem('appToggleStates');
    if (stored) {
      const states = JSON.parse(stored);
      // 确保所有模型都有状态，新增的模型默认启用
      const result: AppToggleState = {};
      originalModels.forEach(model => {
        result[model.id] = states[model.id] !== undefined ? states[model.id] : true;
      });
      return result;
    }
  } catch (error) {
    console.error('Failed to parse app toggle states:', error);
  }
  
  // 默认所有应用都启用
  const defaultStates: AppToggleState = {};
  originalModels.forEach(model => {
    defaultStates[model.id] = true;
  });
  return defaultStates;
}

// 保存应用开关状态
export function setAppToggleStates(states: AppToggleState): void {
  try {
    localStorage.setItem('appToggleStates', JSON.stringify(states));
  } catch (error) {
    console.error('Failed to save app toggle states:', error);
  }
}

// 获取启用的模型列表
export function getEnabledModels(): ModelInfo[] {
  const toggleStates = getAppToggleStates();
  return originalModels.filter(model => toggleStates[model.id]);
}

// 工具函数：读取 recentModels
export function getRecentModels(): string[] {
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
export function setRecentModels(arr: string[]): void {
  localStorage.setItem('recentModels', JSON.stringify(arr));
}

// 根据 recentModels 排序 models（只包含启用的模型）
export function getSortedEnabledModels(recent: string[]): ModelInfo[] {
  const enabledModels = getEnabledModels();
  const idSet = new Set(recent);
  const sorted = [
    ...recent
      .map(id => enabledModels.find(m => m.id === id))
      .filter(Boolean) as ModelInfo[],
    ...enabledModels.filter(m => !idSet.has(m.id))
  ];
  return sorted;
}
