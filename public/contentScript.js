// ChatAB Extension: Content script for auto-submitting from storage
console.log('ChatAB Extension: Content script loaded');

// 优化页面加载检测 - 使用多种事件确保脚本能执行
function initScript() {
  const url = new URL(window.location.href);
  
  // 检查是否是支持的网站
  const isChatGPT = url.hostname.includes('chatgpt.com');
  const isDeepSeek = url.hostname.includes('deepseek.com');
  const isGemini = url.hostname.includes('gemini.google.com');
  const isDoubao = url.hostname.includes('doubao.com');
  const isPerplexity = url.hostname.includes('perplexity.ai');
  const isKimi = url.hostname.includes('kimi.com');
  const isTongyi = url.hostname.includes('tongyi.com');
  const isYuanbao = url.hostname.includes('yuanbao.tencent.com');
  if (!isChatGPT && !isDeepSeek && !isGemini && !isDoubao && !isPerplexity && !isKimi && !isTongyi && !isYuanbao) {
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
  else if (isTongyi) siteName = 'Tongyi';
  else if (isYuanbao) siteName = 'Yuanbao';
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
    const delay = isTongyi ? 5000 : 2000; // Tongyi 需要更长时间因为网站有加载问题 
    
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
      } else if (isTongyi) {
        // Tongyi 输入框选择器 - 基于实际HTML结构
        console.log('ChatAB: 开始查找Tongyi输入框');
        
        // 调试信息
        const allTextareas = document.querySelectorAll('textarea');
        const antInputs = document.querySelectorAll('textarea.ant-input');
        console.log('ChatAB: Tongyi调试信息:', {
          textareaCount: allTextareas.length,
          antInputCount: antInputs.length
        });
        
        chatInput = document.querySelector('textarea[placeholder*="遇事不决问通义"]') ||
                   document.querySelector('textarea.ant-input[maxlength="10000"]') ||
                   document.querySelector('textarea[placeholder*="通义"]') ||
                   document.querySelector('textarea.ant-input') ||
                   document.querySelector('textarea[placeholder*="请输入"]') ||
                   document.querySelector('textarea[placeholder*="输入"]') ||
                   document.querySelector('textarea');
        
        if (chatInput) {
          console.log('ChatAB: 找到Tongyi输入框，类型:', chatInput.tagName, '类名:', chatInput.className);
        } else {
          console.log('ChatAB: 未找到Tongyi输入框');
        }
      } else if (isYuanbao) {
        // Yuanbao 输入框选择器 (Quill 编辑器) - 基于实际HTML结构
        console.log('ChatAB: 开始查找Yuanbao输入框');
        
        // 调试信息
        const chatInputEditor = document.querySelector('.chat-input-editor');
        const quillContainers = document.querySelectorAll('.ql-container');
        const quillEditors = document.querySelectorAll('.ql-editor');
        const allContentEditables = document.querySelectorAll('div[contenteditable="true"]');
        
        console.log('ChatAB: Yuanbao调试信息:', {
          chatInputEditor: !!chatInputEditor,
          quillContainerCount: quillContainers.length,
          quillEditorCount: quillEditors.length,
          contentEditableCount: allContentEditables.length
        });
        
        // 基于实际HTML结构的选择器优先级
        chatInput = document.querySelector('.chat-input-editor .ql-editor[contenteditable="true"]') ||
                   document.querySelector('div.ql-editor[contenteditable="true"][data-placeholder*="Ask me anything"]') ||
                   document.querySelector('div.ql-editor[contenteditable="true"]') ||
                   document.querySelector('.ql-editor[contenteditable="true"]') ||
                   document.querySelector('.chat-input-editor div[contenteditable="true"]') ||
                   document.querySelector('div[contenteditable="true"][data-placeholder*="Ask"]') ||
                   document.querySelector('div[contenteditable="true"]');
        
        if (chatInput) {
          console.log('ChatAB: 找到Yuanbao输入框，类型:', chatInput.tagName, '类名:', chatInput.className);
        } else {
          console.log('ChatAB: 未找到Yuanbao输入框');
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
          } else if (isYuanbao && chatInput.classList.contains('ql-editor')) {
            // Yuanbao 的 Quill 编辑器特殊处理
            try {
              console.log(`ChatAB: ${siteName} Quill编辑器特殊处理`);
              
              // 先清空内容
              chatInput.innerHTML = '';
              
              // 聚焦编辑器
              chatInput.focus();
              
              // 尝试使用 document.execCommand 插入文本
              if (document.execCommand) {
                document.execCommand('insertText', false, inputValue);
              } else {
                // 备用方案：使用Quill格式
                const formattedText = inputValue.split('\n').map(line => 
                  line ? `<p>${line}</p>` : '<p><br></p>'
                ).join('');
                chatInput.innerHTML = formattedText;
              }
              
              // 触发必要的事件
              ['input', 'change', 'keyup', 'text-change'].forEach(eventType => {
                const event = new Event(eventType, { bubbles: true, cancelable: true });
                chatInput.dispatchEvent(event);
              });
            } catch (e) {
              console.log(`ChatAB: ${siteName} Quill特殊处理失败，使用备用方法`, e);
              // 备用方案：简单的HTML格式
              chatInput.innerHTML = `<p>${inputValue.replace(/\n/g, '</p><p>')}</p>`;
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
        
        // 对于 Perplexity、Kimi、Tongyi 和 Yuanbao，如果没找到输入框，再等待一下再试
        if (isPerplexity || isKimi || isTongyi || isYuanbao) {
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
            } else if (isTongyi) {
              retryInput = document.querySelector('textarea[placeholder*="遇事不决问通义"]') ||
                          document.querySelector('textarea.ant-input[maxlength="10000"]') ||
                          document.querySelector('textarea[placeholder*="通义"]') ||
                          document.querySelector('textarea.ant-input') ||
                          document.querySelector('textarea');
            } else if (isYuanbao) {
              retryInput = document.querySelector('.chat-input-editor .ql-editor[contenteditable="true"]') ||
                          document.querySelector('div.ql-editor[contenteditable="true"]') ||
                          document.querySelector('.ql-editor[contenteditable="true"]') ||
                          document.querySelector('div[contenteditable="true"]');
            }
            
            if (retryInput) {
              console.log(`ChatAB: ${siteName} 二次尝试找到输入框`);
              retryInput.focus();
              
              // 特殊处理Yuanbao的Quill编辑器
              if (isYuanbao && retryInput.classList.contains('ql-editor')) {
                console.log(`ChatAB: ${siteName} 二次尝试 - Quill编辑器特殊处理`);
                if (document.execCommand) {
                  document.execCommand('insertText', false, inputValue);
                } else {
                  const formattedText = inputValue.split('\n').map(line => 
                    line ? `<p>${line}</p>` : '<p><br></p>'
                  ).join('');
                  retryInput.innerHTML = formattedText;
                }
                
                // 触发Quill特定事件
                ['input', 'change', 'text-change'].forEach(eventType => {
                  const event = new Event(eventType, { bubbles: true });
                  retryInput.dispatchEvent(event);
                });
              } else {
                // 其他编辑器的处理
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
              }
              
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
    }, delay);
  });
}

// 多种方式确保脚本能够执行
let scriptExecuted = false;

// 1. DOMContentLoaded - 比load事件更早触发
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    if (!scriptExecuted) {
      scriptExecuted = true;
      console.log('ChatAB: 通过DOMContentLoaded启动');
      initScript();
    }
  });
} else {
  // 2. 文档已经加载完成，直接执行
  console.log('ChatAB: 文档已加载，直接启动');
  scriptExecuted = true;
  initScript();
}

// 3. 备用方案 - window.load事件
window.addEventListener('load', function() {
  if (!scriptExecuted) {
    scriptExecuted = true;
    console.log('ChatAB: 通过window.load启动');
    initScript();
  }
});

// 4. 最后的备用方案 - 延迟执行
setTimeout(function() {
  if (!scriptExecuted) {
    scriptExecuted = true;
    console.log('ChatAB: 通过延迟方案启动');
    initScript();
  }
}, 3000); // 3秒后强制执行

// 监听从扩展发来的消息（如果需要的话）
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === 'checkAutoFill') {
    sendResponse({ status: 'ready' });
  }
}); 