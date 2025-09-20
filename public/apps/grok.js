/**
 * Grok 处理器
 */
class GrokHandler extends BaseHandler {
  constructor() {
    super('Grok');
  }

  getInputSelectors() {
    return [
      // 基于调试日志，选择器5成功匹配了！把它放在最前面
      'div[contenteditable="true"].tiptap.ProseMirror.w-full',
      // 其他有效的简化选择器
      'div.tiptap.ProseMirror[contenteditable="true"]',
      'div[contenteditable="true"].tiptap.ProseMirror',
      'div.ProseMirror[contenteditable="true"].w-full',
      'div[contenteditable="true"].ProseMirror.w-full',
      'div.tiptap[contenteditable="true"].w-full',
      'div[contenteditable="true"].tiptap.w-full',
      // 基于属性的选择器
      'div[contenteditable="true"][data-placeholder*="What do you want to know?"]',
      'div[contenteditable="true"][translate="no"].tiptap',
      'div[contenteditable="true"][translate="no"].ProseMirror',
      'div[contenteditable="true"].w-full.px-2',
      'div[contenteditable="true"].text-primary',
      'div[contenteditable="true"].prose',
      // 通用选择器
      'div.tiptap[contenteditable="true"]',
      'div.ProseMirror[contenteditable="true"]',
      'div[contenteditable="true"][translate="no"]',
      // 备用方案：textarea选择器
      'textarea[aria-label*="Ask Grok anything"]',
      'textarea[aria-label*="Ask Grok"]',
      'textarea[aria-label*="Grok"]',
      'textarea.w-full.bg-transparent',
      'textarea[dir="auto"]',
      'textarea[placeholder*="Ask me anything"]',
      'textarea[placeholder*="输入"]',
      'div[contenteditable="true"]',
      'textarea'
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
    
    // 等待TipTap编辑器加载
    let retries = 0;
    const maxRetries = 10;
    
    while (retries < maxRetries) {
      const tiptapElements = document.querySelectorAll('.tiptap.ProseMirror[contenteditable="true"]');
      if (tiptapElements.length > 0) {
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
    
    // 手动查找并验证输入框
    const selectors = this.getInputSelectors();
    let inputElement = null;
    
    for (let i = 0; i < selectors.length; i++) {
      const selector = selectors[i];
      const elements = document.querySelectorAll(selector);
      
      if (elements.length > 0) {
        // 检查每个找到的元素
        for (let j = 0; j < elements.length; j++) {
          const element = elements[j];
          const isVisible = this.utils.isElementVisible(element);
          const rect = element.getBoundingClientRect();
          
          // 选择第一个可见的元素
          if (isVisible && rect.width > 0 && rect.height > 0 && !inputElement) {
            inputElement = element;
            break;
          }
        }
        
        // 如果找到了可见元素，就停止搜索
        if (inputElement) {
          break;
        }
      }
    }
    
    return inputElement;
  }

  /**
   * Grok 的 TipTap ProseMirror 编辑器特殊处理
   */
  async fillContentEditable(element, text) {
    // 检查是否是TipTap ProseMirror编辑器
    if (element.classList.contains('tiptap') || element.classList.contains('ProseMirror')) {
      // 先清空内容
      element.innerHTML = '';
      element.focus();
      
      if (document.execCommand) {
        try {
          document.execCommand('insertText', false, text);
        } catch (e) {
          this.fillGrokTipTapFormat(element, text);
        }
      } else {
        this.fillGrokTipTapFormat(element, text);
      }
      
      // 触发TipTap特定事件
      await this.utils.triggerEvents(element, ['input', 'change', 'keyup']);
    } else {
      // 使用父类的默认处理
      await super.fillContentEditable(element, text);
    }
  }

  /**
   * 使用Grok TipTap格式填充文本
   */
  fillGrokTipTapFormat(element, text) {
    // 先清空所有内容
    element.innerHTML = '';
    
    if (!text.trim()) {
      // 如果是空文本，创建空的placeholder段落
      element.innerHTML = '<p data-placeholder="What do you want to know?" class="is-empty is-editor-empty"><br class="ProseMirror-trailingBreak"></p>';
      return;
    }
    
    const paragraphs = text.split('\n');
    let formattedHTML = '';
    
    paragraphs.forEach((paragraph, index) => {
      if (paragraph.trim() === '') {
        formattedHTML += '<p><br class="ProseMirror-trailingBreak"></p>';
      } else {
        formattedHTML += `<p>${this.utils.escapeHtml(paragraph)}</p>`;
      }
    });
    
    element.innerHTML = formattedHTML;
    
    // 确保移除placeholder相关的类和属性
    const allPs = element.querySelectorAll('p');
    allPs.forEach(p => {
      p.classList.remove('is-empty', 'is-editor-empty');
      p.removeAttribute('data-placeholder');
    });
  }
}

// 导出 Grok 处理器
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GrokHandler;
} else {
  window.GrokHandler = GrokHandler;
}
