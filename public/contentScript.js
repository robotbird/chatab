
// 优化页面加载检测 - 使用多种事件确保脚本能执行
function initScript() {
  console.log('ChatAB: initScript 函数开始执行');
  const url = new URL(window.location.href);
  console.log('ChatAB: 解析后的URL对象:', url);
  
  // 检查是否是支持的网站
  console.log('ChatAB: 开始检测网站类型...');
  const isChatGPT = url.hostname.includes('chatgpt.com');
  const isDeepSeek = url.hostname.includes('deepseek.com');
  const isGemini = url.hostname.includes('gemini.google.com');
  const isDoubao = url.hostname.includes('doubao.com');
  const isPerplexity = url.hostname.includes('perplexity.ai');
  const isKimi = url.hostname.includes('kimi.com');
  const isTongyi = url.hostname.includes('tongyi.com');
  const isYuanbao = url.hostname.includes('yuanbao.tencent.com');
  const isGrok = url.hostname.includes('grok.com');
  const isYiyan = url.hostname.includes('yiyan.baidu.com');
  
  console.log('ChatAB: 网站检测结果:', {
    hostname: url.hostname,
    isChatGPT, isDeepSeek, isGemini, isDoubao, 
    isPerplexity, isKimi, isTongyi, isYuanbao, isGrok, isYiyan
  });
  if (!isChatGPT && !isDeepSeek && !isGemini && !isDoubao && !isPerplexity && !isKimi && !isTongyi && !isYuanbao && !isGrok && !isYiyan) {
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
  else if (isGrok) siteName = 'Grok';
  else if (isYiyan) siteName = 'Yiyan';
  console.log('ChatAB: 检测到支持的网站:', siteName);
  
  // 对于Yiyan，添加页面状态详细检查
  if (isYiyan) {
    console.log('ChatAB: Yiyan页面详细状态检查:', {
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
  
  // 从 storage 获取输入内容
  chrome.storage.local.get(['inputValue'], function(result) {
    const inputValue = result.inputValue;
    
    if (!inputValue || !inputValue.trim()) {
      console.log('ChatAB: 没有找到要提交的内容');
      return;
    }
    
    console.log('ChatAB: 从 storage 获取到内容:', inputValue ? inputValue.substring(0, 50) + '...' : '无文本');
    
    // 根据网站调整延迟时间
    const delay = (isTongyi || isYiyan || isYuanbao) ? 5000 : 2000; // Tongyi、Yiyan 和 Yuanbao 需要更长时间因为网站有加载问题 
    
    // 延迟执行，确保页面完全加载
    setTimeout(function() {
      let chatInput = null;
      let sendButton = null;
      
      if (isChatGPT) {
        // ChatGPT 输入框选择器 - 优先查找ProseMirror编辑器
        chatInput = document.querySelector('#prompt-textarea') || 
                   document.querySelector('div.ProseMirror[contenteditable="true"]') ||
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
        // Doubao 输入框选择器 - 基于最新HTML结构
        chatInput = document.querySelector('textarea[data-testid="chat_input_input"]') ||
                   document.querySelector('textarea.semi-input-textarea') ||
                   document.querySelector('textarea[placeholder*="发消息"]') ||
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
        
        console.log('ChatAB: Yuanbao调试信息:');
        console.log('  - chatInputEditor存在:', !!chatInputEditor);
        console.log('  - quillContainer数量:', quillContainers.length);
        console.log('  - quillEditor数量:', quillEditors.length);
        console.log('  - contentEditable数量:', allContentEditables.length);
        
        // 输出具体的quill编辑器信息
        if (quillEditors.length > 0) {
          console.log('ChatAB: 找到的ql-editor元素详情:');
          quillEditors.forEach((editor, index) => {
            console.log(`  编辑器 ${index + 1}:`, {
              tagName: editor.tagName,
              className: editor.className,
              contentEditable: editor.contentEditable,
              dataPlaceholder: editor.getAttribute('data-placeholder'),
              placeholder: editor.getAttribute('placeholder'),
              attributes: Array.from(editor.attributes).map(attr => `${attr.name}="${attr.value}"`).join(', ')
            });
          });
        }
        
        // 输出具体的contenteditable元素信息
        if (allContentEditables.length > 0) {
          console.log('ChatAB: 找到的contenteditable元素详情:');
          allContentEditables.forEach((el, index) => {
            console.log(`  元素 ${index + 1}:`, {
              tagName: el.tagName,
              className: el.className,
              parentClassName: el.parentElement?.className,
              dataPlaceholder: el.getAttribute('data-placeholder'),
              placeholder: el.getAttribute('placeholder')
            });
          });
        }
        
        // 基于实际HTML结构的选择器优先级
        // 测试每个选择器并记录结果
        const selectors = [
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
        
        console.log('ChatAB: 测试Yuanbao选择器:');
        chatInput = null;
        
        for (let i = 0; i < selectors.length; i++) {
          const selector = selectors[i];
          const element = document.querySelector(selector);
          console.log(`  选择器 ${i + 1}: "${selector}" -> ${element ? '找到' : '未找到'}`);
          if (element && !chatInput) {
            chatInput = element;
            console.log(`  ✓ 使用选择器 ${i + 1}: "${selector}"`);
            break;
          }
        }
        
        if (chatInput) {
          console.log('ChatAB: 找到Yuanbao输入框，类型:', chatInput.tagName, '类名:', chatInput.className);
        } else {
          console.log('ChatAB: 未找到Yuanbao输入框');
          
          // 额外的页面结构调试
          console.log('ChatAB: Yuanbao页面结构调试:');
          
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
          
          console.log('ChatAB: 可疑的编辑器元素 (前5个):');
          suspiciousElements.forEach((el, index) => {
            console.log(`  元素 ${index + 1}:`, {
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
          console.log('ChatAB: 页面加载状态检查:', {
            readyState: document.readyState,
            bodyChildrenCount: document.body?.children.length,
            hasVisibleContent: document.body?.innerText.length > 100
          });
        }
      } else if (isGrok) {
        // Grok 输入框选择器 - 基于TipTap ProseMirror结构
        console.log('ChatAB: 开始查找Grok输入框 (TipTap ProseMirror)');
        
        // 调试信息
        const allTextareas = document.querySelectorAll('textarea');
        const allContentEditables = document.querySelectorAll('div[contenteditable="true"]');
        const tiptapElements = document.querySelectorAll('.tiptap');
        const proseMirrorElements = document.querySelectorAll('.ProseMirror');
        
        console.log('ChatAB: Grok调试信息:', {
          textareaCount: allTextareas.length,
          contentEditableCount: allContentEditables.length,
          tiptapCount: tiptapElements.length,
          proseMirrorCount: proseMirrorElements.length
        });
        
        // 基于TipTap ProseMirror的选择器优先级
        chatInput = document.querySelector('div.tiptap.ProseMirror[contenteditable="true"]') ||
                   document.querySelector('div.ProseMirror[contenteditable="true"].w-full') ||
                   document.querySelector('div.tiptap[contenteditable="true"]') ||
                   document.querySelector('div.ProseMirror[contenteditable="true"]') ||
                   document.querySelector('div[contenteditable="true"][data-placeholder*="What do you want to know?"]') ||
                   document.querySelector('div[contenteditable="true"].w-full.px-2') ||
                   document.querySelector('div[contenteditable="true"][translate="no"]') ||
                   // 备用方案：尝试旧的textarea选择器
                   document.querySelector('textarea[aria-label*="Ask Grok anything"]') ||
                   document.querySelector('textarea[aria-label*="Ask Grok"]') ||
                   document.querySelector('textarea[aria-label*="Grok"]') ||
                   document.querySelector('textarea.w-full.bg-transparent') ||
                   document.querySelector('textarea[dir="auto"]') ||
                   document.querySelector('textarea[placeholder*="Ask me anything"]') ||
                   document.querySelector('textarea[placeholder*="输入"]') ||
                   document.querySelector('div[contenteditable="true"]') ||
                   document.querySelector('textarea');
        
        if (chatInput) {
          console.log('ChatAB: 找到Grok输入框，类型:', chatInput.tagName, '类名:', chatInput.className);
          console.log('ChatAB: Grok输入框属性:', {
            contentEditable: chatInput.contentEditable,
            dataPlaceholder: chatInput.getAttribute('data-placeholder'),
            translate: chatInput.getAttribute('translate'),
            classList: Array.from(chatInput.classList)
          });
        } else {
          console.log('ChatAB: 未找到Grok输入框');
        }
      } else if (isYiyan) {
        // Yiyan 输入框选择器 (Lexical 编辑器) - 基于实际HTML结构
        console.log('ChatAB: 开始查找Yiyan输入框');
        
        // 调试信息
        const ycEditorContainer = document.querySelector('.yc-editor-container');
        const ycEditorWrapper = document.querySelector('.yc-editor-wrapper');
        const ycEditors = document.querySelectorAll('.yc-editor');
        const allContentEditables = document.querySelectorAll('div[contenteditable="true"]');
        const allLexicalEditors = document.querySelectorAll('div[data-lexical-editor="true"]');
        
        console.log('ChatAB: Yiyan调试信息:', {
          ycEditorContainer: !!ycEditorContainer,
          ycEditorWrapper: !!ycEditorWrapper,
          ycEditorCount: ycEditors.length,
          contentEditableCount: allContentEditables.length,
          lexicalEditorCount: allLexicalEditors.length
        });
        
        // 基于实际HTML结构的选择器优先级
        chatInput = document.querySelector('.yc-editor[contenteditable="true"][data-lexical-editor="true"]') ||
                   document.querySelector('div.yc-editor[contenteditable="true"]') ||
                   document.querySelector('.yc-editor[role="textbox"]') ||
                   document.querySelector('div[placeholder*="How can I help you?"][contenteditable="true"]') ||
                   document.querySelector('div[data-lexical-editor="true"][role="textbox"]') ||
                   document.querySelector('.yc-editor') ||
                   document.querySelector('div[contenteditable="true"][role="textbox"]') ||
                   document.querySelector('div[contenteditable="true"]');
        
        if (chatInput) {
          console.log('ChatAB: 找到Yiyan输入框，类型:', chatInput.tagName, '类名:', chatInput.className);
        } else {
          console.log('ChatAB: 未找到Yiyan输入框');
          // 额外的调试信息
          console.log('ChatAB: Yiyan页面当前DOM快照:', {
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
      }
      
      if (!chatInput) {
        console.log('ChatAB: 没有找到输入框，尝试更多选择器');
        // 通用输入框查找
        chatInput = document.querySelector('textarea') ||
                   document.querySelector('div[contenteditable="true"]') ||
                   document.querySelector('input[type="text"]');
      }
      


      
      if (chatInput) {
        console.log('ChatAB: 找到输入框，开始处理内容');
        
        // ChatGPT专用发送函数
        async function sendChatGPTMessage() {
          console.log('ChatAB: 开始ChatGPT专用发送流程');
          
          // 获取ChatGPT输入框内容的函数
          function getChatGPTInputText() {
            if (chatInput.value !== undefined) {
              return chatInput.value; // textarea
            } else if (chatInput.textContent !== undefined) {
              return chatInput.textContent; // contenteditable div
            } else if (chatInput.innerText !== undefined) {
              return chatInput.innerText; // 其他元素
            } else {
              return '';
            }
          }
          
          // 记录发送前的文本内容用于检查发送是否成功
          const beforeSendText = getChatGPTInputText();
          console.log('ChatAB: 发送前文本内容长度:', beforeSendText.length);
          console.log('ChatAB: 发送前文本内容预览:', beforeSendText.substring(0, 100) + '...');
          
          let retryCount = 0;
          const maxRetries = 5;
          
          async function attemptSend() {
            retryCount++;
            console.log(`ChatAB: ChatGPT发送尝试 ${retryCount}/${maxRetries}`);
            
            try {
              // 确保输入框处于焦点状态
              chatInput.focus();
              
              // 等待一下确保焦点已设置
              await new Promise(resolve => setTimeout(resolve, 200));
              
              // 触发keydown事件
              const keydownEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true,
                cancelable: true
              });
              chatInput.dispatchEvent(keydownEvent);
              
              // 触发keypress事件
              const keypressEvent = new KeyboardEvent('keypress', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true,
                cancelable: true
              });
              chatInput.dispatchEvent(keypressEvent);
              
              // 触发keyup事件
              const keyupEvent = new KeyboardEvent('keyup', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true,
                cancelable: true
              });
              chatInput.dispatchEvent(keyupEvent);
              
              console.log('ChatAB: ChatGPT回车键事件已触发');
              
              // 等待页面响应
              await new Promise(resolve => setTimeout(resolve, 1500));
              
              // 检查文本框是否清空（判断发送是否成功）
              const afterSendText = getChatGPTInputText();
              console.log('ChatAB: 发送后文本内容长度:', afterSendText.length);
              console.log('ChatAB: 发送后文本内容预览:', afterSendText.substring(0, 50) + '...');
              
              // 检查发送是否成功的条件：
              // 1. 文本框完全清空，或者
              // 2. 文本内容明显减少（可能是部分发送成功）
              const textCleared = afterSendText.length === 0 || afterSendText.trim() === '';
              const textReduced = afterSendText.length < beforeSendText.length * 0.8; // 内容减少了80%以上
              
              if (textCleared || textReduced) {
                console.log('ChatAB: ChatGPT发送成功，文本框已清空或内容明显减少');
                
                // 发送成功后清空 storage
                setTimeout(function() {
                  chrome.storage.local.remove(['inputValue']);
                  console.log('ChatAB: ChatGPT通过回车键发送成功，清空 storage');
                }, 1000);
                
                return true; // 发送成功
              } else {
                console.log('ChatAB: ChatGPT发送可能失败，文本框仍有内容');
                
                // 如果还有重试次数，继续尝试
                if (retryCount < maxRetries) {
                  console.log(`ChatAB: 准备重试发送，剩余重试次数: ${maxRetries - retryCount}`);
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  return await attemptSend();
                } else {
                  console.log('ChatAB: ChatGPT发送失败，已达最大重试次数');
                  return false;
                }
              }
              
            } catch (e) {
              console.log(`ChatAB: ChatGPT发送尝试${retryCount}失败:`, e);
              
              if (retryCount < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                return await attemptSend();
              } else {
                return false;
              }
            }
          }
          
          const sendResult = await attemptSend();
          if (!sendResult) {
            console.log('ChatAB: ChatGPT发送最终失败，尝试备用方案');
            // 这里可以添加备用发送方案，比如点击发送按钮
            try {
              const sendButton = document.querySelector('[data-testid="send-button"]') || 
                               document.querySelector('button[aria-label*="Send"]') ||
                               document.querySelector('button[title*="Send"]');
              if (sendButton && !sendButton.disabled) {
                console.log('ChatAB: 尝试点击ChatGPT发送按钮作为备用方案');
                sendButton.click();
                
                // 等待并检查发送结果
                await new Promise(resolve => setTimeout(resolve, 1500));
                const finalText = getChatGPTInputText();
                console.log('ChatAB: 备用方案发送后文本内容长度:', finalText.length);
                if (finalText.length === 0 || finalText.trim() === '') {
                  console.log('ChatAB: ChatGPT备用方案发送成功');
                  setTimeout(function() {
                    chrome.storage.local.remove(['inputValue']);
                    console.log('ChatAB: ChatGPT通过备用方案发送成功，清空 storage');
                  }, 1000);
                }
              }
            } catch (backupError) {
              console.log('ChatAB: ChatGPT备用发送方案也失败:', backupError);
            }
          }
        }
        
        // Perplexity专用发送函数
        async function sendPerplexityMessage() {
          console.log('ChatAB: 开始Perplexity专用发送流程');
          
          // 获取Perplexity输入框内容的函数
          function getPerplexityInputText() {
            if (chatInput.textContent !== undefined) {
              return chatInput.textContent.trim(); // contenteditable div
            } else if (chatInput.innerText !== undefined) {
              return chatInput.innerText.trim(); // 其他元素
            } else {
              return '';
            }
          }
          
          // 检查输入框内容
          const beforeSendText = getPerplexityInputText();
          console.log('ChatAB: Perplexity发送前文本内容长度:', beforeSendText.length);
          console.log('ChatAB: Perplexity发送前文本内容预览:', beforeSendText.substring(0, 100) + '...');
          
          // 如果没有文本内容，不发送
          if (!beforeSendText || beforeSendText.trim() === '') {
            console.log('ChatAB: Perplexity没有文本内容，跳过发送');
            return false;
          }
          
          let retryCount = 0;
          const maxRetries = 5;
          
          async function attemptSend() {
            retryCount++;
            console.log(`ChatAB: Perplexity发送尝试 ${retryCount}/${maxRetries}`);
            
            try {
              // 确保输入框处于焦点状态
              chatInput.focus();
              
              // 等待一下确保焦点已设置
              await new Promise(resolve => setTimeout(resolve, 200));
              
              // 优先尝试回车键发送
              console.log('ChatAB: Perplexity优先尝试回车键发送');
              
              // 触发keydown事件
              const keydownEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true,
                cancelable: true
              });
              chatInput.dispatchEvent(keydownEvent);
              
              // 触发keypress事件
              const keypressEvent = new KeyboardEvent('keypress', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true,
                cancelable: true
              });
              chatInput.dispatchEvent(keypressEvent);
              
              // 触发keyup事件
              const keyupEvent = new KeyboardEvent('keyup', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true,
                cancelable: true
              });
              chatInput.dispatchEvent(keyupEvent);
              
              console.log('ChatAB: Perplexity回车键事件已触发');
              
              // 等待页面响应
              await new Promise(resolve => setTimeout(resolve, 1500));
              
              // 检查文本框是否清空（判断发送是否成功）
              const afterSendText = getPerplexityInputText();
              console.log('ChatAB: Perplexity回车发送后文本内容长度:', afterSendText.length);
              console.log('ChatAB: Perplexity回车发送后文本内容预览:', afterSendText.substring(0, 50) + '...');
              
              // 检查发送是否成功的条件：
              // 1. 文本框完全清空，或者
              // 2. 文本内容明显减少（可能是部分发送成功）
              const textCleared = afterSendText.length === 0 || afterSendText.trim() === '';
              const textReduced = afterSendText.length < beforeSendText.length * 0.8; // 内容减少了80%以上
              
              if (textCleared || textReduced) {
                console.log('ChatAB: Perplexity回车发送成功，文本框已清空或内容明显减少');
                
                // 发送成功后清空 storage
                setTimeout(function() {
                  chrome.storage.local.remove(['inputValue']);
                  console.log('ChatAB: Perplexity通过回车键发送成功，清空 storage');
                }, 1000);
                
                return true; // 发送成功
              } else {
                console.log('ChatAB: Perplexity回车发送可能失败，尝试按钮发送作为备用方案');
                
                // 回车发送失败，尝试按钮发送作为备用方案
                const perplexitySendButton = document.querySelector('button[data-testid="submit-button"]');
                const sendButtons = [
                  perplexitySendButton,
                  ...document.querySelectorAll('button[aria-label*="Submit"], button[aria-label*="Send"]'),
                  ...document.querySelectorAll('button:has(svg[class*="arrow"]), button:has(svg[viewBox*="24"])'),
                  ...document.querySelectorAll('button[class*="bg-super"], button[class*="text-inverse"]'),
                  ...document.querySelectorAll('[data-testid*="send"], [aria-label*="发送"], [title*="发送"]'),
                  ...document.querySelectorAll('button[type="submit"], .send-btn, .submit-btn')
                ].filter(Boolean);
                
                console.log(`ChatAB: Perplexity找到发送按钮数量: ${sendButtons.length}`);
                
                // 查找可用的发送按钮
                let availableButton = null;
                for (let i = 0; i < Math.min(sendButtons.length, 5); i++) {
                  const btn = sendButtons[i];
                  const isDisabled = btn.disabled || 
                                   btn.hasAttribute('disabled') || 
                                   btn.classList.contains('disabled') ||
                                   btn.getAttribute('aria-disabled') === 'true' ||
                                   window.getComputedStyle(btn).pointerEvents === 'none';
                  
                  console.log(`ChatAB: Perplexity检查按钮${i + 1}:`, {
                    tagName: btn.tagName,
                    testId: btn.getAttribute('data-testid'),
                    ariaLabel: btn.getAttribute('aria-label'),
                    className: btn.className,
                    disabled: btn.disabled,
                    isDisabled
                  });
                  
                  if (!isDisabled) {
                    availableButton = btn;
                    console.log(`ChatAB: Perplexity找到可用发送按钮${i + 1}`);
                    break;
                  }
                }
                
                if (availableButton) {
                  console.log('ChatAB: Perplexity点击发送按钮作为备用方案');
                  availableButton.click();
                  
                  // 等待页面响应
                  await new Promise(resolve => setTimeout(resolve, 2000));
                  
                  // 检查按钮发送结果
                  const afterButtonSendText = getPerplexityInputText();
                  console.log('ChatAB: Perplexity按钮发送后文本内容长度:', afterButtonSendText.length);
                  
                  const buttonTextCleared = afterButtonSendText.length === 0 || afterButtonSendText.trim() === '';
                  const buttonTextReduced = afterButtonSendText.length < beforeSendText.length * 0.8;
                  
                  if (buttonTextCleared || buttonTextReduced) {
                    console.log('ChatAB: Perplexity按钮发送成功');
                    setTimeout(function() {
                      chrome.storage.local.remove(['inputValue']);
                      console.log('ChatAB: Perplexity通过按钮发送成功，清空 storage');
                    }, 1000);
                    return true;
                  }
                }
                
                // 如果还有重试次数，继续尝试
                if (retryCount < maxRetries) {
                  console.log(`ChatAB: Perplexity准备重试发送，剩余重试次数: ${maxRetries - retryCount}`);
                  await new Promise(resolve => setTimeout(resolve, 1500));
                  return await attemptSend();
                } else {
                  console.log('ChatAB: Perplexity发送失败，已达最大重试次数');
                  return false;
                }
              }
              
            } catch (e) {
              console.log(`ChatAB: Perplexity发送尝试${retryCount}失败:`, e);
              
              if (retryCount < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1500));
                return await attemptSend();
              } else {
                return false;
              }
            }
          }
          
          const sendResult = await attemptSend();
          if (!sendResult) {
            console.log('ChatAB: Perplexity发送最终失败');
          }
        }
        
        // Doubao专用发送函数
        async function sendDoubaoMessage() {
          console.log('ChatAB: 开始Doubao专用发送流程');
          
          // 获取Doubao输入框内容的函数
          function getDoubaoInputText() {
            if (chatInput.value !== undefined) {
              return chatInput.value; // textarea
            } else if (chatInput.textContent !== undefined) {
              return chatInput.textContent; // contenteditable div
            } else if (chatInput.innerText !== undefined) {
              return chatInput.innerText; // 其他元素
            } else {
              return '';
            }
          }
          
          // 检查输入框内容
          const beforeSendText = getDoubaoInputText();
          console.log('ChatAB: Doubao发送前文本内容长度:', beforeSendText.length);
          console.log('ChatAB: Doubao发送前文本内容预览:', beforeSendText.substring(0, 100) + '...');
          
          // 如果没有文本内容，不发送
          if (!beforeSendText || beforeSendText.trim() === '') {
            console.log('ChatAB: Doubao没有文本内容，跳过发送');
            return false;
          }
          
          let retryCount = 0;
          const maxRetries = 5;
          
          async function attemptSend() {
            retryCount++;
            console.log(`ChatAB: Doubao发送尝试 ${retryCount}/${maxRetries}`);
            
            try {
              // 确保输入框处于焦点状态
              chatInput.focus();
              
              // 等待一下确保焦点已设置
              await new Promise(resolve => setTimeout(resolve, 200));
              
              // 优先尝试回车键发送（类似ChatGPT）
              console.log('ChatAB: Doubao优先尝试回车键发送');
              
              // 触发keydown事件
              const keydownEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true,
                cancelable: true
              });
              chatInput.dispatchEvent(keydownEvent);
              
              // 触发keypress事件
              const keypressEvent = new KeyboardEvent('keypress', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true,
                cancelable: true
              });
              chatInput.dispatchEvent(keypressEvent);
              
              // 触发keyup事件
              const keyupEvent = new KeyboardEvent('keyup', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true,
                cancelable: true
              });
              chatInput.dispatchEvent(keyupEvent);
              
              console.log('ChatAB: Doubao回车键事件已触发');
              
              // 等待页面响应
              await new Promise(resolve => setTimeout(resolve, 2000));
              
              // 检查文本框是否清空（判断发送是否成功）
              const afterSendText = getDoubaoInputText();
              console.log('ChatAB: Doubao回车发送后文本内容长度:', afterSendText.length);
              console.log('ChatAB: Doubao回车发送后文本内容预览:', afterSendText.substring(0, 50) + '...');
              
              // 检查发送是否成功的条件：
              // 1. 文本框完全清空，或者
              // 2. 文本内容明显减少（可能是部分发送成功）
              const textCleared = afterSendText.length === 0 || afterSendText.trim() === '';
              const textReduced = afterSendText.length < beforeSendText.length * 0.8; // 内容减少了80%以上
              
              if (textCleared || textReduced) {
                console.log('ChatAB: Doubao回车发送成功，文本框已清空或内容明显减少');
                
                // 发送成功后清空 storage
                setTimeout(function() {
                  chrome.storage.local.remove(['inputValue']);
                  console.log('ChatAB: Doubao通过回车键发送成功，清空 storage');
                }, 1000);
                
                return true; // 发送成功
              } else {
                console.log('ChatAB: Doubao回车发送可能失败，尝试按钮发送作为备用方案');
                
                // 回车发送失败，尝试按钮发送作为备用方案
                const doubaoSendButton = document.querySelector('button[data-testid="chat_input_send_button"]');
                const sendButtons = [
                  doubaoSendButton,
                  ...document.querySelectorAll('[data-testid*="send"], [aria-label*="发送"], [aria-label*="Send"], [title*="发送"], [title*="Send"]'),
                  ...document.querySelectorAll('button[type="submit"], .send-btn, .submit-btn'),
                  ...document.querySelectorAll('button:has(svg), button[class*="send"], button[class*="submit"]'),
                  ...document.querySelectorAll('[role="button"][aria-label*="发送"], [role="button"][aria-label*="Send"]')
                ].filter(Boolean);
                
                console.log(`ChatAB: Doubao找到发送按钮数量: ${sendButtons.length}`);
                
                // 查找可用的发送按钮
                let availableButton = null;
                for (let i = 0; i < Math.min(sendButtons.length, 5); i++) {
                  const btn = sendButtons[i];
                  const isDisabled = btn.disabled || 
                                   btn.hasAttribute('disabled') || 
                                   btn.classList.contains('disabled') ||
                                   btn.getAttribute('aria-disabled') === 'true' ||
                                   window.getComputedStyle(btn).pointerEvents === 'none';
                  
                  if (!isDisabled) {
                    availableButton = btn;
                    console.log(`ChatAB: Doubao找到可用发送按钮${i + 1}`);
                    break;
                  }
                }
                
                if (availableButton) {
                  console.log('ChatAB: Doubao点击发送按钮作为备用方案');
                  availableButton.click();
                  
                  // 等待页面响应
                  await new Promise(resolve => setTimeout(resolve, 2000));
                  
                  // 检查按钮发送结果
                  const afterButtonSendText = getDoubaoInputText();
                  console.log('ChatAB: Doubao按钮发送后文本内容长度:', afterButtonSendText.length);
                  
                  const buttonTextCleared = afterButtonSendText.length === 0 || afterButtonSendText.trim() === '';
                  const buttonTextReduced = afterButtonSendText.length < beforeSendText.length * 0.8;
                  
                  if (buttonTextCleared || buttonTextReduced) {
                    console.log('ChatAB: Doubao按钮发送成功');
                    setTimeout(function() {
                      chrome.storage.local.remove(['inputValue']);
                      console.log('ChatAB: Doubao通过按钮发送成功，清空 storage');
                    }, 1000);
                    return true;
                  }
                }
                
                // 如果还有重试次数，继续尝试
                if (retryCount < maxRetries) {
                  console.log(`ChatAB: Doubao准备重试发送，剩余重试次数: ${maxRetries - retryCount}`);
                  await new Promise(resolve => setTimeout(resolve, 1500));
                  return await attemptSend();
                } else {
                  console.log('ChatAB: Doubao发送失败，已达最大重试次数');
                  return false;
                }
              }
              
            } catch (e) {
              console.log(`ChatAB: Doubao发送尝试${retryCount}失败:`, e);
              
              if (retryCount < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1500));
                return await attemptSend();
              } else {
                return false;
              }
            }
          }
          
          const sendResult = await attemptSend();
          if (!sendResult) {
            console.log('ChatAB: Doubao发送最终失败');
          }
        }
        
        // 发送函数 - 提前定义确保作用域正确
        async function sendMessage() {
          console.log(`ChatAB: ${siteName} 开始尝试发送消息`);
          
          // 聚焦输入框
          chatInput.focus();
          
          // 等待一下再尝试发送
          setTimeout(async function() {
            // 对于ChatGPT，优先使用回车键发送
            if (isChatGPT) {
              console.log('ChatAB: ChatGPT使用回车键发送');
              await sendChatGPTMessage();
              return; // ChatGPT处理完成，退出
            }
            
            // 对于Perplexity，使用专用的发送逻辑
            if (isPerplexity) {
              console.log('ChatAB: Perplexity使用专用发送逻辑');
              await sendPerplexityMessage();
              return; // Perplexity处理完成，退出
            }
            
            // 对于Doubao，使用专用的发送逻辑
            if (isDoubao) {
              console.log('ChatAB: Doubao使用专用发送逻辑');
              await sendDoubaoMessage();
              return; // Doubao处理完成，退出
            }
            
            // 其他网站使用原有的按钮点击逻辑
            // 方法1: 查找并点击发送按钮（优先）
            const doubaoSendButton = document.querySelector('button[data-testid="chat_input_send_button"]');
            const sendButtons = [
              doubaoSendButton,
              ...document.querySelectorAll('[data-testid*="send"], [aria-label*="发送"], [aria-label*="Send"], [title*="发送"], [title*="Send"]'),
              ...document.querySelectorAll('button[type="submit"], .send-btn, .submit-btn'),
              ...document.querySelectorAll('button:has(svg), button[class*="send"], button[class*="submit"]'),
              ...document.querySelectorAll('[role="button"][aria-label*="发送"], [role="button"][aria-label*="Send"]')
            ].filter(Boolean);
            
            console.log(`ChatAB: ${siteName} 找到发送按钮数量:`, sendButtons.length);
            
            if (sendButtons.length > 0) {
              // 检查发送按钮状态并等待可用
              let availableButton = null;
              
              for (let waitTime = 0; waitTime < 10; waitTime++) {
                for (let i = 0; i < Math.min(sendButtons.length, 5); i++) {
                  const btn = sendButtons[i];
                  const isDisabled = btn.disabled || 
                                   btn.getAttribute('aria-disabled') === 'true' ||
                                   btn.classList.contains('disabled') || 
                                   btn.classList.contains('semi-button-disabled') ||
                                   btn.classList.contains('semi-button-primary-disabled');
                  
                  console.log(`ChatAB: ${siteName} 检查第${i + 1}个发送按钮(等待${waitTime}次):`, {
                    tagName: btn.tagName,
                    disabled: btn.disabled,
                    className: btn.className,
                    isVisible: btn.offsetParent !== null,
                    isDisabled
                  });
                  
                  if (!isDisabled && btn.offsetParent !== null) {
                    availableButton = btn;
                    console.log(`ChatAB: ${siteName} 找到可用发送按钮:`, btn.className);
                    break;
                  }
                }
                
                if (availableButton) break;
                
                // 如果所有按钮都被禁用，等待一下并重新触发状态更新
                console.log(`ChatAB: ${siteName} 所有发送按钮都被禁用，等待页面状态更新...`);
                
                // 重新聚焦输入框，触发状态更新
                if (chatInput) {
                  chatInput.focus();
                  chatInput.blur();
                  chatInput.focus();
                  
                  // 触发额外的事件来更新页面状态
                  ['input', 'change', 'keyup'].forEach(eventType => {
                    const event = new Event(eventType, { bubbles: true });
                    chatInput.dispatchEvent(event);
                  });
                }
                
                await new Promise(resolve => setTimeout(resolve, 800));
              }
              
              if (availableButton) {
                try {
                  availableButton.click();
                  console.log(`ChatAB: ${siteName} 点击发送按钮成功`);
                  
                  // 发送成功后清空 storage
                  setTimeout(function() {
                    chrome.storage.local.remove(['inputValue']);
                    console.log('ChatAB: 通过按钮发送成功，清空 storage');
                  }, 1000);
                  return; // 成功发送，退出
                } catch (e) {
                  console.log(`ChatAB: ${siteName} 点击可用按钮失败:`, e);
                }
              } else {
                console.log(`ChatAB: ${siteName} 等待后仍无可用发送按钮，继续尝试键盘发送`);
              }
            }
            
            // 方法2: 使用键盘事件（备用）
            console.log(`ChatAB: ${siteName} 按钮发送失败，尝试键盘发送`);
            
            try {
              // 先触发keydown事件
              const keydownEvent = new KeyboardEvent('keydown', {
                key: 'Enter',
                code: 'Enter',
                keyCode: 13,
                which: 13,
                bubbles: true,
                cancelable: true
              });
              chatInput.dispatchEvent(keydownEvent);
              
              console.log(`ChatAB: ${siteName} 键盘事件发送完成`);
              
              // 发送成功后清空 storage
              setTimeout(function() {
                chrome.storage.local.remove(['inputValue']);
                console.log('ChatAB: 通过键盘发送完成，清空 storage');
              }, 1000);
              
            } catch (e) {
              console.log(`ChatAB: ${siteName} 键盘事件失败:`, e);
            }
          }, 800);
        }
        
        // 直接填充文本内容并发送
        fillTextContent().then(() => {
          setTimeout(() => sendMessage(), 1000);
        });
        
        async function fillTextContent() {
          // 如果没有文本内容，直接返回
          if (!inputValue || !inputValue.trim()) {
            console.log('ChatAB: 没有文本内容');
            return;
          }
          
          console.log('ChatAB: 开始填充文本内容:', inputValue.substring(0, 50) + '...');
          
          // 填充内容 - 使用更真实的方式
        if (chatInput.tagName.toLowerCase() === 'textarea' || chatInput.tagName.toLowerCase() === 'input') {
            // 先清空内容
            chatInput.value = '';
            
            // 聚焦输入框
            chatInput.focus();
            
            // 模拟真实的输入过程
            for (let i = 0; i < inputValue.length; i++) {
              chatInput.value += inputValue[i];
              
          // 触发输入事件
              const inputEvent = new Event('input', { bubbles: true, cancelable: true });
              Object.defineProperty(inputEvent, 'target', { value: chatInput });
              Object.defineProperty(inputEvent, 'data', { value: inputValue[i] });
          chatInput.dispatchEvent(inputEvent);
          
              // 每10个字符暂停一下，模拟真实输入
              if (i % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 10));
              }
            }
            
            // 最后触发完整的事件序列
            const events = [
              'input',
              'change', 
              'keyup',
              'compositionend'
            ];
            
            for (const eventType of events) {
              const event = new Event(eventType, { bubbles: true, cancelable: true });
              Object.defineProperty(event, 'target', { value: chatInput });
              chatInput.dispatchEvent(event);
              await new Promise(resolve => setTimeout(resolve, 50));
            }
            
            // 尝试触发React的状态更新
            if (chatInput._valueTracker) {
              chatInput._valueTracker.setValue(inputValue);
            }
            
            console.log('ChatAB: 文本内容填充完成');
        } else if (chatInput.getAttribute('contenteditable') === 'true') {
          if (isPerplexity && (chatInput.getAttribute('data-lexical-editor') === 'true' || chatInput.id === 'ask-input')) {
            // Perplexity 的 Lexical 编辑器特殊处理
            console.log('ChatAB: Perplexity Lexical编辑器特殊处理');
            
            // 聚焦编辑器
            chatInput.focus();
            
            try {
              // 优先尝试使用 document.execCommand 插入文本
              if (document.execCommand) {
                // 先清空内容
                document.execCommand('selectAll', false, null);
                document.execCommand('delete', false, null);
                
                // 插入文本，让浏览器自动处理换行
                document.execCommand('insertText', false, inputValue);
                console.log('ChatAB: Perplexity使用execCommand插入文本成功');
              } else {
                throw new Error('execCommand not supported');
              }
            } catch (e) {
              console.log('ChatAB: execCommand失败，使用备用方案:', e);
              
              try {
                // 备用方案1：模拟用户输入
                chatInput.innerHTML = '';
                chatInput.focus();
                
                // 创建一个文本节点并插入
                const textNode = document.createTextNode(inputValue);
                chatInput.appendChild(textNode);
                
                // 设置光标到末尾
                const range = document.createRange();
                const selection = window.getSelection();
                range.selectNodeContents(chatInput);
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);
                
                console.log('ChatAB: Perplexity使用文本节点插入成功');
              } catch (e2) {
                console.log('ChatAB: 文本节点插入失败，使用最后备用方案:', e2);
                
                // 最后备用方案：使用简单的 <br> 标签处理换行
                chatInput.innerHTML = '';
                const formattedHTML = inputValue.replace(/\n/g, '<br>');
                chatInput.innerHTML = formattedHTML;
              }
            }
            
            // 触发必要的事件
            ['input', 'change', 'keyup', 'paste'].forEach(eventType => {
              const event = new Event(eventType, { bubbles: true, cancelable: true });
              chatInput.dispatchEvent(event);
            });
            
            // 额外触发一个自定义事件
            const customEvent = new Event('input', { bubbles: true });
            setTimeout(() => {
              chatInput.dispatchEvent(customEvent);
            }, 100);
          } else if ((isKimi && chatInput.getAttribute('data-lexical-editor') === 'true') ||
              (isYiyan && chatInput.getAttribute('data-lexical-editor') === 'true')) {
            // Kimi 和 Yiyan 的 Lexical 编辑器特殊处理
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
            // 判断是否为ProseMirror编辑器（ChatGPT和Grok使用）
            if (chatInput.classList.contains('ProseMirror') || chatInput.id === 'prompt-textarea') {
              console.log('ChatAB: 检测到ProseMirror编辑器，使用p标签格式');
              
              // 检查是否是Grok的TipTap编辑器
              const isGrokTipTap = isGrok && chatInput.classList.contains('tiptap');
              
              const paragraphs = inputValue.split('\n');
              let formattedHTML = '';
              
              paragraphs.forEach((paragraph, index) => {
                if (paragraph.trim() === '') {
                  // 空行处理
                  if (isGrokTipTap) {
                    // Grok TipTap格式的空行
                    formattedHTML += '<p data-placeholder="What do you want to know?" class="is-empty is-editor-empty"><br class="ProseMirror-trailingBreak"></p>';
                  } else {
                    // ChatGPT格式的空行
                    formattedHTML += '<p><br class="ProseMirror-trailingBreak"></p>';
                  }
                } else {
                  // 非空行处理
                  if (isGrokTipTap && index === 0 && paragraphs.length === 1) {
                    // Grok TipTap格式：单行文本，移除placeholder属性
                    formattedHTML += `<p>${paragraph}</p>`;
                  } else {
                    // 标准格式
                    formattedHTML += `<p>${paragraph}</p>`;
                  }
                }
              });
              
              chatInput.innerHTML = formattedHTML;
              
              // 对于Grok TipTap编辑器，需要移除placeholder相关的类
              if (isGrokTipTap && inputValue.trim()) {
                // 移除空编辑器的类
                const firstP = chatInput.querySelector('p');
                if (firstP) {
                  firstP.classList.remove('is-empty', 'is-editor-empty');
                  firstP.removeAttribute('data-placeholder');
                }
              }
            } else {
              // 对于其他 contenteditable 的 div (主要是 Gemini)
              chatInput.innerHTML = inputValue.replace(/\n/g, '<br>');
            }
            
            // 触发输入事件
            const inputEvent = new Event('input', { bubbles: true });
            chatInput.dispatchEvent(inputEvent);
          }
        }
        }
      } else {
        console.log('ChatAB: 没有找到输入框');
        
        // 对于 Perplexity、Kimi、Tongyi、Yuanbao、Grok 和 Yiyan，如果没找到输入框，再等待一下再试
        if (isPerplexity || isKimi || isTongyi || isYuanbao || isGrok || isYiyan) {
          setTimeout(async function() {
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
              console.log('ChatAB: Yuanbao 二次尝试选择器测试:');
              const retrySelectors = [
                '.chat-input-editor .ql-editor[contenteditable="true"]',
                'div.ql-editor.ql-blank[contenteditable="true"]',
                'div.ql-editor[contenteditable="true"]',
                '.ql-editor[contenteditable="true"]',
                '.ql-container .ql-editor[contenteditable="true"]',
                'div[contenteditable="true"][enterkeyhint="send"]',
                'div[contenteditable="true"]'
              ];
              
              retryInput = null;
              for (let i = 0; i < retrySelectors.length; i++) {
                const selector = retrySelectors[i];
                const element = document.querySelector(selector);
                console.log(`  二次选择器 ${i + 1}: "${selector}" -> ${element ? '找到' : '未找到'}`);
                if (element && !retryInput) {
                  retryInput = element;
                  console.log(`  ✓ 二次尝试使用选择器 ${i + 1}: "${selector}"`);
                  break;
                }
              }
            } else if (isGrok) {
              // Grok TipTap ProseMirror 重试选择器
              retryInput = document.querySelector('div.tiptap.ProseMirror[contenteditable="true"]') ||
                          document.querySelector('div.ProseMirror[contenteditable="true"].w-full') ||
                          document.querySelector('div.tiptap[contenteditable="true"]') ||
                          document.querySelector('div.ProseMirror[contenteditable="true"]') ||
                          document.querySelector('div[contenteditable="true"][data-placeholder*="What do you want to know?"]') ||
                          document.querySelector('div[contenteditable="true"].w-full.px-2') ||
                          document.querySelector('div[contenteditable="true"][translate="no"]') ||
                          // 备用方案：旧的textarea选择器
                          document.querySelector('textarea[aria-label*="Ask Grok anything"]') ||
                          document.querySelector('textarea[aria-label*="Ask Grok"]') ||
                          document.querySelector('textarea[aria-label*="Grok"]') ||
                          document.querySelector('textarea.w-full.bg-transparent') ||
                          document.querySelector('textarea[dir="auto"]') ||
                          document.querySelector('div[contenteditable="true"]') ||
                          document.querySelector('textarea');
            } else if (isYiyan) {
              retryInput = document.querySelector('.yc-editor[contenteditable="true"][data-lexical-editor="true"]') ||
                          document.querySelector('div.yc-editor[contenteditable="true"]') ||
                          document.querySelector('.yc-editor[role="textbox"]') ||
                          document.querySelector('div[data-lexical-editor="true"][role="textbox"]') ||
                          document.querySelector('.yc-editor') ||
                          document.querySelector('div[contenteditable="true"]');
            }
            
            if (retryInput) {
              console.log(`ChatAB: ${siteName} 二次尝试找到输入框`);
              retryInput.focus();
              
              // 特殊处理Perplexity的Lexical编辑器
              if (isPerplexity && (retryInput.getAttribute('data-lexical-editor') === 'true' || retryInput.id === 'ask-input')) {
                console.log('ChatAB: Perplexity 二次尝试 - Lexical编辑器特殊处理');
                
                try {
                  // 优先尝试使用 document.execCommand 插入文本
                  if (document.execCommand) {
                    // 先清空内容
                    document.execCommand('selectAll', false, null);
                    document.execCommand('delete', false, null);
                    
                    // 插入文本，让浏览器自动处理换行
                    document.execCommand('insertText', false, inputValue);
                    console.log('ChatAB: Perplexity二次尝试使用execCommand插入文本成功');
                  } else {
                    throw new Error('execCommand not supported');
                  }
                } catch (e) {
                  console.log('ChatAB: 二次尝试execCommand失败，使用备用方案:', e);
                  
                  try {
                    // 备用方案1：模拟用户输入
                    retryInput.innerHTML = '';
                    retryInput.focus();
                    
                    // 创建一个文本节点并插入
                    const textNode = document.createTextNode(inputValue);
                    retryInput.appendChild(textNode);
                    
                    console.log('ChatAB: Perplexity二次尝试使用文本节点插入成功');
                  } catch (e2) {
                    console.log('ChatAB: 二次尝试文本节点插入失败，使用最后备用方案:', e2);
                    
                    // 最后备用方案：使用简单的 <br> 标签处理换行
                    retryInput.innerHTML = '';
                    const formattedHTML = inputValue.replace(/\n/g, '<br>');
                    retryInput.innerHTML = formattedHTML;
                  }
                }
                
                // 触发必要的事件
                ['input', 'change', 'keyup', 'paste'].forEach(eventType => {
                  const event = new Event(eventType, { bubbles: true });
                  retryInput.dispatchEvent(event);
                });
              } else if (isYiyan && retryInput.getAttribute('data-lexical-editor') === 'true') {
                console.log(`ChatAB: ${siteName} 二次尝试 - Lexical编辑器特殊处理`);
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
                ['input', 'change', 'keyup'].forEach(eventType => {
                  const event = new Event(eventType, { bubbles: true });
                  retryInput.dispatchEvent(event);
                });
              } else if (isYuanbao && retryInput.classList.contains('ql-editor')) {
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
              } else if (isGrok && (retryInput.classList.contains('tiptap') || retryInput.classList.contains('ProseMirror'))) {
                // 特殊处理Grok的TipTap ProseMirror编辑器
                console.log(`ChatAB: ${siteName} 二次尝试 - TipTap ProseMirror编辑器特殊处理`);
                
                // 先清空内容
                retryInput.innerHTML = '';
                
                if (document.execCommand) {
                  document.execCommand('insertText', false, inputValue);
                } else {
                  // 使用Grok TipTap格式
                  const paragraphs = inputValue.split('\n');
                  let formattedHTML = '';
                  
                  paragraphs.forEach((paragraph, index) => {
                    if (paragraph.trim() === '') {
                      formattedHTML += '<p data-placeholder="What do you want to know?" class="is-empty is-editor-empty"><br class="ProseMirror-trailingBreak"></p>';
                    } else {
                      formattedHTML += `<p>${paragraph}</p>`;
                    }
                  });
                  
                  retryInput.innerHTML = formattedHTML;
                  
                  // 移除placeholder相关的类
                  if (inputValue.trim()) {
                    const firstP = retryInput.querySelector('p');
                    if (firstP) {
                      firstP.classList.remove('is-empty', 'is-editor-empty');
                      firstP.removeAttribute('data-placeholder');
                    }
                  }
                }
                
                // 触发TipTap特定事件
                ['input', 'change', 'keyup'].forEach(eventType => {
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

console.log('ChatAB: 准备启动脚本，当前document.readyState:', document.readyState);

// 1. DOMContentLoaded - 比load事件更早触发
if (document.readyState === 'loading') {
  console.log('ChatAB: 文档正在加载，等待DOMContentLoaded事件');
  document.addEventListener('DOMContentLoaded', function() {
    if (!scriptExecuted) {
      scriptExecuted = true;
      console.log('ChatAB: 通过DOMContentLoaded启动');
      initScript();
    }
  });
} else {
  // 2. 文档已经加载完成，直接执行
  console.log('ChatAB: 文档已加载，直接启动，readyState:', document.readyState);
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