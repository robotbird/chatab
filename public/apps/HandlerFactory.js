/**
 * 处理器工厂类
 * 负责创建和管理各种网站处理器
 */
class HandlerFactory {
  constructor() {
    this.handlers = new Map();
    this.initialized = false;
  }

  /**
   * 初始化所有处理器（延迟初始化）
   */
  initializeHandlers() {
    if (this.initialized) return;
    
    // 检查所有处理器类是否已加载
    const handlerClasses = [
      'ChatGPTHandler', 'DeepSeekHandler', 'GeminiHandler', 'DoubaoHandler',
      'PerplexityHandler', 'KimiHandler', 'QianwenHandler', 'YuanbaoHandler',
      'GrokHandler', 'YiyanHandler'
    ];
    
    const missingHandlers = handlerClasses.filter(className => !window[className]);
    if (missingHandlers.length > 0) {
      console.warn('ChatAB: 以下处理器类尚未加载:', missingHandlers.join(', '));
      return false;
    }
    
    // 注册所有处理器类
    this.registerHandler('CHATGPT', window.ChatGPTHandler);
    this.registerHandler('DEEPSEEK', window.DeepSeekHandler);
    this.registerHandler('GEMINI', window.GeminiHandler);
    this.registerHandler('DOUBAO', window.DoubaoHandler);
    this.registerHandler('PERPLEXITY', window.PerplexityHandler);
    this.registerHandler('KIMI', window.KimiHandler);
    this.registerHandler('QIANWEN', window.QianwenHandler);
    this.registerHandler('YUANBAO', window.YuanbaoHandler);
    this.registerHandler('GROK', window.GrokHandler);
    this.registerHandler('YIYAN', window.YiyanHandler);
    
    this.initialized = true;
    console.log('ChatAB: HandlerFactory 初始化完成');
    return true;
  }

  /**
   * 注册处理器类
   * @param {string} siteKey - 网站键名
   * @param {Class} HandlerClass - 处理器类
   */
  registerHandler(siteKey, HandlerClass) {
    this.handlers.set(siteKey, HandlerClass);
  }

  /**
   * 创建处理器实例
   * @param {string} siteKey - 网站键名
   * @returns {BaseHandler|null} 处理器实例或null
   */
  createHandler(siteKey) {
    const HandlerClass = this.handlers.get(siteKey);
    if (HandlerClass) {
      return new HandlerClass();
    }
    
    console.warn(`ChatAB: 未找到 ${siteKey} 的处理器类`);
    return null;
  }

  /**
   * 检测当前网站并创建对应的处理器
   * @param {string} hostname - 当前网站的hostname
   * @returns {BaseHandler|null} 处理器实例或null
   */
  createHandlerForSite(hostname) {
    // 确保处理器已初始化
    if (!this.initializeHandlers()) {
      console.error('ChatAB: 处理器初始化失败，无法创建处理器');
      return null;
    }
    
    const siteKey = window.ChatABUtils.detectSite(hostname);
    if (siteKey) {
      const handler = this.createHandler(siteKey);
      if (handler) {
        console.log(`ChatAB: 为网站 ${siteKey} 创建了处理器`);
        return handler;
      }
    }
    
    console.log(`ChatAB: 当前网站 ${hostname} 不在支持列表中`);
    return null;
  }

  /**
   * 获取支持的网站列表
   * @returns {Array<string>} 支持的网站键名数组
   */
  getSupportedSites() {
    return Array.from(this.handlers.keys());
  }

  /**
   * 检查是否支持某个网站
   * @param {string} siteKey - 网站键名
   * @returns {boolean} 是否支持
   */
  isSupported(siteKey) {
    return this.handlers.has(siteKey);
  }
}

// 导出处理器工厂类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HandlerFactory;
} else {
  window.HandlerFactory = HandlerFactory;
}
