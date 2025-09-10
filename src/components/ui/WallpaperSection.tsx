import React, { useState, useEffect } from 'react';
import { Image, RefreshCw, ChevronDown } from 'lucide-react';
import { wallpaperService, WallpaperData, WallpaperSettings } from '../../lib/wallpaperService';

interface WallpaperSectionProps {
  isDark: boolean;
}

export const WallpaperSection: React.FC<WallpaperSectionProps> = ({ isDark }) => {
  const [currentWallpaper, setCurrentWallpaper] = useState<WallpaperData | null>(null);
  const [wallpaperSettings, setWallpaperSettings] = useState<WallpaperSettings>({ mode: 'manual' });
  const [isLoading, setIsLoading] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);

  const wallpaperModes = [
    { id: 'manual', name: '手动切换', description: '点击换一个按钮手动切换' },
    { id: 'daily', name: '每日自动更新', description: '跟随 Bing 每日壁纸自动更新' },
    { id: 'disabled', name: '关闭壁纸功能', description: '不显示背景壁纸' }
  ];

  // 加载当前壁纸和设置
  useEffect(() => {
    const loadWallpaperData = async () => {
      const settings = wallpaperService.getWallpaperSettings();
      setWallpaperSettings(settings);
      
      const current = wallpaperService.getCurrentWallpaper();
      if (current) {
        setCurrentWallpaper(current);
        setThumbnailError(false);
      } else {
        // 如果没有当前壁纸，尝试获取今日壁纸作为默认
        setIsLoading(true);
        try {
          const todayWallpaper = await wallpaperService.getTodayWallpaper();
          if (todayWallpaper) {
            setCurrentWallpaper(todayWallpaper);
            wallpaperService.saveCurrentWallpaper(todayWallpaper);
            setThumbnailError(false);
          }
        } catch (error) {
          console.error('Failed to load default wallpaper:', error);
          setThumbnailError(true);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadWallpaperData();
    
    // 监听来自服务的壁纸更新事件，保持缩略图同步
    const handleUpdated = () => {
      const current = wallpaperService.getCurrentWallpaper();
      if (current) {
        setCurrentWallpaper(current);
        setThumbnailError(false);
      }
    };
    
    window.addEventListener('wallpaper-updated' as any, handleUpdated);
    
    return () => {
      window.removeEventListener('wallpaper-updated' as any, handleUpdated);
    };
  }, []);

  // 切换壁纸
  const handleSwitchWallpaper = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setThumbnailError(false);
    
    try {
      const newWallpaper = await wallpaperService.switchWallpaper();
      if (newWallpaper) {
        setCurrentWallpaper(newWallpaper);
        console.log('Switched to new wallpaper:', newWallpaper.title);
      } else {
        setThumbnailError(true);
      }
    } catch (error) {
      console.error('Failed to switch wallpaper:', error);
      setThumbnailError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理壁纸模式切换
  const handleModeChange = async (mode: WallpaperSettings['mode']) => {
    const newSettings = { ...wallpaperSettings, mode };
    setWallpaperSettings(newSettings);
    wallpaperService.setWallpaperMode(mode);
    
    if (mode === 'disabled') {
      wallpaperService.removeWallpaper();
    } else if (currentWallpaper) {
      wallpaperService.applyWallpaper(currentWallpaper.url);
    }
  };

  // 处理缩略图加载错误
  const handleThumbnailError = () => {
    setThumbnailError(true);
  };

  // 获取缩略图URL（缩小版本以提高加载速度）
  const getThumbnailUrl = (wallpaper?: WallpaperData | null) => {
    if (!wallpaper) return '';
    if (wallpaper.thumbnailUrl) return wallpaper.thumbnailUrl;
    const originalUrl = wallpaper.url;
    // 兜底：尝试通过参数缩放
    try {
      const url = new URL(originalUrl);
      url.searchParams.set('w', '480');
      url.searchParams.set('h', '270');
      return url.toString();
    } catch {
      return originalUrl;
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Image className="w-4 h-4" />
        <h3 className="text-sm font-medium">壁纸</h3>
      </div>
      
      <div className="space-y-4">
        {/* 壁纸缩略图和切换按钮 */}
        <div className="space-y-3">
          {/* 当前壁纸缩略图 */}
          <div className="relative">
            <div className={`w-full h-24 rounded-lg border-2 overflow-hidden ${
              isDark ? 'border-gray-600' : 'border-gray-200'
            }`}>
              {currentWallpaper && !thumbnailError ? (
                <img
                  src={getThumbnailUrl(currentWallpaper)}
                  alt={currentWallpaper.title || '当前壁纸'}
                  className="w-full h-full object-cover"
                  onError={handleThumbnailError}
                />
              ) : (
                <div className={`w-full h-full flex flex-col items-center justify-center ${
                  isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                }`}>
                  <Image className="w-8 h-8 mb-2" />
                  {thumbnailError && (
                    <button
                      onClick={handleSwitchWallpaper}
                      disabled={isLoading}
                      className="text-xs px-2 py-1 rounded border hover:bg-opacity-80 transition-colors"
                    >
                      {isLoading ? '重试中...' : '重试'}
                    </button>
                  )}
                </div>
              )}
              
              {/* 加载指示器 */}
              {isLoading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>
            
            {/* 壁纸信息 */}
            {currentWallpaper && !thumbnailError && (
              <div className="mt-2">
                <p className={`text-xs truncate ${
                  isDark ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {currentWallpaper.title || currentWallpaper.copyright || '必应每日壁纸'}
                </p>
              </div>
            )}
          </div>
          
          {/* 换一个按钮 */}
          <button
            onClick={handleSwitchWallpaper}
            disabled={isLoading || wallpaperSettings.mode === 'disabled'}
            className={`w-full py-2 px-4 rounded-lg border transition-all flex items-center justify-center gap-2 ${
              isLoading || wallpaperSettings.mode === 'disabled'
                ? 'opacity-50 cursor-not-allowed'
                : isDark
                ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700 text-gray-200'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="text-sm">
              {isLoading ? '正在切换...' : '换一个'}
            </span>
          </button>
        </div>

        {/* 壁纸设置下拉选项 */}
        {/* <div>
          <label className={`block text-xs font-medium mb-2 ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>
            壁纸设置
          </label>
          
          <div className="relative">
            <select
              value={wallpaperSettings.mode}
              onChange={(e) => handleModeChange(e.target.value as WallpaperSettings['mode'])}
              className={`w-full p-2 pr-8 rounded-lg border text-sm appearance-none cursor-pointer ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-gray-200 focus:border-blue-500'
                  : 'bg-white border-gray-300 text-gray-700 focus:border-blue-500'
              } focus:outline-none focus:ring-1 focus:ring-blue-500`}
            >
              {wallpaperModes.map((mode) => (
                <option key={mode.id} value={mode.id}>
                  {mode.name}
                </option>
              ))}
            </select>
            
            <ChevronDown className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`} />
          </div>
        </div> */}



      </div>
    </div>
  );
};
