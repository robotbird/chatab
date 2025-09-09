/**
 * Kimi 处理器
 */
class KimiHandler extends BaseHandler {
  constructor() {
    super('Kimi');
  }

  getInputSelectors() {
    return [
      '.chat-input-editor[contenteditable="true"]',
      'div[data-lexical-editor="true"][role="textbox"]',
      '.chat-input-editor',
      '.chat-input div[contenteditable="true"]',
      'div[contenteditable="true"][data-lexical-editor="true"]',
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"]'
    ];
  }

  /**
   * 重写查找输入框方法，添加调试信息
   */
  findInputElement() {
    this.utils.log('Kimi: 开始查找输入框');
    
    // 先检查页面上是否有相关元素
    const chatInputContainer = document.querySelector('.chat-input');
    const editorContainer = document.querySelector('.chat-input-editor-container');
    const allContentEditables = document.querySelectorAll('div[contenteditable="true"]');
    const allLexicalEditors = document.querySelectorAll('div[data-lexical-editor="true"]');
    
    this.utils.log('Kimi: 调试信息', {
      chatInputContainer: !!chatInputContainer,
      editorContainer: !!editorContainer,
      contentEditableCount: allContentEditables.length,
      lexicalEditorCount: allLexicalEditors.length
    });
    
    const inputElement = super.findInputElement();
    
    if (inputElement) {
      this.utils.log(`Kimi: 找到输入框，选择器: ${inputElement.className} ${inputElement.tagName}`);
    } else {
      this.utils.log('Kimi: 未找到输入框，尝试通用方法');
      // 如果还是找不到，尝试最后的通用方法
      if (allContentEditables.length > 0) {
        const fallbackElement = allContentEditables[0];
        this.utils.log('Kimi: 使用第一个contenteditable元素作为输入框');
        return fallbackElement;
      }
    }
    
    return inputElement;
  }

  /**
   * 获取 Kimi 特定的发送按钮选择器
   * @returns {Array<string>} 选择器数组
   */
  getSendButtonSelectors() {
    return [
      '.send-button',                    // Kimi 特有的发送按钮类
      '.send-button svg',                // 发送按钮内的 SVG 图标
      'div[class*="send-button"]',       // 包含 send-button 类的 div
      'button[class*="send"]',           // 包含 send 的按钮
      ...super.getSendButtonSelectors()  // 继承父类的通用选择器
    ];
  }

  /**
   * 重写发送消息方法，优化重试逻辑为 3 次
   * @param {HTMLElement} inputElement - 输入框元素
   * @returns {Promise<boolean>} 发送是否成功
   */
  async sendMessage(inputElement) {
    this.utils.log(`${this.siteName}: 开始发送消息`);
    
    // 使用 3 次重试的按钮发送
    const buttonSuccess = await this.sendByButtonWithRetry(3);
    if (buttonSuccess) {
      return true;
    }
    
    // 按钮发送失败，尝试键盘发送
    const keyboardSuccess = await this.sendByKeyboard(inputElement);
    return keyboardSuccess;
  }

  /**
   * 通过按钮发送（带重试逻辑）
   * @param {number} maxRetries - 最大重试次数
   * @returns {Promise<boolean>}
   */
  async sendByButtonWithRetry(maxRetries = 3) {
    const selectors = this.getSendButtonSelectors();
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      this.utils.log(`${this.siteName}: 尝试查找发送按钮，第 ${attempt}/${maxRetries} 次`);
      
      const button = this.utils.findAvailableButton(selectors, 5);
      
      if (button) {
        try {
          // 确保按钮可见并可点击
          button.scrollIntoView({ behavior: 'smooth', block: 'center' });
          await this.utils.wait(200);
          
          button.click();
          this.utils.log(`${this.siteName}: 点击发送按钮成功`);
          return true;
        } catch (e) {
          this.utils.log(`${this.siteName}: 点击发送按钮失败: ${e.message}`);
        }
      } else {
        this.utils.log(`${this.siteName}: 第 ${attempt} 次未找到可用的发送按钮`);
      }
      
      // 如果不是最后一次尝试，等待一段时间再重试
      if (attempt < maxRetries) {
        await this.utils.wait(800);
      }
    }
    
    this.utils.log(`${this.siteName}: ${maxRetries} 次尝试后仍未找到可用的发送按钮`);
    return false;
  }

  /**
   * Kimi 的 Lexical 编辑器特殊处理
   */
  async fillContentEditable(element, text) {
    // 检查是否是 Lexical 编辑器
    if (element.getAttribute('data-lexical-editor') === 'true') {
      this.utils.log('Kimi: Lexical编辑器特殊处理');
      
      try {
        // 先清空内容
        element.innerHTML = '';
        
        // 使用简化的文本插入方式
        element.focus();
        
        // 尝试使用 document.execCommand 插入文本
        if (document.execCommand) {
          document.execCommand('insertText', false, text);
        } else {
          // 备用方案：直接设置textContent
          element.textContent = text;
        }
        
        // 触发必要的事件
        await this.utils.triggerEvents(element, ['input', 'change', 'keyup']);
      } catch (e) {
        this.utils.log(`Kimi: Lexical特殊处理失败，使用备用方法: ${e.message}`);
        // 备用方案：使用Lexical格式
        const formattedText = text.split('\n').map(line => 
          `<p dir="ltr"><span data-lexical-text="true">${line || '<br>'}</span></p>`
        ).join('');
        element.innerHTML = formattedText;
        
        await this.utils.triggerEvents(element, ['input', 'change', 'keyup']);
      }
    } else {
      // 使用父类的默认处理
      await super.fillContentEditable(element, text);
    }
  }
}

// 导出 Kimi 处理器
if (typeof module !== 'undefined' && module.exports) {
  module.exports = KimiHandler;
} else {
  window.KimiHandler = KimiHandler;
}
