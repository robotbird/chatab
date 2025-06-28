// 保存选项到chrome.storage
function saveOptions() {
  const showUrlParams = document.getElementById('showUrlParams').checked;
  const displayDuration = document.getElementById('displayDuration').value;
  
  chrome.storage.sync.set(
    {
      showUrlParams: showUrlParams,
      displayDuration: displayDuration
    },
    function() {
      // 更新状态以让用户知道选项已保存
      const status = document.getElementById('status');
      status.style.display = 'block';
      setTimeout(function() {
        status.style.display = 'none';
      }, 1500);
    }
  );
}

// 从chrome.storage恢复保存的选项
function restoreOptions() {
  chrome.storage.sync.get(
    {
      // 默认值
      showUrlParams: true,
      displayDuration: 5
    },
    function(items) {
      document.getElementById('showUrlParams').checked = items.showUrlParams;
      document.getElementById('displayDuration').value = items.displayDuration;
    }
  );
}

// 初始化页面设置
document.addEventListener('DOMContentLoaded', restoreOptions);
// 绑定保存按钮的点击事件
document.getElementById('save').addEventListener('click', saveOptions); 