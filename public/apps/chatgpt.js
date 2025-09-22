/**
 * ChatGPT 处理器
 */
class ChatGPTHandler extends BaseHandler {
  constructor() {
    super('ChatGPT');
  }

  getInputSelectors() {
    return [
      '#prompt-textarea',
      'div.ProseMirror[contenteditable="true"]',
      'textarea[data-id="root"]',
      'textarea[placeholder*="Message"]',
      'textarea[placeholder*="message"]',
      'div[contenteditable="true"]'
    ];
  }

  getSendButtonSelectors() {
    return [
      '[data-testid="send-button"]',
      'button[aria-label*="Send"]',
      'button[title*="Send"]',
      ...super.getSendButtonSelectors()
    ];
  }

  /**
   * ChatGPT 特殊的 contenteditable 填充逻辑
   */
  async fillContentEditable(element, text) {
    element.focus();
    await this.utils.wait(200);

    // 检查是否是ProseMirror编辑器
    if (element.classList.contains('ProseMirror') || element.id === 'prompt-textarea') {
      this.utils.log('ChatGPT: 检测到ProseMirror编辑器，使用p标签格式');
      
      const paragraphs = text.split('\n');
      let formattedHTML = '';
      
      paragraphs.forEach((paragraph) => {
        if (paragraph.trim() === '') {
          // 空行处理
          formattedHTML += '<p><br class="ProseMirror-trailingBreak"></p>';
        } else {
          // 非空行处理
          formattedHTML += `<p>${paragraph}</p>`;
        }
      });
      
      element.innerHTML = formattedHTML;
    } else {
      // 使用父类的默认处理
      await super.fillContentEditable(element, text);
    }

    // 触发输入事件
    const inputEvent = new Event('input', { bubbles: true });
    element.dispatchEvent(inputEvent);
  }

  /**
   * 重写填充文本方法，使用扫描效果
   * @param {HTMLElement} inputElement - 输入框元素
   * @param {string} text - 要填充的文本
   */
  async fillText(inputElement, text) {
    // 使用扫描效果填充文本
    await this.utils.fillTextWithScan(inputElement, text, 'ChatGPT', async (element, content) => {
      // 执行实际的文本填充
      if (element.tagName.toLowerCase() === 'textarea' || element.tagName.toLowerCase() === 'input') {
        await super.fillTextarea(element, content);
      } else if (element.contentEditable === 'true') {
        await this.fillContentEditable(element, content);
      }
    });
  }

  /**
   * ChatGPT 专用发送逻辑，优先使用回车键
   */
  async sendMessage(inputElement) {
    this.utils.log('ChatGPT: 开始专用发送流程');
    
    const beforeSendText = this.utils.getInputText(inputElement);
    this.utils.log(`ChatGPT: 发送前文本内容长度: ${beforeSendText.length}`);
    
    let retryCount = 0;
    
    while (retryCount < this.maxRetries) {
      retryCount++;
      this.utils.log(`ChatGPT: 发送尝试 ${retryCount}/${this.maxRetries}`);
      
      try {
        // 确保输入框处于焦点状态
        inputElement.focus();
        await this.utils.wait(200);
        
        // 触发回车键事件
        await this.utils.triggerKeyboardEvent(inputElement);
        this.utils.log('ChatGPT: 回车键事件已触发');
        
        // 等待页面响应
        await this.utils.wait(1500);
        
        // 检查文本框是否清空（判断发送是否成功）
        const afterSendText = this.utils.getInputText(inputElement);
        this.utils.log(`ChatGPT: 发送后文本内容长度: ${afterSendText.length}`);
        
        if (this.utils.isSendSuccessful(beforeSendText, afterSendText)) {
          this.utils.log('ChatGPT: 发送成功，文本框已清空或内容明显减少');
          return true;
        } else {
          this.utils.log('ChatGPT: 发送可能失败，文本框仍有内容');
          
          if (retryCount < this.maxRetries) {
            this.utils.log(`ChatGPT: 准备重试发送，剩余重试次数: ${this.maxRetries - retryCount}`);
            await this.utils.wait(1000);
          }
        }
        
      } catch (e) {
        this.utils.log(`ChatGPT: 发送尝试${retryCount}失败: ${e.message}`);
        
        if (retryCount < this.maxRetries) {
          await this.utils.wait(1000);
        }
      }
    }
    
    // 所有重试失败，尝试备用方案（点击发送按钮）
    this.utils.log('ChatGPT: 回车发送失败，尝试备用方案');
    const buttonSuccess = await this.sendByButton();
    
    if (buttonSuccess) {
      // 等待并检查发送结果
      await this.utils.wait(1500);
      const finalText = this.utils.getInputText(inputElement);
      if (finalText.length === 0 || finalText.trim() === '') {
        this.utils.log('ChatGPT: 备用方案发送成功');
        return true;
      }
    }
    
    return false;
  }
}

// 导出 ChatGPT 处理器
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ChatGPTHandler;
} else {
  window.ChatGPTHandler = ChatGPTHandler;
}
