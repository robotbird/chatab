/**
 * DeepSeek 处理器
 */
class DeepSeekHandler extends BaseHandler {
  constructor() {
    super('DeepSeek');
  }

  getInputSelectors() {
    return [
      '#chat-input',
      'textarea[placeholder*="请输入"]',
      'textarea[placeholder*="输入"]',
      'div[contenteditable="true"]',
      'textarea'
    ];
  }
}

// 导出 DeepSeek 处理器
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DeepSeekHandler;
} else {
  window.DeepSeekHandler = DeepSeekHandler;
}
