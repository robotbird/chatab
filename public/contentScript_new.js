/**
 * ChatAB Content Script - 模块化版本
 * 主入口文件，负责网站检测和调度
 */

// 全局变量
let scriptExecuted = false;
let handlerFactory = null;

/**
 * 主初始化函数
 */
function initScript() {
  console.log('ChatAB: initScript 函数开始执行');
  
  const url = new URL(window.location.href);
  console.log('ChatAB: 解析后的URL对象:', url);
  
  // 检查是否已加载必要的依赖
  if (!window.ChatABConstants || !window.ChatABUtils || !window.BaseHandler || !window.HandlerFactory) {
    console.error('ChatAB: 依赖文件未完全加载，等待加载完成...');
    setTimeout(initScript, 1000);
    return;
  }
  
  // 创建处理器工厂
  if (!handlerFactory) {
    handlerFactory = new window.HandlerFactory();
  }
  
  // 检测当前网站并创建处理器
  const handler = handlerFactory.createHandlerForSite(url.hostname);
  
  if (!handler) {
    console.log('ChatAB: 当前网站不在支持列表中');
    return;
  }
  
  console.log(`ChatAB: 检测到支持的网站: ${handler.siteName}`);
  
  // 对于特定网站，添加页面状态详细检查
  if (handler.siteName === 'Yiyan') {
    handler.debugPageState();
  }
  
  // 从 storage 获取输入内容
  chrome.storage.local.get(['inputValue'], function(result) {
    const inputValue = result.inputValue;
    
    if (!inputValue || !inputValue.trim()) {
      console.log('ChatAB: 没有找到要提交的内容');
      return;
    }
    
    console.log('ChatAB: 从 storage 获取到内容:', inputValue ? inputValue.substring(0, 50) + '...' : '无文本');
    
    // 获取网站配置
    const { SUPPORTED_SITES } = window.ChatABConstants;
    const siteKey = window.ChatABUtils.detectSite(url.hostname);
    const siteConfig = SUPPORTED_SITES[siteKey];
    const delay = siteConfig ? siteConfig.delay : 2000;
    
    // 延迟执行，确保页面完全加载
    setTimeout(async function() {
      try {
        await handler.handle(inputValue);
      } catch (error) {
        console.error(`ChatAB: ${handler.siteName} 处理过程中出现错误:`, error);
      }
    }, delay);
  });
}

/**
 * 确保脚本能够执行的多种方式
 */
function ensureScriptExecution() {
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
}

// 监听从扩展发来的消息
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === 'checkAutoFill') {
    sendResponse({ status: 'ready' });
  }
});

// 启动脚本
ensureScriptExecution();
