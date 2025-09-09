/**
 * 基础处理器抽象类
 * 所有网站处理器都应该继承此类
 */
class BaseHandler {
  constructor(siteName) {
    this.siteName = siteName;
    this.utils = window.ChatABUtils;
    this.maxRetries = 5;
  }

  /**
   * 获取网站特定的输入框选择器
   * 子类必须实现此方法
   * @returns {Array<string>} 选择器数组，按优先级排序
   */
  getInputSelectors() {
    throw new Error('getInputSelectors() must be implemented by subclass');
  }

  /**
   * 获取网站特定的发送按钮选择器
   * 子类可以重写此方法
   * @returns {Array<string>} 选择器数组
   */
  getSendButtonSelectors() {
    const { COMMON_SELECTORS } = window.ChatABConstants;
    return COMMON_SELECTORS.SEND_BUTTONS;
  }

  /**
   * 查找输入框
   * @returns {HTMLElement|null}
   */
  findInputElement() {
    const selectors = this.getInputSelectors();
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        this.utils.log(`${this.siteName}: 找到输入框，选择器: ${selector}`);
        return element;
      }
    }
    
    this.utils.log(`${this.siteName}: 未找到输入框`);
    return null;
  }

  /**
   * 填充文本内容到输入框
   * 子类可以重写此方法以处理特殊的编辑器
   * @param {HTMLElement} inputElement - 输入框元素
   * @param {string} text - 要填充的文本
   */
  async fillText(inputElement, text) {
    if (!inputElement || !text) return;

    this.utils.log(`${this.siteName}: 开始填充文本内容: ${text.substring(0, 50)}...`);
    
    inputElement.focus();
    await this.utils.wait(200);

    if (inputElement.tagName.toLowerCase() === 'textarea' || 
        inputElement.tagName.toLowerCase() === 'input') {
      // 处理 textarea 和 input 元素
      await this.fillTextareaInput(inputElement, text);
    } else if (inputElement.getAttribute('contenteditable') === 'true') {
      // 处理 contenteditable 元素
      await this.fillContentEditable(inputElement, text);
    }

    this.utils.log(`${this.siteName}: 文本内容填充完成`);
  }

  /**
   * 填充 textarea 或 input 元素
   * @param {HTMLElement} element - 输入元素
   * @param {string} text - 文本内容
   */
  async fillTextareaInput(element, text) {
    // 先清空内容
    element.value = '';
    element.focus();

    // 模拟真实的输入过程
    for (let i = 0; i < text.length; i++) {
      element.value += text[i];
      
      // 触发输入事件
      const inputEvent = new Event('input', { bubbles: true, cancelable: true });
      Object.defineProperty(inputEvent, 'target', { value: element });
      Object.defineProperty(inputEvent, 'data', { value: text[i] });
      element.dispatchEvent(inputEvent);
      
      // 每10个字符暂停一下，模拟真实输入
      if (i % 10 === 0) {
        await this.utils.wait(10);
      }
    }

    // 触发完整的事件序列
    await this.utils.triggerEvents(element, ['input', 'change', 'keyup', 'compositionend']);

    // 尝试触发React的状态更新
    if (element._valueTracker) {
      element._valueTracker.setValue(text);
    }
  }

  /**
   * 填充 contenteditable 元素
   * @param {HTMLElement} element - contenteditable 元素
   * @param {string} text - 文本内容
   */
  async fillContentEditable(element, text) {
    element.focus();

    try {
      // 优先尝试使用 document.execCommand 插入文本
      if (document.execCommand) {
        // 先清空内容
        document.execCommand('selectAll', false, null);
        document.execCommand('delete', false, null);
        
        // 插入文本
        document.execCommand('insertText', false, text);
        this.utils.log(`${this.siteName}: 使用execCommand插入文本成功`);
      } else {
        throw new Error('execCommand not supported');
      }
    } catch (e) {
      this.utils.log(`${this.siteName}: execCommand失败，使用备用方案: ${e.message}`);
      
      // 备用方案：直接设置innerHTML
      element.innerHTML = text.replace(/\n/g, '<br>');
    }

    // 触发必要的事件
    await this.utils.triggerEvents(element, ['input', 'change', 'keyup']);
  }

  /**
   * 发送消息
   * 子类可以重写此方法以实现特殊的发送逻辑
   * @param {HTMLElement} inputElement - 输入框元素
   * @returns {Promise<boolean>} 发送是否成功
   */
  async sendMessage(inputElement) {
    this.utils.log(`${this.siteName}: 开始发送消息`);
    
    // 先尝试按钮发送
    const buttonSuccess = await this.sendByButton();
    if (buttonSuccess) {
      return true;
    }
    
    // 按钮发送失败，尝试键盘发送
    const keyboardSuccess = await this.sendByKeyboard(inputElement);
    return keyboardSuccess;
  }

  /**
   * 通过按钮发送
   * @returns {Promise<boolean>}
   */
  async sendByButton() {
    const selectors = this.getSendButtonSelectors();
    const button = await this.utils.waitForAvailableButton(selectors);
    
    if (button) {
      try {
        button.click();
        this.utils.log(`${this.siteName}: 点击发送按钮成功`);
        return true;
      } catch (e) {
        this.utils.log(`${this.siteName}: 点击发送按钮失败: ${e.message}`);
      }
    }
    
    return false;
  }

  /**
   * 通过键盘发送
   * @param {HTMLElement} inputElement - 输入框元素
   * @returns {Promise<boolean>}
   */
  async sendByKeyboard(inputElement) {
    if (!inputElement) return false;
    
    try {
      inputElement.focus();
      await this.utils.triggerKeyboardEvent(inputElement);
      this.utils.log(`${this.siteName}: 键盘发送完成`);
      return true;
    } catch (e) {
      this.utils.log(`${this.siteName}: 键盘发送失败: ${e.message}`);
      return false;
    }
  }

  /**
   * 主处理方法
   * @param {string} inputValue - 要发送的文本
   */
  async handle(inputValue) {
    if (!inputValue || !inputValue.trim()) {
      this.utils.log(`${this.siteName}: 没有文本内容`);
      return;
    }

    const inputElement = this.findInputElement();
    if (!inputElement) {
      // 如果没找到输入框，尝试重试
      await this.retryHandle(inputValue);
      return;
    }

    // 填充文本
    await this.fillText(inputElement, inputValue);
    
    // 等待一下再发送
    await this.utils.wait(1000);
    
    // 发送消息
    const success = await this.sendMessage(inputElement);
    
    if (success) {
      this.utils.clearStorage();
    }
  }

  /**
   * 重试处理（当第一次没找到输入框时）
   * @param {string} inputValue - 要发送的文本
   */
  async retryHandle(inputValue) {
    this.utils.log(`${this.siteName}: 二次尝试查找输入框`);
    await this.utils.wait(2000);
    
    const retryInput = this.findInputElement();
    if (retryInput) {
      this.utils.log(`${this.siteName}: 二次尝试找到输入框`);
      await this.fillText(retryInput, inputValue);
      await this.utils.wait(800);
      await this.sendMessage(retryInput);
      this.utils.clearStorage();
    } else {
      this.utils.log(`${this.siteName}: 二次尝试仍然没有找到输入框`);
    }
  }

  /**
   * 调试页面状态（子类可以重写）
   */
  debugPageState() {
    this.utils.log(`${this.siteName}: 页面状态检查`, {
      pageTitle: document.title,
      documentReady: document.readyState,
      bodyExists: !!document.body,
      pageURL: window.location.href
    });
  }
}

// 导出基础处理器类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BaseHandler;
} else {
  window.BaseHandler = BaseHandler;
}
