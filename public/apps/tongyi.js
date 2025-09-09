/**
 * Tongyi 处理器
 */
class TongyiHandler extends BaseHandler {
  constructor() {
    super('Tongyi');
  }

  getInputSelectors() {
    return [
      'textarea[placeholder*="遇事不决问通义"]',
      'textarea.ant-input[maxlength="10000"]',
      'textarea[placeholder*="通义"]',
      'textarea.ant-input',
      'textarea[placeholder*="请输入"]',
      'textarea[placeholder*="输入"]',
      'textarea'
    ];
  }

  /**
   * 重写查找输入框方法，添加调试信息
   */
  findInputElement() {
    this.utils.log('Tongyi: 开始查找输入框');
    
    // 调试信息
    const allTextareas = document.querySelectorAll('textarea');
    const antInputs = document.querySelectorAll('textarea.ant-input');
    this.utils.log('Tongyi: 调试信息', {
      textareaCount: allTextareas.length,
      antInputCount: antInputs.length
    });
    
    const inputElement = super.findInputElement();
    
    if (inputElement) {
      this.utils.log(`Tongyi: 找到输入框，类型: ${inputElement.tagName} 类名: ${inputElement.className}`);
    } else {
      this.utils.log('Tongyi: 未找到输入框');
    }
    
    return inputElement;
  }
}

// 导出 Tongyi 处理器
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TongyiHandler;
} else {
  window.TongyiHandler = TongyiHandler;
}