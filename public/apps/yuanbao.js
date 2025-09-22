/**
 * Yuanbao 处理器
 */
class YuanbaoHandler extends BaseHandler {
  constructor() {
    super('Yuanbao');
  }

  getInputSelectors() {
    return [
      '.chat-input-editor .ql-editor[contenteditable="true"]',
      'div.ql-editor[contenteditable="true"][data-placeholder*="Ask me anything"]',
      'div.ql-editor.ql-blank[contenteditable="true"]',
      'div.ql-editor[contenteditable="true"]',
      '.ql-editor[contenteditable="true"]',
      '.ql-container .ql-editor[contenteditable="true"]',
      '.chat-input-editor div[contenteditable="true"]',
      'div[contenteditable="true"][data-placeholder*="Ask"]',
      'div[contenteditable="true"][enterkeyhint="send"]',
      'div[contenteditable="true"]'
    ];
  }

  /**
   * 重写查找输入框方法，添加详细调试信息
   */
  findInputElement() {
    this.utils.log('Yuanbao: 开始查找输入框');
    
    // 调试信息
    const chatInputEditor = document.querySelector('.chat-input-editor');
    const quillContainers = document.querySelectorAll('.ql-container');
    const quillEditors = document.querySelectorAll('.ql-editor');
    const allContentEditables = document.querySelectorAll('div[contenteditable="true"]');
    
    this.utils.log('Yuanbao: 调试信息');
    this.utils.log(`  - chatInputEditor存在: ${!!chatInputEditor}`);
    this.utils.log(`  - quillContainer数量: ${quillContainers.length}`);
    this.utils.log(`  - quillEditor数量: ${quillEditors.length}`);
    this.utils.log(`  - contentEditable数量: ${allContentEditables.length}`);
    
    // 输出具体的quill编辑器信息
    if (quillEditors.length > 0) {
      this.utils.log('Yuanbao: 找到的ql-editor元素详情:');
      quillEditors.forEach((editor, index) => {
        this.utils.log(`  编辑器 ${index + 1}:`, {
          tagName: editor.tagName,
          className: editor.className,
          contentEditable: editor.contentEditable,
          dataPlaceholder: editor.getAttribute('data-placeholder'),
          placeholder: editor.getAttribute('placeholder'),
          attributes: Array.from(editor.attributes).map(attr => `${attr.name}="${attr.value}"`).join(', ')
        });
      });
    }
    
    // 测试每个选择器并记录结果
    const selectors = this.getInputSelectors();
    this.utils.log('Yuanbao: 测试选择器:');
    
    for (let i = 0; i < selectors.length; i++) {
      const selector = selectors[i];
      const element = document.querySelector(selector);
      this.utils.log(`  选择器 ${i + 1}: "${selector}" -> ${element ? '找到' : '未找到'}`);
      if (element) {
        this.utils.log(`  ✓ 使用选择器 ${i + 1}: "${selector}"`);
        this.utils.log(`Yuanbao: 找到输入框，类型: ${element.tagName} 类名: ${element.className}`);
        return element;
      }
    }
    
    this.utils.log('Yuanbao: 未找到输入框');
    
    // 额外的页面结构调试
    this.utils.log('Yuanbao: 页面结构调试:');
    
    // 查找所有可能的编辑器相关元素
    const possibleEditors = document.querySelectorAll('div, textarea, input');
    const suspiciousElements = Array.from(possibleEditors).filter(el => {
      const className = el.className || '';
      const hasEditableAttr = el.hasAttribute('contenteditable');
      const hasPlaceholder = el.hasAttribute('placeholder') || el.hasAttribute('data-placeholder');
      const hasQuillClass = className.includes('ql-') || className.includes('quill');
      const hasChatClass = className.includes('chat') || className.includes('input') || className.includes('editor');
      
      return hasEditableAttr || hasPlaceholder || hasQuillClass || hasChatClass;
    }).slice(0, 5); // 只取前5个避免过多输出
    
    this.utils.log('Yuanbao: 可疑的编辑器元素 (前5个):');
    suspiciousElements.forEach((el, index) => {
      this.utils.log(`  元素 ${index + 1}:`, {
        tagName: el.tagName,
        className: el.className,
        id: el.id,
        contentEditable: el.contentEditable,
        hasPlaceholder: el.hasAttribute('placeholder'),
        hasDataPlaceholder: el.hasAttribute('data-placeholder'),
        placeholder: el.getAttribute('placeholder') || el.getAttribute('data-placeholder'),
        parentClass: el.parentElement?.className,
        innerHTML: el.innerHTML.substring(0, 100) + (el.innerHTML.length > 100 ? '...' : '')
      });
    });
    
    // 检查是否页面还在加载
    this.utils.log('Yuanbao: 页面加载状态检查:', {
      readyState: document.readyState,
      bodyChildrenCount: document.body?.children.length,
      hasVisibleContent: document.body?.innerText.length > 100
    });
    
    return null;
  }

  /**
   * 获取 Yuanbao 特定的发送按钮选择器
   * @returns {Array<string>} 选择器数组
   */
  getSendButtonSelectors() {
    return [
      '#yuanbao-send-btn',                          // Yuanbao 特有的发送按钮 ID
      'a[id="yuanbao-send-btn"]',                   // 带 ID 的 a 标签
      '.style__send-btn___P9SGw',                   // Yuanbao 特有的样式类
      'a[class*="send-btn"]',                       // 包含 send-btn 的 a 标签
      '.hyc-common-icon.iconfont.icon-send',        // 发送图标的完整类名
      '.icon-send',                                 // 发送图标类
      'a:has(.icon-send)',                          // 包含发送图标的 a 标签
      'a:has(.hyc-common-icon)',                    // 包含通用图标的 a 标签
      '[class*="send-btn"]',                        // 任何包含 send-btn 的元素
      ...super.getSendButtonSelectors()             // 继承父类的通用选择器
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
          
          // 对于 a 标签，尝试多种点击方式
          if (button.tagName.toLowerCase() === 'a') {
            // 先尝试阻止默认行为并手动触发点击
            const clickEvent = new MouseEvent('click', {
              bubbles: true,
              cancelable: true,
              view: window
            });
            button.dispatchEvent(clickEvent);
          } else {
            button.click();
          }
          
          this.utils.log(`${this.siteName}: 点击发送按钮成功`);
          return true;
        } catch (e) {
          this.utils.log(`${this.siteName}: 点击发送按钮失败: ${e.message}`);
        }
      } else {
        this.utils.log(`${this.siteName}: 第 ${attempt} 次未找到可用的发送按钮`);
        
        // 调试信息：输出页面上的可能按钮
        if (attempt === 1) {
          this.debugSendButtons();
        }
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
   * 调试发送按钮信息
   */
  debugSendButtons() {
    this.utils.log(`${this.siteName}: 调试发送按钮信息`);
    
    // 查找所有可能的发送按钮
    const possibleButtons = document.querySelectorAll('a, button, [class*="send"], [id*="send"], .icon-send, [class*="btn"]');
    
    this.utils.log(`${this.siteName}: 找到 ${possibleButtons.length} 个可能的按钮元素`);
    
    Array.from(possibleButtons).slice(0, 10).forEach((btn, index) => {
      this.utils.log(`  按钮 ${index + 1}:`, {
        tagName: btn.tagName,
        id: btn.id,
        className: btn.className,
        textContent: btn.textContent?.trim()?.substring(0, 50),
        disabled: btn.disabled || btn.hasAttribute('disabled'),
        visible: btn.offsetParent !== null,
        innerHTML: btn.innerHTML.substring(0, 100)
      });
    });
  }

  /**
   * Yuanbao 的 Quill 编辑器特殊处理
   */
  async fillContentEditable(element, text) {
    // 检查是否是 Quill 编辑器
    if (element.classList.contains('ql-editor')) {
      try {
        this.utils.log('Yuanbao: Quill编辑器特殊处理');
        
        // 先清空内容
        element.innerHTML = '';
        
        // 聚焦编辑器
        element.focus();
        await this.utils.wait(100);
        
        // 处理包含换行符的文本
        if (text.includes('\n')) {
          this.utils.log('Yuanbao: 检测到换行符，使用特殊处理方式');
          await this.insertTextWithNewlines(element, text);
        } else {
          // 单行文本使用 execCommand
          if (document.execCommand) {
            document.execCommand('insertText', false, text);
          } else {
            element.innerHTML = `<p>${text}</p>`;
          }
        }
        
        // 触发必要的事件
        await this.utils.triggerEvents(element, ['input', 'change', 'keyup', 'text-change']);
      } catch (e) {
        this.utils.log(`Yuanbao: Quill特殊处理失败，使用备用方法: ${e.message}`);
        await this.fallbackTextInsertion(element, text);
      }
    } else {
      // 使用父类的默认处理
      await super.fillContentEditable(element, text);
    }
  }

  /**
   * 插入包含换行符的文本到 Quill 编辑器
   * @param {HTMLElement} element - Quill 编辑器元素
   * @param {string} text - 包含换行符的文本
   */
  async insertTextWithNewlines(element, text) {
    const lines = text.split('\n');
    
    // 方法1：尝试逐行插入
    try {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (document.execCommand) {
          if (line.trim()) {
            document.execCommand('insertText', false, line);
          }
          
          // 如果不是最后一行，插入换行
          if (i < lines.length - 1) {
            // 尝试多种换行插入方式
            if (!document.execCommand('insertLineBreak', false, null)) {
              if (!document.execCommand('insertParagraph', false, null)) {
                // 如果都失败，直接插入 <br> 或创建新段落
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                  const range = selection.getRangeAt(0);
                  const br = document.createElement('br');
                  range.insertNode(br);
                  range.setStartAfter(br);
                  range.collapse(true);
                  selection.removeAllRanges();
                  selection.addRange(range);
                }
              }
            }
          }
        } else {
          throw new Error('execCommand not supported');
        }
        
        // 短暂等待确保DOM更新
        await this.utils.wait(50);
      }
      
      this.utils.log('Yuanbao: 逐行插入文本成功');
    } catch (e) {
      this.utils.log(`Yuanbao: 逐行插入失败，使用HTML格式: ${e.message}`);
      // 方法2：使用HTML格式
      const formattedText = lines.map(line => 
        line.trim() ? `<p>${line}</p>` : '<p><br></p>'
      ).join('');
      element.innerHTML = formattedText;
    }
  }

  /**
   * 备用文本插入方案
   * @param {HTMLElement} element - 编辑器元素
   * @param {string} text - 文本内容
   */
  async fallbackTextInsertion(element, text) {
    const lines = text.split('\n');
    
    // 尝试多种备用方案
    const fallbackMethods = [
      // 方案1：标准的 Quill 段落格式
      () => {
        const formattedText = lines.map(line => 
          line.trim() ? `<p>${this.escapeHtml(line)}</p>` : '<p><br></p>'
        ).join('');
        element.innerHTML = formattedText;
      },
      
      // 方案2：使用 div 标签
      () => {
        const formattedText = lines.map(line => 
          line.trim() ? `<div>${this.escapeHtml(line)}</div>` : '<div><br></div>'
        ).join('');
        element.innerHTML = formattedText;
      },
      
      // 方案3：简单的 br 换行
      () => {
        element.innerHTML = this.escapeHtml(text).replace(/\n/g, '<br>');
      },
      
      // 方案4：纯文本 + textContent
      () => {
        element.textContent = text;
      }
    ];
    
    for (let i = 0; i < fallbackMethods.length; i++) {
      try {
        fallbackMethods[i]();
        this.utils.log(`Yuanbao: 备用方案${i + 1}执行成功`);
        break;
      } catch (e) {
        this.utils.log(`Yuanbao: 备用方案${i + 1}失败: ${e.message}`);
        if (i === fallbackMethods.length - 1) {
          this.utils.log('Yuanbao: 所有备用方案都失败了');
        }
      }
    }
    
    // 触发事件
    await this.utils.triggerEvents(element, ['input', 'change', 'keyup']);
  }

  /**
   * HTML转义函数
   * @param {string} text - 需要转义的文本
   * @returns {string} - 转义后的文本
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// 导出 Yuanbao 处理器
if (typeof module !== 'undefined' && module.exports) {
  module.exports = YuanbaoHandler;
} else {
  window.YuanbaoHandler = YuanbaoHandler;
}
