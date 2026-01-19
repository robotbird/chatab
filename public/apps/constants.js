// 支持的网站配置
const SUPPORTED_SITES = {
  CHATGPT: {
    name: 'ChatGPT',
    hostname: 'chatgpt.com',
    delay: 2000
  },
  DEEPSEEK: {
    name: 'DeepSeek',
    hostname: 'deepseek.com',
    delay: 2000
  },
  GEMINI: {
    name: 'Gemini',
    hostname: 'gemini.google.com',
    delay: 2000
  },
  DOUBAO: {
    name: 'Doubao',
    hostname: 'doubao.com',
    delay: 2000
  },
  PERPLEXITY: {
    name: 'Perplexity',
    hostname: 'perplexity.ai',
    delay: 2000
  },
  KIMI: {
    name: 'Kimi',
    hostname: 'kimi.com',
    delay: 2000
  },
  QIANWEN: {
    name: 'Qianwen',
    hostname: 'qianwen.com',
    delay: 5000 // 需要更长时间因为网站有加载问题
  },
  YUANBAO: {
    name: 'Yuanbao',
    hostname: 'yuanbao.tencent.com',
    delay: 5000 // 需要更长时间因为网站有加载问题
  },
  GROK: {
    name: 'Grok',
    hostname: 'grok.com',
    delay: 2000
  },
  YIYAN: {
    name: 'Yiyan',
    hostname: 'yiyan.baidu.com',
    delay: 5000 // 需要更长时间因为网站有加载问题
  }
};

// 通用选择器
const COMMON_SELECTORS = {
  TEXTAREA: 'textarea',
  CONTENTEDITABLE: 'div[contenteditable="true"]',
  INPUT_TEXT: 'input[type="text"]',
  SEND_BUTTONS: [
    'button[type="submit"]',
    '.send-btn',
    '.submit-btn',
    '[data-testid*="send"]',
    '[aria-label*="发送"]',
    '[aria-label*="Send"]',
    '[title*="发送"]',
    '[title*="Send"]',
    'button:has(svg)',
    'button[class*="send"]',
    'button[class*="submit"]'
  ]
};

// 导出常量
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SUPPORTED_SITES, COMMON_SELECTORS };
} else {
  window.ChatABConstants = { SUPPORTED_SITES, COMMON_SELECTORS };
}
