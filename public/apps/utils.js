// 通用工具函数
class ChatABUtils {
  /**
   * 等待指定时间
   * @param {number} ms - 毫秒数
   * @returns {Promise}
   */
  static wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 检测网站类型
   * @param {string} hostname - 当前网站的hostname
   * @returns {string|null} - 网站类型或null
   */
  static detectSite(hostname) {
    const { SUPPORTED_SITES } = window.ChatABConstants;
    
    for (const [key, config] of Object.entries(SUPPORTED_SITES)) {
      if (hostname.includes(config.hostname)) {
        return key;
      }
    }
    return null;
  }

  /**
   * 获取输入框内容
   * @param {HTMLElement} element - 输入框元素
   * @returns {string} - 输入框内容
   */
  static getInputText(element) {
    if (!element) return '';
    
    if (element.value !== undefined) {
      return element.value; // textarea or input
    } else if (element.textContent !== undefined) {
      return element.textContent.trim(); // contenteditable div
    } else if (element.innerText !== undefined) {
      return element.innerText.trim(); // 其他元素
    }
    return '';
  }

  /**
   * 触发输入事件序列
   * @param {HTMLElement} element - 目标元素
   * @param {Array<string>} eventTypes - 事件类型数组
   */
  static async triggerEvents(element, eventTypes = ['input', 'change', 'keyup']) {
    if (!element) return;
    
    for (const eventType of eventTypes) {
      const event = new Event(eventType, { bubbles: true, cancelable: true });
      Object.defineProperty(event, 'target', { value: element });
      element.dispatchEvent(event);
      await this.wait(50);
    }
  }

  /**
   * 触发键盘事件
   * @param {HTMLElement} element - 目标元素
   * @param {string} key - 按键
   * @param {number} keyCode - 键码
   */
  static async triggerKeyboardEvent(element, key = 'Enter', keyCode = 13) {
    if (!element) return;
    
    const eventTypes = ['keydown', 'keypress', 'keyup'];
    
    for (const eventType of eventTypes) {
      const event = new KeyboardEvent(eventType, {
        key,
        code: key,
        keyCode,
        which: keyCode,
        bubbles: true,
        cancelable: true
      });
      element.dispatchEvent(event);
      await this.wait(50);
    }
  }

  /**
   * 查找可用的发送按钮
   * @param {Array<string>} selectors - 选择器数组
   * @param {number} maxButtons - 最大检查按钮数量
   * @returns {HTMLElement|null} - 可用的按钮或null
   */
  static findAvailableButton(selectors, maxButtons = 5) {
    const buttons = [];
    
    // 收集所有匹配的按钮
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      buttons.push(...Array.from(elements));
    });
    
    // 去重并检查可用性
    const uniqueButtons = [...new Set(buttons)];
    
    for (let i = 0; i < Math.min(uniqueButtons.length, maxButtons); i++) {
      const btn = uniqueButtons[i];
      const isDisabled = btn.disabled || 
                        btn.hasAttribute('disabled') || 
                        btn.classList.contains('disabled') ||
                        btn.getAttribute('aria-disabled') === 'true' ||
                        window.getComputedStyle(btn).pointerEvents === 'none';
      
      if (!isDisabled && btn.offsetParent !== null) {
        return btn;
      }
    }
    
    return null;
  }

  /**
   * 等待按钮变为可用状态
   * @param {Array<string>} selectors - 选择器数组
   * @param {number} maxWaitTime - 最大等待时间（次数）
   * @param {number} interval - 检查间隔（毫秒）
   * @returns {Promise<HTMLElement|null>}
   */
  static async waitForAvailableButton(selectors, maxWaitTime = 10, interval = 800) {
    for (let i = 0; i < maxWaitTime; i++) {
      const button = this.findAvailableButton(selectors);
      if (button) {
        return button;
      }
      
      console.log(`ChatAB: 等待按钮可用，第 ${i + 1}/${maxWaitTime} 次检查`);
      await this.wait(interval);
    }
    
    return null;
  }

  /**
   * 清空Chrome存储
   */
  static clearStorage() {
    setTimeout(() => {
      chrome.storage.local.remove(['inputValue']);
      console.log('ChatAB: 清空 storage');
    }, 1000);
  }

  /**
   * 日志输出
   * @param {string} message - 日志信息
   * @param {string} level - 日志级别
   */
  static log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`ChatAB [${timestamp}]: ${message}`);
  }

  /**
   * 检查文本是否发送成功（通过内容变化判断）
   * @param {string} beforeText - 发送前的文本
   * @param {string} afterText - 发送后的文本
   * @returns {boolean} - 是否发送成功
   */
  static isSendSuccessful(beforeText, afterText) {
    const textCleared = afterText.length === 0 || afterText.trim() === '';
    const textReduced = afterText.length < beforeText.length * 0.8; // 内容减少了80%以上
    return textCleared || textReduced;
  }
}

// 导出工具类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChatABUtils;
} else {
  window.ChatABUtils = ChatABUtils;
}
