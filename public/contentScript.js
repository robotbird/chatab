// 简单的内容脚本 - 显示URL参数并填充到聊天框自动发送
console.log('ChatAB Extension: Content script loaded for DeepSeek');

// 等待页面加载完成
window.addEventListener('load', function() {
  // // 获取URL参数
  // const url = new URL(window.location.href);
  // const params = Array.from(url.searchParams.entries());

  // // 创建显示元素
  // const displayElement = document.createElement('div');
  // // 设置样式
  // displayElement.style.position = 'fixed';
  // displayElement.style.top = '10px';
  // displayElement.style.right = '150px';
  // displayElement.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  // displayElement.style.color = 'white';
  // displayElement.style.padding = '8px 12px';
  // displayElement.style.borderRadius = '4px';
  // displayElement.style.fontSize = '12px';
  // displayElement.style.zIndex = '9999';
  // displayElement.style.maxWidth = '300px';

  // // 设置内容
  // if (params.length === 0) {
  //   displayElement.textContent = '无 URL 参数';
  // } else {
  //   displayElement.textContent = 'URL参数: ' + params.map(([key, value]) => `${key}=${decodeURIComponent(value)}`).join(', ');
  // }

  // // 添加到页面
  // document.body.appendChild(displayElement);

  // // 5秒后移除显示
  // setTimeout(function() {
  //   if (displayElement.parentNode) {
  //     displayElement.parentNode.removeChild(displayElement);
  //   }
  // }, 5000);

  // 下面是原有的自动填充和发送逻辑
  const qParam = url.searchParams.get('q');
  // 如果存在q参数
  if (qParam) {
    // 查找聊天输入框并填充内容
    setTimeout(function() {
      // 判断当前是DeepSeek还是Doubao还是Gemini
      let chatInput = null;
      if (url.hostname.includes('deepseek')) {
        chatInput = document.getElementById('chat-input');
      } else if (url.hostname.includes('doubao')) {
        chatInput = document.querySelector('textarea[data-testid="chat_input_input"]');
      } else if (url.hostname.includes('gemini')) {
        // Gemini: 查找 contenteditable 的输入区域（div.ql-editor.textarea.new-input-ui[contenteditable="true"]）
        chatInput = document.querySelector('div.ql-editor.textarea.new-input-ui[contenteditable="true"]');
      }
      if (chatInput) {
        // Gemini 特殊处理
        if (url.hostname.includes('gemini')) {
          chatInput.innerHTML = decodeURIComponent(qParam).replace(/\n/g, '<br>');
          // 触发 input 事件
          const inputEvent = new Event('input', { bubbles: true });
          chatInput.dispatchEvent(inputEvent);
          chatInput.focus();
          // 模拟回车键按下以发送消息
          setTimeout(function() {
            const enterEvent = new KeyboardEvent('keydown', {
              key: 'Enter',
              code: 'Enter',
              keyCode: 13,
              which: 13,
              bubbles: true,
              cancelable: true
            });
            chatInput.dispatchEvent(enterEvent);
          }, 500);
        } else {
          // 将参数值填充到输入框
          chatInput.value = decodeURIComponent(qParam);
          // 触发输入事件，确保JS能够检测到输入
          const inputEvent = new Event('input', { bubbles: true });
          chatInput.dispatchEvent(inputEvent);
          // 聚焦输入框
          chatInput.focus();
          // 模拟回车键按下以发送消息
          setTimeout(function() {
            // 创建并触发回车键事件
            const enterEvent = new KeyboardEvent('keydown', {
              key: 'Enter',
              code: 'Enter',
              keyCode: 13,
              which: 13,
              bubbles: true,
              cancelable: true
            });
            chatInput.dispatchEvent(enterEvent);
            // 如果上面的方法不起作用，尝试查找和点击发送按钮
            const sendButtons = document.querySelectorAll('button');
            let sendButton = null;
            // 查找可能的发送按钮
            for (let i = 0; i < sendButtons.length; i++) {
              const btn = sendButtons[i];
              // 查找具有发送图标或特定类名的按钮
              if (btn.innerHTML.includes('svg') && 
                  (btn.closest('.send-button') || 
                   btn.classList.contains('send') || 
                   btn.parentElement.classList.contains('send-button-container'))) {
                sendButton = btn;
                break;
              }
            }
            // 如果找到发送按钮，点击它
            if (sendButton) {
              sendButton.click();
            }
          }, 500); // 给页面一点时间来响应输入
        }
      } else {
        console.log('没有找到聊天输入框');
      }
    }, 1000); // 确保页面已完全加载
  }
}); 