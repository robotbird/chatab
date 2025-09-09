/**
 * Perplexity 处理器
 */
class PerplexityHandler extends BaseHandler {
  constructor() {
    super('Perplexity');
  }

  getInputSelectors() {
    return [
      '#ask-input',
      'div[data-lexical-editor="true"]',
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"]'
    ];
  }

  getSendButtonSelectors() {
    return [
      'button[data-testid="submit-button"]',
      'button[aria-label*="Submit"]',
      'button[aria-label*="Send"]',
      'button:has(svg[class*="arrow"])',
      'button:has(svg[viewBox*="24"])',
      'button[class*="bg-super"]',
      'button[class*="text-inverse"]',
      ...super.getSendButtonSelectors()
    ];
  }

  /**
   * Perplexity 的 Lexical 编辑器特殊处理
   */
  async fillContentEditable(element, text) {
    // 检查是否是 Lexical 编辑器
    if (element.getAttribute('data-lexical-editor') === 'true' || element.id === 'ask-input') {
      this.utils.log('Perplexity: Lexical编辑器特殊处理');
      
      element.focus();
      
      try {
        // 优先尝试使用 document.execCommand 插入文本
        if (document.execCommand) {
          // 先清空内容
          document.execCommand('selectAll', false, null);
          document.execCommand('delete', false, null);
          
          // 插入文本，让浏览器自动处理换行
          document.execCommand('insertText', false, text);
          this.utils.log('Perplexity: 使用execCommand插入文本成功');
        } else {
          throw new Error('execCommand not supported');
        }
      } catch (e) {
        this.utils.log(`Perplexity: execCommand失败，使用备用方案: ${e.message}`);
        
        try {
          // 备用方案1：模拟用户输入
          element.innerHTML = '';
          element.focus();
          
          // 创建一个文本节点并插入
          const textNode = document.createTextNode(text);
          element.appendChild(textNode);
          
          // 设置光标到末尾
          const range = document.createRange();
          const selection = window.getSelection();
          range.selectNodeContents(element);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
          
          this.utils.log('Perplexity: 使用文本节点插入成功');
        } catch (e2) {
          this.utils.log(`Perplexity: 文本节点插入失败，使用最后备用方案: ${e2.message}`);
          
          // 最后备用方案：使用简单的 <br> 标签处理换行
          element.innerHTML = '';
          const formattedHTML = text.replace(/\n/g, '<br>');
          element.innerHTML = formattedHTML;
        }
      }
      
      // 触发必要的事件
      await this.utils.triggerEvents(element, ['input', 'change', 'keyup', 'paste']);
      
      // 额外触发一个自定义事件
      const customEvent = new Event('input', { bubbles: true });
      setTimeout(() => {
        element.dispatchEvent(customEvent);
      }, 100);
    } else {
      // 使用父类的默认处理
      await super.fillContentEditable(element, text);
    }
  }

  /**
   * Perplexity 专用发送逻辑
   */
  async sendMessage(inputElement) {
    this.utils.log('Perplexity: 开始专用发送流程');
    
    const beforeSendText = this.utils.getInputText(inputElement);
    this.utils.log(`Perplexity: 发送前文本内容长度: ${beforeSendText.length}`);
    
    // 如果没有文本内容，不发送
    if (!beforeSendText || beforeSendText.trim() === '') {
      this.utils.log('Perplexity: 没有文本内容，跳过发送');
      return false;
    }
    
    let retryCount = 0;
    
    while (retryCount < this.maxRetries) {
      retryCount++;
      this.utils.log(`Perplexity: 发送尝试 ${retryCount}/${this.maxRetries}`);
      
      try {
        // 确保输入框处于焦点状态
        inputElement.focus();
        await this.utils.wait(200);
        
        // 优先尝试回车键发送
        this.utils.log('Perplexity: 优先尝试回车键发送');
        await this.utils.triggerKeyboardEvent(inputElement);
        this.utils.log('Perplexity: 回车键事件已触发');
        
        // 等待页面响应
        await this.utils.wait(1500);
        
        // 检查文本框是否清空（判断发送是否成功）
        const afterSendText = this.utils.getInputText(inputElement);
        this.utils.log(`Perplexity: 回车发送后文本内容长度: ${afterSendText.length}`);
        
        if (this.utils.isSendSuccessful(beforeSendText, afterSendText)) {
          this.utils.log('Perplexity: 回车发送成功，文本框已清空或内容明显减少');
          return true;
        } else {
          this.utils.log('Perplexity: 回车发送可能失败，尝试按钮发送作为备用方案');
          
          // 回车发送失败，尝试按钮发送作为备用方案
          const button = this.utils.findAvailableButton(this.getSendButtonSelectors());
          
          if (button) {
            this.utils.log('Perplexity: 点击发送按钮作为备用方案');
            button.click();
            
            // 等待页面响应
            await this.utils.wait(2000);
            
            // 检查按钮发送结果
            const afterButtonSendText = this.utils.getInputText(inputElement);
            this.utils.log(`Perplexity: 按钮发送后文本内容长度: ${afterButtonSendText.length}`);
            
            if (this.utils.isSendSuccessful(beforeSendText, afterButtonSendText)) {
              this.utils.log('Perplexity: 按钮发送成功');
              return true;
            }
          }
          
          // 如果还有重试次数，继续尝试
          if (retryCount < this.maxRetries) {
            this.utils.log(`Perplexity: 准备重试发送，剩余重试次数: ${this.maxRetries - retryCount}`);
            await this.utils.wait(1500);
          } else {
            this.utils.log('Perplexity: 发送失败，已达最大重试次数');
          }
        }
        
      } catch (e) {
        this.utils.log(`Perplexity: 发送尝试${retryCount}失败: ${e.message}`);
        
        if (retryCount < this.maxRetries) {
          await this.utils.wait(1500);
        }
      }
    }
    
    return false;
  }
}

// 导出 Perplexity 处理器
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerplexityHandler;
} else {
  window.PerplexityHandler = PerplexityHandler;
}
