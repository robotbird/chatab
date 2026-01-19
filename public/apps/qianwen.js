/**
 * Qianwen 处理器
 */
class QianwenHandler extends BaseHandler {
  constructor() {
    super('Qianwen');
  }

  getInputSelectors() {
    return [
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
      // 通过发送图标查找可点击的父元素
      'div[class*="operateBtn"]',  // 包含operateBtn的div（最外层可点击元素）
      '[class*="operateBtn"]',  // 任何包含operateBtn的元素
      // 通过SVG图标的特征查找
      'span.anticon svg use[xlink\\:href="#icon-fasong_default"]',  // 发送图标的use元素
      'span.anticon:has(svg use[xlink\\:href="#icon-fasong_default"])',  // 包含发送图标的span（如果浏览器支持:has）
      'div:has(span.anticon svg use[xlink\\:href="#icon-fasong_default"])',  // 包含发送图标的div（如果浏览器支持:has）
      ...super.getSendButtonSelectors()  // 继承父类的通用选择器作为备选
    ];
  }

  /**
   * 重写发送按钮查找逻辑，添加特殊处理
   */
  async sendByButton() {
    // 首先尝试通过SVG图标查找发送按钮的父元素
    const iconElement = document.querySelector('svg use[xlink\\:href="#icon-fasong_default"]');
    if (iconElement) {
      // 向上查找可点击的父元素
      let clickableParent = iconElement;
      for (let i = 0; i < 5; i++) {  // 最多向上查找5层
        clickableParent = clickableParent.parentElement;
        if (!clickableParent) break;
        
        // 检查是否是可点击的元素
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
   * 重写查找输入框方法，添加调试信息
   */
  findInputElement() {
    this.utils.log('Qianwen: 开始查找输入框');
    
    // 调试信息
    const allTextareas = document.querySelectorAll('textarea');
    const antInputs = document.querySelectorAll('textarea.ant-input');
    this.utils.log('Qianwen: 调试信息', {
      textareaCount: allTextareas.length,
      antInputCount: antInputs.length
    });
    
    const inputElement = super.findInputElement();
    
    if (inputElement) {
      this.utils.log(`Qianwen: 找到输入框，类型: ${inputElement.tagName} 类名: ${inputElement.className}`);
    } else {
      this.utils.log('Qianwen: 未找到输入框');
    }
    
    return inputElement;
  }
}

// 导出 Qianwen 处理器
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QianwenHandler;
} else {
  window.QianwenHandler = QianwenHandler;
}