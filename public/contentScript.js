// ChatAB Extension: Content script for auto-submitting from storage
console.log('ChatAB Extension: Content script loaded');

// 等待页面加载完成
window.addEventListener('load', function() {
  const url = new URL(window.location.href);
  
  // 检查是否是支持的网站
  const isChatGPT = url.hostname.includes('chatgpt.com') || url.hostname.includes('chat.openai.com');
  const isDeepSeek = url.hostname.includes('deepseek.com');
  const isGemini = url.hostname.includes('gemini.google.com');
  const isDoubao = url.hostname.includes('doubao.com');
  const isPerplexity = url.hostname.includes('perplexity.ai');
  const isKimi = url.hostname.includes('kimi.com');
  
  if (!isChatGPT && !isDeepSeek && !isGemini && !isDoubao && !isPerplexity && !isKimi) {
    console.log('ChatAB: 当前网站不在支持列表中');
    return;
  }
  
  let siteName = '';
  if (isChatGPT) siteName = 'ChatGPT';
  else if (isDeepSeek) siteName = 'DeepSeek';
  else if (isGemini) siteName = 'Gemini';
  else if (isDoubao) siteName = 'Doubao';
  else if (isPerplexity) siteName = 'Perplexity';
  else if (isKimi) siteName = 'Kimi';
  console.log('ChatAB: 检测到支持的网站:', siteName);
  
  // 从 storage 获取输入内容
  chrome.storage.local.get(['inputValue'], function(result) {
    const inputValue = result.inputValue;
    
    if (!inputValue || !inputValue.trim()) {
      console.log('ChatAB: 没有找到要提交的内容');
      return;
    }
    
    console.log('ChatAB: 从 storage 获取到内容:', inputValue.substring(0, 50) + '...');
    
    // 根据网站调整延迟时间
    const delay = isPerplexity ? 3000 : 2000; // Perplexity 需要更长时间加载 Lexical 编辑器
    
    // 延迟执行，确保页面完全加载
    setTimeout(function() {
      let chatInput = null;
      let sendButton = null;
      
      if (isChatGPT) {
        // ChatGPT 输入框选择器
        chatInput = document.querySelector('#prompt-textarea') || 
                   document.querySelector('textarea[data-id="root"]') ||
                   document.querySelector('textarea[placeholder*="Message"]') ||
                   document.querySelector('textarea[placeholder*="message"]') ||
                   document.querySelector('div[contenteditable="true"]');
      } else if (isDeepSeek) {
        // DeepSeek 输入框选择器
        chatInput = document.getElementById('chat-input') ||
                   document.querySelector('textarea[placeholder*="请输入"]') ||
                   document.querySelector('textarea[placeholder*="输入"]') ||
                   document.querySelector('div[contenteditable="true"]');
      } else if (isGemini) {
        // Gemini 输入框选择器
        chatInput = document.querySelector('div.ql-editor.textarea.new-input-ui[contenteditable="true"]') ||
                   document.querySelector('div[contenteditable="true"]') ||
                   document.querySelector('textarea[placeholder*="Enter a prompt"]') ||
                   document.querySelector('textarea');
      } else if (isDoubao) {
        // Doubao 输入框选择器
        chatInput = document.querySelector('textarea[data-testid="chat_input_input"]') ||
                   document.querySelector('textarea[placeholder*="请输入"]') ||
                   document.querySelector('textarea[placeholder*="输入"]') ||
                   document.querySelector('div[contenteditable="true"]') ||
                   document.querySelector('textarea');
      } else if (isPerplexity) {
        // Perplexity 输入框选择器 (Lexical 编辑器)
        chatInput = document.querySelector('#ask-input') ||
                   document.querySelector('div[data-lexical-editor="true"]') ||
                   document.querySelector('div[contenteditable="true"][role="textbox"]') ||
                   document.querySelector('div[contenteditable="true"]');
      } else if (isKimi) {
        // Kimi 输入框选择器 (Lexical 编辑器) - 添加调试信息
        console.log('ChatAB: 开始查找Kimi输入框');
        
        // 先检查页面上是否有相关元素
        const chatInputContainer = document.querySelector('.chat-input');
        const editorContainer = document.querySelector('.chat-input-editor-container');
        const allContentEditables = document.querySelectorAll('div[contenteditable="true"]');
        const allLexicalEditors = document.querySelectorAll('div[data-lexical-editor="true"]');
        
        console.log('ChatAB: Kimi调试信息:', {
          chatInputContainer: !!chatInputContainer,
          editorContainer: !!editorContainer,
          contentEditableCount: allContentEditables.length,
          lexicalEditorCount: allLexicalEditors.length
        });
        
        // 尝试多种选择器
        chatInput = document.querySelector('.chat-input-editor[contenteditable="true"]') ||
                   document.querySelector('div[data-lexical-editor="true"][role="textbox"]') ||
                   document.querySelector('.chat-input-editor') ||
                   document.querySelector('.chat-input div[contenteditable="true"]') ||
                   document.querySelector('div[contenteditable="true"][data-lexical-editor="true"]') ||
                   document.querySelector('div[contenteditable="true"][role="textbox"]');
        
        if (chatInput) {
          console.log('ChatAB: 找到Kimi输入框，选择器:', chatInput.className, chatInput.tagName);
        } else {
          console.log('ChatAB: 未找到Kimi输入框，尝试通用方法');
          // 如果还是找不到，尝试最后的通用方法
          if (allContentEditables.length > 0) {
            chatInput = allContentEditables[0];
            console.log('ChatAB: 使用第一个contenteditable元素作为输入框');
          }
        }
      }
      
      if (!chatInput) {
        console.log('ChatAB: 没有找到输入框，尝试更多选择器');
        // 通用输入框查找
        chatInput = document.querySelector('textarea') ||
                   document.querySelector('div[contenteditable="true"]') ||
                   document.querySelector('input[type="text"]');
      }
      
      if (chatInput) {
        console.log('ChatAB: 找到输入框，开始填充内容');
        
        // 填充内容
        if (chatInput.tagName.toLowerCase() === 'textarea' || chatInput.tagName.toLowerCase() === 'input') {
          chatInput.value = inputValue;
          // 触发输入事件
          const inputEvent = new Event('input', { bubbles: true });
          chatInput.dispatchEvent(inputEvent);
          
          // 触发 change 事件
          const changeEvent = new Event('change', { bubbles: true });
          chatInput.dispatchEvent(changeEvent);
        } else if (chatInput.getAttribute('contenteditable') === 'true') {
          if ((isPerplexity && (chatInput.getAttribute('data-lexical-editor') === 'true' || chatInput.id === 'ask-input')) ||
              (isKimi && chatInput.getAttribute('data-lexical-editor') === 'true')) {
            // Perplexity 和 Kimi 的 Lexical 编辑器特殊处理
            try {
              console.log(`ChatAB: ${siteName} Lexical编辑器特殊处理`);
              
              // 先清空内容
              chatInput.innerHTML = '';
              
              // 使用简化的文本插入方式
              chatInput.focus();
              
              // 尝试使用 document.execCommand 插入文本
              if (document.execCommand) {
                document.execCommand('insertText', false, inputValue);
              } else {
                // 备用方案：直接设置textContent
                chatInput.textContent = inputValue;
              }
              
              // 触发必要的事件
              ['input', 'change', 'keyup'].forEach(eventType => {
                const event = new Event(eventType, { bubbles: true, cancelable: true });
                chatInput.dispatchEvent(event);
              });
            } catch (e) {
              console.log(`ChatAB: ${siteName} Lexical特殊处理失败，使用备用方法`, e);
              // 备用方案：使用Lexical格式
              const formattedText = inputValue.split('\n').map(line => 
                `<p dir="ltr"><span data-lexical-text="true">${line || '<br>'}</span></p>`
              ).join('');
              chatInput.innerHTML = formattedText;
            }
          } else {
            // 对于其他 contenteditable 的 div (主要是 Gemini)
            chatInput.innerHTML = inputValue.replace(/\n/g, '<br>');
            // 触发输入事件
            const inputEvent = new Event('input', { bubbles: true });
            chatInput.dispatchEvent(inputEvent);
          }
        }
        
        // 聚焦输入框
        chatInput.focus();
        
        // 等待一下再尝试发送 - 统一使用回车键发送
        setTimeout(function() {
          console.log(`ChatAB: ${siteName} 使用回车键发送`);
          
          try {
            // 模拟回车键按下（现代浏览器通常只需要 keydown 事件）
            const enterEvent = new KeyboardEvent('keydown', {
              key: 'Enter',
              code: 'Enter',
              keyCode: 13,
              which: 13,
              bubbles: true,
              cancelable: true
            });
            
            chatInput.dispatchEvent(enterEvent);
            
            console.log(`ChatAB: ${siteName} 回车键发送完成`);
            
            // 发送成功后清空 storage
            setTimeout(function() {
              chrome.storage.local.remove('inputValue');
              console.log('ChatAB: 内容已发送，清空 storage');
            }, 1000);
            
          } catch (e) {
            console.log(`ChatAB: ${siteName} 键盘事件失败:`, e);
          }
        }, 800);
      } else {
        console.log('ChatAB: 没有找到输入框');
        
        // 对于 Perplexity 和 Kimi，如果没找到输入框，再等待一下再试
        if (isPerplexity || isKimi) {
          setTimeout(function() {
            console.log(`ChatAB: ${siteName} 二次尝试查找输入框`);
            let retryInput = null;
            
            if (isPerplexity) {
              retryInput = document.querySelector('#ask-input') ||
                          document.querySelector('div[data-lexical-editor="true"]') ||
                          document.querySelector('div[contenteditable="true"][role="textbox"]');
            } else if (isKimi) {
              retryInput = document.querySelector('.chat-input-editor[contenteditable="true"]') ||
                          document.querySelector('div[data-lexical-editor="true"][role="textbox"]') ||
                          document.querySelector('.chat-input div[contenteditable="true"]') ||
                          document.querySelector('div[contenteditable="true"]');
            }
            
            if (retryInput) {
              console.log(`ChatAB: ${siteName} 二次尝试找到输入框`);
              retryInput.focus();
              
              if (document.execCommand) {
                document.execCommand('insertText', false, inputValue);
              } else {
                retryInput.textContent = inputValue;
              }
              
              // 触发事件
              ['input', 'change'].forEach(eventType => {
                const event = new Event(eventType, { bubbles: true });
                retryInput.dispatchEvent(event);
              });
              
              // 尝试发送
              setTimeout(function() {
                const enterEvent = new KeyboardEvent('keydown', {
                  key: 'Enter',
                  code: 'Enter',
                  keyCode: 13,
                  which: 13,
                  bubbles: true,
                  cancelable: true
                });
                retryInput.dispatchEvent(enterEvent);
                
                // 清空storage
                setTimeout(function() {
                  chrome.storage.local.remove('inputValue');
                  console.log(`ChatAB: ${siteName} 二次尝试完成，清空storage`);
                }, 1000);
              }, 800);
            } else {
              console.log(`ChatAB: ${siteName} 二次尝试仍然没有找到输入框`);
            }
          }, 2000);
        }
      }
    }, delay); // 使用动态延迟时间
  });
});

// 监听从扩展发来的消息（如果需要的话）
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === 'checkAutoFill') {
    sendResponse({ status: 'ready' });
  }
}); 