/**
 * Yuanbao 处理器
 */
class YuanbaoHandler extends BaseHandler {
  constructor() {
    super('Yuanbao');
  }

  getInputSelectors() {
    return [
      '.chat-input-editor .ql-editor[contenteditable="true"]',
      'div.ql-editor[contenteditable="true"][data-placeholder*="Ask me anything"]',
      'div.ql-editor.ql-blank[contenteditable="true"]',
      'div.ql-editor[contenteditable="true"]',
      '.ql-editor[contenteditable="true"]',
      '.ql-container .ql-editor[contenteditable="true"]',
      '.chat-input-editor div[contenteditable="true"]',
      'div[contenteditable="true"][data-placeholder*="Ask"]',
      'div[contenteditable="true"][enterkeyhint="send"]',
      'div[contenteditable="true"]'
    ];
  }

  /**
   * 重写查找输入框方法，添加详细调试信息
   */
  findInputElement() {
    this.utils.log('Yuanbao: 开始查找输入框');
    
    // 调试信息
    const chatInputEditor = document.querySelector('.chat-input-editor');
    const quillContainers = document.querySelectorAll('.ql-container');
    const quillEditors = document.querySelectorAll('.ql-editor');
    const allContentEditables = document.querySelectorAll('div[contenteditable="true"]');
    
    this.utils.log('Yuanbao: 调试信息');
    this.utils.log(`  - chatInputEditor存在: ${!!chatInputEditor}`);
    this.utils.log(`  - quillContainer数量: ${quillContainers.length}`);
    this.utils.log(`  - quillEditor数量: ${quillEditors.length}`);
    this.utils.log(`  - contentEditable数量: ${allContentEditables.length}`);
    
    // 输出具体的quill编辑器信息
    if (quillEditors.length > 0) {
      this.utils.log('Yuanbao: 找到的ql-editor元素详情:');
      quillEditors.forEach((editor, index) => {
        this.utils.log(`  编辑器 ${index + 1}:`, {
          tagName: editor.tagName,
          className: editor.className,
          contentEditable: editor.contentEditable,
          dataPlaceholder: editor.getAttribute('data-placeholder'),
          placeholder: editor.getAttribute('placeholder'),
          attributes: Array.from(editor.attributes).map(attr => `${attr.name}="${attr.value}"`).join(', ')
        });
      });
    }
    
    // 测试每个选择器并记录结果
    const selectors = this.getInputSelectors();
    this.utils.log('Yuanbao: 测试选择器:');
    
    for (let i = 0; i < selectors.length; i++) {
      const selector = selectors[i];
      const element = document.querySelector(selector);
      this.utils.log(`  选择器 ${i + 1}: "${selector}" -> ${element ? '找到' : '未找到'}`);
      if (element) {
        this.utils.log(`  ✓ 使用选择器 ${i + 1}: "${selector}"`);
        this.utils.log(`Yuanbao: 找到输入框，类型: ${element.tagName} 类名: ${element.className}`);
        return element;
      }
    }
    
    this.utils.log('Yuanbao: 未找到输入框');
    
    // 额外的页面结构调试
    this.utils.log('Yuanbao: 页面结构调试:');
    
    // 查找所有可能的编辑器相关元素
    const possibleEditors = document.querySelectorAll('div, textarea, input');
    const suspiciousElements = Array.from(possibleEditors).filter(el => {
      const className = el.className || '';
      const hasEditableAttr = el.hasAttribute('contenteditable');
      const hasPlaceholder = el.hasAttribute('placeholder') || el.hasAttribute('data-placeholder');
      const hasQuillClass = className.includes('ql-') || className.includes('quill');
      const hasChatClass = className.includes('chat') || className.includes('input') || className.includes('editor');
      
      return hasEditableAttr || hasPlaceholder || hasQuillClass || hasChatClass;
    }).slice(0, 5); // 只取前5个避免过多输出
    
    this.utils.log('Yuanbao: 可疑的编辑器元素 (前5个):');
    suspiciousElements.forEach((el, index) => {
      this.utils.log(`  元素 ${index + 1}:`, {
        tagName: el.tagName,
        className: el.className,
        id: el.id,
        contentEditable: el.contentEditable,
        hasPlaceholder: el.hasAttribute('placeholder'),
        hasDataPlaceholder: el.hasAttribute('data-placeholder'),
        placeholder: el.getAttribute('placeholder') || el.getAttribute('data-placeholder'),
        parentClass: el.parentElement?.className,
        innerHTML: el.innerHTML.substring(0, 100) + (el.innerHTML.length > 100 ? '...' : '')
      });
    });
    
    // 检查是否页面还在加载
    this.utils.log('Yuanbao: 页面加载状态检查:', {
      readyState: document.readyState,
      bodyChildrenCount: document.body?.children.length,
      hasVisibleContent: document.body?.innerText.length > 100
    });
    
    return null;
  }

  /**
   * Yuanbao 的 Quill 编辑器特殊处理
   */
  async fillContentEditable(element, text) {
    // 检查是否是 Quill 编辑器
    if (element.classList.contains('ql-editor')) {
      try {
        this.utils.log('Yuanbao: Quill编辑器特殊处理');
        
        // 先清空内容
        element.innerHTML = '';
        
        // 聚焦编辑器
        element.focus();
        
        // 尝试使用 document.execCommand 插入文本
        if (document.execCommand) {
          document.execCommand('insertText', false, text);
        } else {
          // 备用方案：使用Quill格式
          const formattedText = text.split('\n').map(line => 
            line ? `<p>${line}</p>` : '<p><br></p>'
          ).join('');
          element.innerHTML = formattedText;
        }
        
        // 触发必要的事件
        await this.utils.triggerEvents(element, ['input', 'change', 'keyup', 'text-change']);
      } catch (e) {
        this.utils.log(`Yuanbao: Quill特殊处理失败，使用备用方法: ${e.message}`);
        // 备用方案：简单的HTML格式
        element.innerHTML = `<p>${text.replace(/\n/g, '</p><p>')}</p>`;
        
        await this.utils.triggerEvents(element, ['input', 'change', 'keyup']);
      }
    } else {
      // 使用父类的默认处理
      await super.fillContentEditable(element, text);
    }
  }
}

// 导出 Yuanbao 处理器
if (typeof module !== 'undefined' && module.exports) {
  module.exports = YuanbaoHandler;
} else {
  window.YuanbaoHandler = YuanbaoHandler;
}
