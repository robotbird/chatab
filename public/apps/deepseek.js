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

  /**
   * 重写查找输入框方法，添加调试信息
   */
  findInputElement() {
    this.utils.log('DeepSeek: 开始查找输入框');
    
    // 先检查页面上是否有相关元素
    const chatInput = document.querySelector('#chat-input');
    const allTextareas = document.querySelectorAll('textarea');
    const allContentEditables = document.querySelectorAll('div[contenteditable="true"]');
    
    this.utils.log('DeepSeek: 调试信息', {
      chatInput: !!chatInput,
      textareaCount: allTextareas.length,
      contentEditableCount: allContentEditables.length
    });
    
    const inputElement = super.findInputElement();
    
    if (inputElement) {
      this.utils.log(`DeepSeek: 找到输入框，选择器: ${inputElement.className} ${inputElement.tagName}`);
    } else {
      this.utils.log('DeepSeek: 未找到输入框，尝试通用方法');
      // 如果还是找不到，尝试最后的通用方法
      if (allTextareas.length > 0) {
        const fallbackElement = allTextareas[0];
        this.utils.log('DeepSeek: 使用第一个textarea元素作为输入框');
        return fallbackElement;
      } else if (allContentEditables.length > 0) {
        const fallbackElement = allContentEditables[0];
        this.utils.log('DeepSeek: 使用第一个contenteditable元素作为输入框');
        return fallbackElement;
      }
    }
    
    return inputElement;
  }

  /**
   * 创建极简扫描效果
   * @param {HTMLElement} inputElement - 目标输入框
   */
  createScanOverlay(inputElement) {
    // 获取输入框位置和尺寸
    const rect = inputElement.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    // 创建扫描柱（无背景容器）
    const scanBar = document.createElement('div');
    scanBar.id = 'deepseek-scan-bar';
    scanBar.style.cssText = `
      position: absolute;
      top: ${rect.top + scrollTop}px;
      left: ${rect.left + scrollLeft - 2}px;
      width: 2px;
      height: ${rect.height}px;
      background: #00ff41;
      z-index: 10000;
      pointer-events: none;
      opacity: 0;
      animation: simple-scan 0.8s ease-out;
    `;

    // 添加CSS动画
    const style = document.createElement('style');
    style.textContent = `
      @keyframes simple-scan {
        0% { 
          left: ${rect.left + scrollLeft - 2}px; 
          opacity: 0; 
        }
        15% { 
          opacity: 0.8; 
        }
        85% { 
          opacity: 0.8; 
        }
        100% { 
          left: ${rect.left + scrollLeft + rect.width}px; 
          opacity: 0; 
        }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(scanBar);

    return { scanBar, style };
  }

  /**
   * 执行极简扫描动画
   * @param {HTMLElement} inputElement - 目标输入框
   */
  async performScanAnimation(inputElement) {
    this.utils.log('DeepSeek: 开始扫描动画');
    
    const { scanBar, style } = this.createScanOverlay(inputElement);

    // 等待扫描动画完成
    await this.utils.wait(800);

    // 清理动画元素
    setTimeout(() => {
      if (scanBar && scanBar.parentNode) {
        scanBar.parentNode.removeChild(scanBar);
      }
      if (style && style.parentNode) {
        style.parentNode.removeChild(style);
      }
    }, 50);

    this.utils.log('DeepSeek: 扫描动画完成');
  }

  /**
   * 快速填充文本内容
   * @param {HTMLElement} inputElement - 输入框元素
   * @param {string} text - 要填充的文本
   */
  async fastFillContent(inputElement, text) {
    if (!inputElement || !text) return;

    this.utils.log(`DeepSeek: 快速填充内容: "${text}"`);
    
    // 确保输入框获得焦点
    inputElement.focus();
    
    // 清空现有内容
    await this.clearInputContent(inputElement);
    
    // 分批快速填充，营造数据流效果
    const chunks = this.splitTextIntoChunks(text, 10);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      if (inputElement.tagName.toLowerCase() === 'textarea' || inputElement.tagName.toLowerCase() === 'input') {
        inputElement.value += chunk;
        const inputEvent = new Event('input', { bubbles: true });
        inputElement.dispatchEvent(inputEvent);
      } else if (inputElement.contentEditable === 'true') {
        inputElement.textContent += chunk;
        const inputEvent = new Event('input', { bubbles: true });
        inputElement.dispatchEvent(inputEvent);
      }
      
      // 短暂延迟营造数据流感觉
      await this.utils.wait(50);
    }

    // 触发最终的事件确保状态同步
    await this.triggerFinalEvents(inputElement);
    
    this.utils.log('DeepSeek: 快速填充完成');
  }

  /**
   * 将文本分割成块
   * @param {string} text 
   * @param {number} chunkSize 
   * @returns {string[]}
   */
  splitTextIntoChunks(text, chunkSize) {
    const chunks = [];
    for (let i = 0; i < text.length; i += chunkSize) {
      chunks.push(text.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * 清空输入框内容
   * @param {HTMLElement} inputElement 
   */
  async clearInputContent(inputElement) {
    if (inputElement.tagName.toLowerCase() === 'textarea' || inputElement.tagName.toLowerCase() === 'input') {
      // 对于普通输入框，先选中所有内容再删除
      inputElement.select();
      document.execCommand('delete');
      inputElement.value = '';
    } else if (inputElement.contentEditable === 'true') {
      // 对于contenteditable，使用execCommand清空
      inputElement.focus();
      document.execCommand('selectAll');
      document.execCommand('delete');
    }
    
    // 触发change事件
    const changeEvent = new Event('change', { bubbles: true });
    inputElement.dispatchEvent(changeEvent);
  }


  /**
   * 触发最终事件确保状态同步
   * @param {HTMLElement} inputElement 
   */
  async triggerFinalEvents(inputElement) {
    const finalEvents = ['input', 'change', 'blur', 'focus'];
    for (const eventType of finalEvents) {
      const event = new Event(eventType, { bubbles: true });
      inputElement.dispatchEvent(event);
      await this.utils.wait(10);
    }
  }

  /**
   * 重写填充文本方法，使用扫描效果
   * @param {HTMLElement} inputElement - 输入框元素
   * @param {string} text - 要填充的文本
   */
  async fillText(inputElement, text) {
    // 执行扫描动画
    await this.performScanAnimation(inputElement);
    
    // 快速填充内容
    await this.fastFillContent(inputElement, text);
  }

  /**
   * 获取 DeepSeek 特定的发送按钮选择器
   * @returns {Array<string>} 选择器数组
   */
  getSendButtonSelectors() {
    return [
      // DeepSeek 特有的发送按钮选择器（基于提供的HTML结构）
      'div[role="button"][aria-disabled="false"] .ds-icon', // 包含ds-icon的按钮
      'div[role="button"] svg',                      // 发送按钮内的 SVG 图标
      'div[class*="ds-icon"]',                       // ds-icon 类
      'button[class*="send"]',                       // 包含 send 的按钮
      ...super.getSendButtonSelectors()              // 继承父类的通用选择器
    ];
  }

  /**
   * 重写发送消息方法，DeepSeek优先使用回车键发送
   * @param {HTMLElement} inputElement - 输入框元素
   * @returns {Promise<boolean>} 发送是否成功
   */
  async sendMessage(inputElement) {
    this.utils.log(`${this.siteName}: 开始发送消息`);
    
    // DeepSeek优先尝试键盘发送（回车键）
    this.utils.log(`${this.siteName}: 优先尝试回车键发送`);
    const keyboardSuccess = await this.sendByKeyboard(inputElement);
    if (keyboardSuccess) {
      return true;
    }
    
    // 键盘发送失败，尝试按钮发送
    this.utils.log(`${this.siteName}: 回车键发送失败，尝试按钮发送`);
    const buttonSuccess = await this.sendByButtonWithRetry(2);
    return buttonSuccess;
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
}

// 导出 DeepSeek 处理器
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DeepSeekHandler;
} else {
  window.DeepSeekHandler = DeepSeekHandler;
}
