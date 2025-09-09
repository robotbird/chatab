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
      'div.ql-editor[contenteditable="true"]',
      'rich-textarea .ql-editor[contenteditable="true"]',
      'div[contenteditable="true"]',
      'textarea[placeholder*="Enter a prompt"]',
      'textarea'
    ];
  }

  /**
   * Gemini 的 contenteditable 处理 - 针对 Quill 编辑器优化
   */
  async fillContentEditable(element, text) {
    element.focus();
    await this.utils.wait(200);

    // 检查是否是 Quill 编辑器
    const isQuillEditor = element.classList.contains('ql-editor');
    
    if (isQuillEditor) {
      // 对于 Quill 编辑器，需要使用正确的 DOM 结构
      // 清除现有内容
      element.innerHTML = '';
      
      // 按行分割文本并创建 p 标签
      const lines = text.split('\n');
      lines.forEach((line, index) => {
        const p = document.createElement('p');
        if (line.trim() === '') {
          // 空行使用 <br>
          p.appendChild(document.createElement('br'));
        } else {
          p.textContent = line;
        }
        element.appendChild(p);
      });
      
      // 移除 ql-blank 类（表示编辑器不再为空）
      element.classList.remove('ql-blank');
    } else {
      // 普通 contenteditable 元素
      element.innerHTML = text.replace(/\n/g, '<br>');
    }
    
    // 设置光标到末尾
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    
    // 触发多种事件确保 Quill 编辑器响应
    const events = ['input', 'textInput', 'keyup', 'change'];
    events.forEach(eventType => {
      const event = new Event(eventType, { 
        bubbles: true, 
        cancelable: true,
        composed: true
      });
      element.dispatchEvent(event);
    });
    
    // 额外触发 Quill 特定事件
    if (isQuillEditor) {
      // 模拟键盘输入事件
      const keydownEvent = new KeyboardEvent('keydown', {
        bubbles: true,
        cancelable: true,
        key: ' ',
        code: 'Space'
      });
      element.dispatchEvent(keydownEvent);
      
      const keyupEvent = new KeyboardEvent('keyup', {
        bubbles: true,
        cancelable: true,
        key: ' ',
        code: 'Space'
      });
      element.dispatchEvent(keyupEvent);
    }
    
    await this.utils.wait(100);
  }
}

// 导出 Gemini 处理器
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GeminiHandler;
} else {
  window.GeminiHandler = GeminiHandler;
}
