import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Frame } from "./screens/Frame";
import "../tailwind.css";
import { wallpaperService } from "./lib/wallpaperService";
import "./i18n"; // Import i18n configuration

// 提前初始化壁纸，确保新标签页一打开就应用背景
(async () => {
  try {
    await wallpaperService.initialize();
    // 周期性检查是否需要自动更新（每分钟）
    setInterval(() => {
      wallpaperService.autoUpdateWallpaper().catch(() => {});
    }, 60000);
  } catch (e) {
    // 忽略错误，避免影响页面加载
    console.error("Wallpaper init failed", e);
  }
})();

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <Frame />
  </StrictMode>,
);
