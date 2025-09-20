/**
 * Doubao 处理器
 */
class DoubaoHandler extends BaseHandler {
  constructor() {
    super('Doubao');
  }

  getInputSelectors() {
    return [
      'textarea[data-testid="chat_input_input"]',
      'textarea.semi-input-textarea',
      'textarea[placeholder*="发消息"]',
      'textarea[placeholder*="输入"]',
      'div[contenteditable="true"]',
      'textarea'
    ];
  }

  getSendButtonSelectors() {
    return [
      'button[data-testid="chat_input_send_button"]',
      '[data-testid*="send"]',
      '[aria-label*="发送"]',
      '[aria-label*="Send"]',
      '[title*="发送"]',
      '[title*="Send"]',
      'button:has(svg)',
      'button[class*="send"]',
      'button[class*="submit"]',
      '[role="button"][aria-label*="发送"]',
      '[role="button"][aria-label*="Send"]',
      ...super.getSendButtonSelectors()
    ];
  }

  /**
   * 等待页面加载完成
   */
  async waitForPageLoad() {
    // 等待DOM完全加载
    if (document.readyState !== 'complete') {
      await new Promise(resolve => {
        if (document.readyState === 'complete') {
          resolve();
        } else {
          window.addEventListener('load', resolve, { once: true });
        }
      });
    }
    
    // 额外等待一段时间，确保React/Vue等框架渲染完成
    await this.utils.wait(1000);
    
    // 等待Doubao输入框加载
    let retries = 0;
    const maxRetries = 10;
    
    while (retries < maxRetries) {
      const inputElements = document.querySelectorAll('textarea[data-testid="chat_input_input"], textarea.semi-input-textarea');
      if (inputElements.length > 0) {
        break;
      }
      
      await this.utils.wait(500);
      retries++;
    }
  }

  /**
   * 重写查找输入框方法，添加页面加载等待
   */
  async findInputElement() {
    // 等待页面加载完成
    await this.waitForPageLoad();
    
    return super.findInputElement();
  }

  /**
   * Doubao 专用发送逻辑，优先使用回车键
   */
  async sendMessage(inputElement) {
    this.utils.log('Doubao: 开始专用发送流程');
    
    const beforeSendText = this.utils.getInputText(inputElement);
    this.utils.log(`Doubao: 发送前文本内容长度: ${beforeSendText.length}`);
    
    // 如果没有文本内容，不发送
    if (!beforeSendText || beforeSendText.trim() === '') {
      this.utils.log('Doubao: 没有文本内容，跳过发送');
      return false;
    }
    
    let retryCount = 0;
    
    while (retryCount < this.maxRetries) {
      retryCount++;
      this.utils.log(`Doubao: 发送尝试 ${retryCount}/${this.maxRetries}`);
      
      try {
        // 确保输入框处于焦点状态
        inputElement.focus();
        await this.utils.wait(200);
        
        // 优先尝试回车键发送（类似ChatGPT）
        this.utils.log('Doubao: 优先尝试回车键发送');
        await this.utils.triggerKeyboardEvent(inputElement);
        this.utils.log('Doubao: 回车键事件已触发');
        
        // 等待页面响应
        await this.utils.wait(2000);
        
        // 检查文本框是否清空（判断发送是否成功）
        const afterSendText = this.utils.getInputText(inputElement);
        this.utils.log(`Doubao: 回车发送后文本内容长度: ${afterSendText.length}`);
        
        if (this.utils.isSendSuccessful(beforeSendText, afterSendText)) {
          this.utils.log('Doubao: 回车发送成功，文本框已清空或内容明显减少');
          return true;
        } else {
          this.utils.log('Doubao: 回车发送可能失败，尝试按钮发送作为备用方案');
          
          // 回车发送失败，尝试按钮发送作为备用方案
          const button = this.utils.findAvailableButton(this.getSendButtonSelectors());
          
          if (button) {
            this.utils.log('Doubao: 点击发送按钮作为备用方案');
            button.click();
            
            // 等待页面响应
            await this.utils.wait(2000);
            
            // 检查按钮发送结果
            const afterButtonSendText = this.utils.getInputText(inputElement);
            this.utils.log(`Doubao: 按钮发送后文本内容长度: ${afterButtonSendText.length}`);
            
            if (this.utils.isSendSuccessful(beforeSendText, afterButtonSendText)) {
              this.utils.log('Doubao: 按钮发送成功');
              return true;
            }
          }
          
          // 如果还有重试次数，继续尝试
          if (retryCount < this.maxRetries) {
            this.utils.log(`Doubao: 准备重试发送，剩余重试次数: ${this.maxRetries - retryCount}`);
            await this.utils.wait(1500);
          } else {
            this.utils.log('Doubao: 发送失败，已达最大重试次数');
          }
        }
        
      } catch (e) {
        this.utils.log(`Doubao: 发送尝试${retryCount}失败: ${e.message}`);
        
        if (retryCount < this.maxRetries) {
          await this.utils.wait(1500);
        }
      }
    }
    
    return false;
  }
}

// 导出 Doubao 处理器
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DoubaoHandler;
} else {
  window.DoubaoHandler = DoubaoHandler;
}
