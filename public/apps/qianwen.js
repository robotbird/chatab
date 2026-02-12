/**
 * Qianwen 处理器
 * 千问使用 Slate.js 富文本编辑器，需要特殊的输入处理
 */
class QianwenHandler extends BaseHandler {
  constructor() {
    super('Qianwen');
  }

  getInputSelectors() {
    return [
      // 新版 Slate 编辑器 (contenteditable)
      'div[data-slate-editor="true"][contenteditable="true"]',
      'div[data-slate-editor="true"]',
      'div[role="textbox"][data-slate-editor="true"]',
      // Slate 编辑器外层容器内的 contenteditable
      'div.slateEditorWrapper-yF7NWU div[contenteditable="true"]',
      'div[class*="slateEditorWrapper"] div[contenteditable="true"]',
      // chatInput 区域内的 contenteditable
      'div[class*="chatInput"] div[contenteditable="true"]',
      'div[class*="chatTextarea"] div[contenteditable="true"]',
      // 通用 contenteditable
      'div[contenteditable="true"][data-placeholder="向千问提问"]',
      'div[contenteditable="true"][data-placeholder*="千问"]',
      // 旧版 textarea 兼容
      'textarea[placeholder="向千问提问"]',
      'textarea.ant-input-outlined[maxlength="200000"]',
      'textarea.ant-input-outlined',
      'textarea[placeholder*="千问"]',
      'textarea[placeholder*="遇事不决问通义"]',
      'textarea.ant-input[maxlength="200000"]',
      'textarea.ant-input[maxlength="10000"]',
      'textarea[placeholder*="通义"]',
      'textarea.ant-input',
      'textarea[placeholder*="请输入"]',
      'textarea[placeholder*="输入"]',
      'textarea'
    ];
  }

  /**
   * 获取千问特定的发送按钮选择器
   */
  getSendButtonSelectors() {
    return [
      // 新版发送按钮
      'div[class*="operateBtn"]',
      '[class*="operateBtn"]',
      'div[class*="chatInput"] button[type="button"]',
      'div[class*="chatTextarea"] button',
      // 通过SVG图标的特征查找
      'span.anticon svg use[xlink\\:href="#icon-fasong_default"]',
      'span.anticon:has(svg use[xlink\\:href="#icon-fasong_default"])',
      'div:has(span.anticon svg use[xlink\\:href="#icon-fasong_default"])',
      ...super.getSendButtonSelectors()
    ];
  }

  /**
   * 重写查找输入框方法，优先查找 Slate 编辑器
   */
  findInputElement() {
    this.utils.log('Qianwen: 开始查找输入框');
    
    // 调试信息
    const slateEditors = document.querySelectorAll('div[data-slate-editor="true"]');
    const contentEditables = document.querySelectorAll('div[contenteditable="true"]');
    const allTextareas = document.querySelectorAll('textarea');
    this.utils.log('Qianwen: 调试信息', {
      slateEditorCount: slateEditors.length,
      contentEditableCount: contentEditables.length,
      textareaCount: allTextareas.length
    });
    
    const inputElement = super.findInputElement();
    
    if (inputElement) {
      this.utils.log(`Qianwen: 找到输入框，类型: ${inputElement.tagName} 类名: ${inputElement.className} contenteditable: ${inputElement.getAttribute('contenteditable')}`);
    } else {
      this.utils.log('Qianwen: 未找到输入框');
    }
    
    return inputElement;
  }

  /**
   * 重写文本填充，专门处理 Slate 编辑器
   * Slate 编辑器需要通过特殊方式触发内部状态更新
   */
  async fillText(inputElement, text) {
    if (!inputElement || !text) return;

    this.utils.log(`Qianwen: 开始填充文本内容: ${text.substring(0, 50)}...`);
    
    const isSlateEditor = inputElement.hasAttribute('data-slate-editor') || 
                          inputElement.getAttribute('contenteditable') === 'true';

    if (isSlateEditor) {
      await this.fillSlateEditor(inputElement, text);
    } else if (inputElement.tagName.toLowerCase() === 'textarea' || 
               inputElement.tagName.toLowerCase() === 'input') {
      await this.fillTextareaInput(inputElement, text);
    } else {
      await this.fillContentEditable(inputElement, text);
    }

    this.utils.log('Qianwen: 文本内容填充完成');
  }

  /**
   * 填充 Slate 编辑器
   * Slate 使用虚拟DOM，需要模拟真实的用户输入行为
   */
  async fillSlateEditor(element, text) {
    this.utils.log('Qianwen: 使用 Slate 编辑器填充方式');
    
    element.focus();
    await this.utils.wait(300);

    // 方案1: 使用 InputEvent 模拟输入（Slate 推荐方式）
    try {
      // 先选中所有内容并删除
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(element);
      selection.removeAllRanges();
      selection.addRange(range);
      
      // 触发删除
      const deleteEvent = new InputEvent('beforeinput', {
        bubbles: true,
        cancelable: true,
        inputType: 'deleteContentBackward',
        data: null,
        composed: true
      });
      element.dispatchEvent(deleteEvent);
      await this.utils.wait(100);

      // 清空后重置光标位置
      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(element);
      newRange.collapse(false);
      selection.addRange(newRange);
      await this.utils.wait(100);

      // 使用 insertText 类型的 InputEvent 插入文本
      const insertEvent = new InputEvent('beforeinput', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: text,
        composed: true
      });
      element.dispatchEvent(insertEvent);
      await this.utils.wait(200);

      // 检查是否插入成功
      const currentText = element.textContent.trim();
      if (currentText && currentText.length > 0 && currentText !== '向千问提问') {
        this.utils.log('Qianwen: InputEvent 方式填充成功');
        
        // 触发额外的事件确保状态同步
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        return;
      }
    } catch (e) {
      this.utils.log(`Qianwen: InputEvent 方式失败: ${e.message}`);
    }

    // 方案2: 使用 execCommand
    try {
      element.focus();
      await this.utils.wait(200);
      
      // 选中全部并删除
      document.execCommand('selectAll', false, null);
      document.execCommand('delete', false, null);
      await this.utils.wait(100);
      
      // 插入文本
      document.execCommand('insertText', false, text);
      await this.utils.wait(200);

      const currentText = element.textContent.trim();
      if (currentText && currentText.length > 0 && currentText !== '向千问提问') {
        this.utils.log('Qianwen: execCommand 方式填充成功');
        element.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }
    } catch (e) {
      this.utils.log(`Qianwen: execCommand 方式失败: ${e.message}`);
    }

    // 方案3: 使用 DataTransfer 模拟粘贴
    try {
      element.focus();
      await this.utils.wait(200);
      
      // 清空现有内容
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(element);
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand('delete', false, null);
      await this.utils.wait(100);

      // 模拟粘贴事件
      const dataTransfer = new DataTransfer();
      dataTransfer.setData('text/plain', text);
      
      const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData: dataTransfer,
        composed: true
      });
      element.dispatchEvent(pasteEvent);
      await this.utils.wait(200);

      const currentText = element.textContent.trim();
      if (currentText && currentText.length > 0 && currentText !== '向千问提问') {
        this.utils.log('Qianwen: 模拟粘贴方式填充成功');
        element.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }
    } catch (e) {
      this.utils.log(`Qianwen: 模拟粘贴方式失败: ${e.message}`);
    }

    // 方案4: 直接操作 Slate DOM 节点
    try {
      this.utils.log('Qianwen: 尝试直接操作 Slate DOM 节点');
      element.focus();
      await this.utils.wait(200);
      
      // 查找 Slate 的文本叶子节点
      const leafNode = element.querySelector('span[data-slate-leaf="true"]');
      if (leafNode) {
        // 找到零宽字符节点（空状态的标志）
        const zeroWidthNode = leafNode.querySelector('span[data-slate-zero-width]');
        if (zeroWidthNode) {
          // 替换零宽字符为实际文本
          const textNode = document.createTextNode(text);
          leafNode.innerHTML = '';
          leafNode.appendChild(textNode);
        } else {
          // 直接替换叶子节点内容
          leafNode.textContent = text;
        }
      } else {
        // 如果没有找到 leaf 节点，直接操作 p 标签
        const pNode = element.querySelector('p[data-slate-node="element"]');
        if (pNode) {
          pNode.innerHTML = `<span data-slate-node="text"><span data-slate-leaf="true">${this.utils.escapeHtml ? this.utils.escapeHtml(text) : text}</span></span>`;
        } else {
          element.textContent = text;
        }
      }
      
      await this.utils.wait(200);
      
      // 将光标移动到文本末尾
      const sel = window.getSelection();
      const rng = document.createRange();
      rng.selectNodeContents(element);
      rng.collapse(false);
      sel.removeAllRanges();
      sel.addRange(rng);
      
      // 触发事件让 Slate 感知变化
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      element.dispatchEvent(new CompositionEvent('compositionend', {
        bubbles: true,
        data: text
      }));
      
      // 触发 beforeinput 事件
      const inputEvent = new InputEvent('beforeinput', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: text,
        composed: true
      });
      element.dispatchEvent(inputEvent);
      
      await this.utils.wait(300);
      this.utils.log('Qianwen: DOM 直接操作方式完成');
    } catch (e) {
      this.utils.log(`Qianwen: DOM 直接操作失败: ${e.message}`);
    }
  }

  /**
   * 重写发送按钮查找逻辑
   */
  async sendByButton() {
    // 首先尝试通过SVG图标查找发送按钮的父元素
    const iconElement = document.querySelector('svg use[xlink\\:href="#icon-fasong_default"]');
    if (iconElement) {
      let clickableParent = iconElement;
      for (let i = 0; i < 5; i++) {
        clickableParent = clickableParent.parentElement;
        if (!clickableParent) break;
        
        const isClickable = clickableParent.tagName === 'BUTTON' || 
                           clickableParent.tagName === 'DIV' || 
                           clickableParent.onclick ||
                           clickableParent.getAttribute('role') === 'button' ||
                           window.getComputedStyle(clickableParent).cursor === 'pointer';
        
        if (isClickable) {
          try {
            clickableParent.click();
            this.utils.log(`${this.siteName}: 通过SVG图标找到并点击发送按钮成功`);
            return true;
          } catch (e) {
            this.utils.log(`${this.siteName}: 点击SVG父元素失败: ${e.message}`);
          }
        }
      }
    }
    
    // 如果通过SVG查找失败，使用父类的方法
    return await super.sendByButton();
  }

  /**
   * 重写发送消息方法
   * 千问的 Slate 编辑器优先使用回车键发送
   */
  async sendMessage(inputElement) {
    this.utils.log(`${this.siteName}: 开始发送消息`);
    
    // 确保输入框有焦点
    if (inputElement) {
      inputElement.focus();
      await this.utils.wait(300);
    }

    // 先尝试回车键发送（Slate 编辑器通常支持回车发送）
    if (inputElement) {
      const keyboardSuccess = await this.sendByKeyboard(inputElement);
      if (keyboardSuccess) {
        // 等待检查文本是否被清空
        await this.utils.wait(1500);
        const currentText = inputElement.textContent.trim();
        if (!currentText || currentText === '' || currentText === '向千问提问') {
          this.utils.log(`${this.siteName}: 回车键发送成功`);
          return true;
        }
      }
    }

    // 回车失败，尝试按钮发送
    this.utils.log(`${this.siteName}: 回车键发送失败，尝试按钮发送`);
    const buttonSuccess = await this.sendByButton();
    return buttonSuccess;
  }
}

// 导出 Qianwen 处理器
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QianwenHandler;
} else {
  window.QianwenHandler = QianwenHandler;
}
