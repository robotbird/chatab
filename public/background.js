// background.js - 扩展的后台脚本
console.log('ChatAB Extension: Background script loaded');

// 存储当前状态
let deepSeekPageStatus = {
  isActive: false,
  pageInfo: null,
  tabId: null
};

// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 页面加载完成时的处理
  if (message.action === 'pageLoaded' && message.isDeepSeekPage) {
    deepSeekPageStatus.isActive = true;
    deepSeekPageStatus.pageInfo = message.pageInfo;
    deepSeekPageStatus.tabId = sender.tab.id;
    
    // 存储信息到chrome.storage
    chrome.storage.local.set({ deepSeekPageStatus });
    
    // 可以通知扩展中的其他组件
    chrome.runtime.sendMessage({
      action: 'deepSeekStatusChanged',
      status: deepSeekPageStatus
    });
  }
  
  // 页面更新时的处理
  if (message.action === 'pageUpdated') {
    deepSeekPageStatus.pageInfo = message.pageInfo;
    
    // 更新存储的信息
    chrome.storage.local.set({ deepSeekPageStatus });
    
    // 通知扩展中的其他组件
    chrome.runtime.sendMessage({
      action: 'deepSeekStatusChanged',
      status: deepSeekPageStatus
    });
  }
});

// 监听标签页的变化
chrome.tabs.onActivated.addListener((activeInfo) => {
  // 检查当前活跃标签页是否是我们之前记录的DeepSeek页面
  if (deepSeekPageStatus.tabId === activeInfo.tabId) {
    // 如果是，保持状态为活跃
    deepSeekPageStatus.isActive = true;
  } else {
    // 如果不是，将状态设为非活跃
    deepSeekPageStatus.isActive = false;
  }
  
  // 更新存储并通知
  chrome.storage.local.set({ deepSeekPageStatus });
  chrome.runtime.sendMessage({
    action: 'deepSeekStatusChanged',
    status: deepSeekPageStatus
  });
});

// 标签页关闭时的处理
chrome.tabs.onRemoved.addListener((tabId) => {
  if (deepSeekPageStatus.tabId === tabId) {
    deepSeekPageStatus = {
      isActive: false,
      pageInfo: null,
      tabId: null
    };
    
    // 更新存储并通知
    chrome.storage.local.set({ deepSeekPageStatus });
    chrome.runtime.sendMessage({
      action: 'deepSeekStatusChanged',
      status: deepSeekPageStatus
    });
  }
}); 