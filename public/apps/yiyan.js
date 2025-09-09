/**
 * Yiyan 处理器
 */
class YiyanHandler extends BaseHandler {
  constructor() {
    super('Yiyan');
  }

  getInputSelectors() {
    return [
      '.yc-editor[contenteditable="true"][data-lexical-editor="true"]',
      'div.yc-editor[contenteditable="true"]',
      '.yc-editor[role="textbox"]',
      'div[placeholder*="How can I help you?"][contenteditable="true"]',
      'div[data-lexical-editor="true"][role="textbox"]',
      '.yc-editor',
      'div[contenteditable="true"][role="textbox"]',
      'div[contenteditable="true"]'
    ];
  }

  /**
   * 重写调试页面状态方法，添加Yiyan特定的调试信息
   */
  debugPageState() {
    this.utils.log('Yiyan: 页面详细状态检查:', {
      pageTitle: document.title,
      documentReady: document.readyState,
      bodyExists: !!document.body,
      pageURL: window.location.href,
      userAgent: navigator.userAgent,
      elementCounts: {
        allDivs: document.querySelectorAll('div').length,
        allTextareas: document.querySelectorAll('textarea').length,
        contentEditables: document.querySelectorAll('[contenteditable="true"]').length,
        ycEditors: document.querySelectorAll('.yc-editor').length,
        lexicalEditors: document.querySelectorAll('[data-lexical-editor="true"]').length
      }
    });
  }

  /**
   * 重写查找输入框方法，添加调试信息
   */
  findInputElement() {
    this.utils.log('Yiyan: 开始查找输入框');
    
    // 调试信息
    const ycEditorContainer = document.querySelector('.yc-editor-container');
    const ycEditorWrapper = document.querySelector('.yc-editor-wrapper');
    const ycEditors = document.querySelectorAll('.yc-editor');
    const allContentEditables = document.querySelectorAll('div[contenteditable="true"]');
    const allLexicalEditors = document.querySelectorAll('div[data-lexical-editor="true"]');
    
    this.utils.log('Yiyan: 调试信息', {
      ycEditorContainer: !!ycEditorContainer,
      ycEditorWrapper: !!ycEditorWrapper,
      ycEditorCount: ycEditors.length,
      contentEditableCount: allContentEditables.length,
      lexicalEditorCount: allLexicalEditors.length
    });
    
    const inputElement = super.findInputElement();
    
    if (inputElement) {
      this.utils.log(`Yiyan: 找到输入框，类型: ${inputElement.tagName} 类名: ${inputElement.className}`);
    } else {
      this.utils.log('Yiyan: 未找到输入框');
      // 额外的调试信息
      this.utils.log('Yiyan: 页面当前DOM快照:', {
        pageTitle: document.title,
        bodyHTML: document.body ? document.body.innerHTML.substring(0, 500) + '...' : 'No body',
        allClasses: Array.from(document.querySelectorAll('*')).map(el => el.className).filter(c => c).slice(0, 20),
        suspiciousElements: Array.from(document.querySelectorAll('div, textarea, input')).map(el => ({
          tag: el.tagName,
          id: el.id,
          className: el.className,
          placeholder: el.placeholder || el.getAttribute('placeholder'),
          contenteditable: el.contentEditable,
          dataAttrs: Array.from(el.attributes).filter(attr => attr.name.startsWith('data-')).map(attr => `${attr.name}=${attr.value}`)
        })).slice(0, 10)
      });
    }
    
    return inputElement;
  }

  /**
   * Yiyan 的 Lexical 编辑器特殊处理
   */
  async fillContentEditable(element, text) {
    // 检查是否是 Lexical 编辑器
    if (element.getAttribute('data-lexical-editor') === 'true') {
      try {
        this.utils.log('Yiyan: Lexical编辑器特殊处理');
        
        // 先清空内容
        element.innerHTML = '';
        
        // 使用简化的文本插入方式
        element.focus();
        
        // 尝试使用 document.execCommand 插入文本
        if (document.execCommand) {
          document.execCommand('insertText', false, text);
        } else {
          // 备用方案：直接设置textContent
          element.textContent = text;
        }
        
        // 触发必要的事件
        await this.utils.triggerEvents(element, ['input', 'change', 'keyup']);
      } catch (e) {
        this.utils.log(`Yiyan: Lexical特殊处理失败，使用备用方法: ${e.message}`);
        // 备用方案：使用Lexical格式
        const formattedText = text.split('\n').map(line => 
          `<p dir="ltr"><span data-lexical-text="true">${line || '<br>'}</span></p>`
        ).join('');
        element.innerHTML = formattedText;
        
        await this.utils.triggerEvents(element, ['input', 'change', 'keyup']);
      }
    } else {
      // 使用父类的默认处理
      await super.fillContentEditable(element, text);
    }
  }

  /**
   * 重写重试处理，添加Yiyan特定的Lexical处理
   */
  async retryHandle(inputValue) {
    this.utils.log('Yiyan: 二次尝试查找输入框');
    await this.utils.wait(2000);
    
    const retryInput = this.findInputElement();
    if (retryInput) {
      this.utils.log('Yiyan: 二次尝试找到输入框');
      
      // 特殊处理Yiyan的Lexical编辑器
      if (retryInput.getAttribute('data-lexical-editor') === 'true') {
        this.utils.log('Yiyan: 二次尝试 - Lexical编辑器特殊处理');
        if (document.execCommand) {
          document.execCommand('insertText', false, inputValue);
        } else {
          // 使用简单的Lexical格式
          const formattedText = inputValue.split('\n').map(line => 
            line.trim() ? `<p dir="ltr"><span data-lexical-text="true">${line}</span></p>` : '<p dir="ltr"><br></p>'
          ).join('');
          retryInput.innerHTML = formattedText;
        }
        
        // 触发Lexical特定事件
        await this.utils.triggerEvents(retryInput, ['input', 'change', 'keyup']);
      } else {
        await this.fillText(retryInput, inputValue);
      }
      
      await this.utils.wait(800);
      await this.sendMessage(retryInput);
      this.utils.clearStorage();
    } else {
      this.utils.log('Yiyan: 二次尝试仍然没有找到输入框');
    }
  }
}

// 导出 Yiyan 处理器
if (typeof module !== 'undefined' && module.exports) {
  module.exports = YiyanHandler;
} else {
  window.YiyanHandler = YiyanHandler;
}
