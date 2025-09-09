/**
 * Gemini 处理器
 */
class GeminiHandler extends BaseHandler {
  constructor() {
    super('Gemini');
  }

  getInputSelectors() {
    return [
      'div.ql-editor.textarea.new-input-ui[contenteditable="true"]',
      'div[contenteditable="true"]',
      'textarea[placeholder*="Enter a prompt"]',
      'textarea'
    ];
  }

  /**
   * Gemini 的 contenteditable 处理
   */
  async fillContentEditable(element, text) {
    element.focus();
    await this.utils.wait(200);

    // 对于 Gemini，直接使用 <br> 标签处理换行
    element.innerHTML = text.replace(/\n/g, '<br>');
    
    // 触发输入事件
    const inputEvent = new Event('input', { bubbles: true });
    element.dispatchEvent(inputEvent);
  }
}

// 导出 Gemini 处理器
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GeminiHandler;
} else {
  window.GeminiHandler = GeminiHandler;
}
