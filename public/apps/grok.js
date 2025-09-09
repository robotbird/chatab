/**
 * Grok 处理器
 */
class GrokHandler extends BaseHandler {
  constructor() {
    super('Grok');
  }

  getInputSelectors() {
    return [
      'div.tiptap.ProseMirror[contenteditable="true"]',
      'div.ProseMirror[contenteditable="true"].w-full',
      'div.tiptap[contenteditable="true"]',
      'div.ProseMirror[contenteditable="true"]',
      'div[contenteditable="true"][data-placeholder*="What do you want to know?"]',
      'div[contenteditable="true"].w-full.px-2',
      'div[contenteditable="true"][translate="no"]',
      // 备用方案：尝试旧的textarea选择器
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
   * 重写查找输入框方法，添加调试信息
   */
  findInputElement() {
    this.utils.log('Grok: 开始查找输入框 (TipTap ProseMirror)');
    
    // 调试信息
    const allTextareas = document.querySelectorAll('textarea');
    const allContentEditables = document.querySelectorAll('div[contenteditable="true"]');
    const tiptapElements = document.querySelectorAll('.tiptap');
    const proseMirrorElements = document.querySelectorAll('.ProseMirror');
    
    this.utils.log('Grok: 调试信息', {
      textareaCount: allTextareas.length,
      contentEditableCount: allContentEditables.length,
      tiptapCount: tiptapElements.length,
      proseMirrorCount: proseMirrorElements.length
    });
    
    const inputElement = super.findInputElement();
    
    if (inputElement) {
      this.utils.log(`Grok: 找到输入框，类型: ${inputElement.tagName} 类名: ${inputElement.className}`);
      this.utils.log('Grok: 输入框属性:', {
        contentEditable: inputElement.contentEditable,
        dataPlaceholder: inputElement.getAttribute('data-placeholder'),
        translate: inputElement.getAttribute('translate'),
        classList: Array.from(inputElement.classList)
      });
    } else {
      this.utils.log('Grok: 未找到输入框');
    }
    
    return inputElement;
  }

  /**
   * Grok 的 TipTap ProseMirror 编辑器特殊处理
   */
  async fillContentEditable(element, text) {
    // 检查是否是TipTap ProseMirror编辑器
    if (element.classList.contains('tiptap') || element.classList.contains('ProseMirror')) {
      this.utils.log('Grok: TipTap ProseMirror编辑器特殊处理');
      
      // 先清空内容
      element.innerHTML = '';
      element.focus();
      
      if (document.execCommand) {
        try {
          document.execCommand('insertText', false, text);
          this.utils.log('Grok: 使用execCommand插入文本成功');
        } catch (e) {
          this.utils.log(`Grok: execCommand失败: ${e.message}`);
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
    const paragraphs = text.split('\n');
    let formattedHTML = '';
    
    paragraphs.forEach((paragraph, index) => {
      if (paragraph.trim() === '') {
        formattedHTML += '<p data-placeholder="What do you want to know?" class="is-empty is-editor-empty"><br class="ProseMirror-trailingBreak"></p>';
      } else {
        formattedHTML += `<p>${paragraph}</p>`;
      }
    });
    
    element.innerHTML = formattedHTML;
    
    // 移除placeholder相关的类
    if (text.trim()) {
      const firstP = element.querySelector('p');
      if (firstP) {
        firstP.classList.remove('is-empty', 'is-editor-empty');
        firstP.removeAttribute('data-placeholder');
      }
    }
  }
}

// 导出 Grok 处理器
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GrokHandler;
} else {
  window.GrokHandler = GrokHandler;
}
