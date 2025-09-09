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
