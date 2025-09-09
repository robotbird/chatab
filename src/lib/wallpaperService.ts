import axios from 'axios';

export interface WallpaperData {
  url: string;
  title: string;
  copyright: string;
  startdate: string;
  thumbnailUrl?: string;
  // 来源：daily(每日自动) | manual(手动切换)
  source?: 'daily' | 'manual';
}

export interface WallpaperSettings {
  mode: 'manual' | 'daily' | 'disabled';
  currentUrl?: string;
  lastUpdate?: number;
}

class WallpaperService {
  private readonly WALLPAPER_API_URLS = [
    'https://cn.bing.com/HPImageArchive.aspx?format=js',
    'https://www.bing.com/HPImageArchive.aspx?format=js',
    // 备用API端点
    'https://api.bing.com/HPImageArchive.aspx?format=js'
  ];
  private readonly STORAGE_KEY = 'wallpaperSettings';
  private readonly CURRENT_WALLPAPER_KEY = 'currentWallpaper';
  private readonly THUMB_CACHE_KEY = 'wallpaperThumbCache';
  
  private getTodayString(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  }
  private isToday(dateStr?: string): boolean {
    if (!dateStr) return false;
    return dateStr === this.getTodayString();
  }
  
  // 事件名称
  private readonly EVENT_MODE_CHANGED = 'wallpaper-mode-changed';
  private readonly EVENT_UPDATED = 'wallpaper-updated';
  
  // 备用壁纸数据（当API无法访问时使用）
  private readonly FALLBACK_WALLPAPERS: WallpaperData[] = [
    {
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
      title: '山脉风景',
      copyright: 'Unsplash',
      startdate: new Date().toISOString().slice(0, 8)
    }
  ];
  
  // 获取 Bing 壁纸数据（尝试多个端点）
  async getBingWallpaper(start: number = 0, count: number = 8): Promise<{ images: WallpaperData[] }> {
    let lastError: Error | null = null;
    
    // 尝试不同的API端点
    for (const apiUrl of this.WALLPAPER_API_URLS) {
      try {
        console.log(`Trying to fetch from: ${apiUrl}`);
        const response = await axios.get(apiUrl, {
          params: { idx: start, n: count },
          timeout: 10000,
          headers: {
            'Accept': 'application/json, text/plain, */*',
            'Cache-Control': 'no-cache'
          },
          // 添加重试机制
          validateStatus: (status) => status >= 200 && status < 300,
        });
        
        if (response.data && response.data.images && Array.isArray(response.data.images)) {
          console.log(`Successfully fetched from: ${apiUrl}, got ${response.data.images.length} images`);
          return response.data;
        }
      } catch (error) {
        const axiosError = error as any;
        console.warn(`Failed to fetch from ${apiUrl}:`, {
          message: axiosError.message,
          code: axiosError.code,
          status: axiosError.response?.status,
        });
        lastError = error as Error;
        continue;
      }
    }
    
    // 如果所有API都失败，返回备用壁纸
    console.log('All API endpoints failed, using fallback wallpapers');
    return { images: this.FALLBACK_WALLPAPERS };
  }

  // 获取随机 Bing 壁纸 URL
  async fetchRandomWallpaperUrl(): Promise<string | null> {
    try {
      const index = Math.floor(Math.random() * 8);
      const data = await this.getBingWallpaper(index, 8);
      const imgIndex = Math.floor(Math.random() * data.images.length);
      const imageUrl = data.images[Math.max(imgIndex, 0)].url;
      return `https://cn.bing.com${imageUrl}`;
    } catch (error) {
      console.error('Error fetching wallpaper URL:', error);
      return null;
    }
  }

  // 获取当前壁纸设置
  getWallpaperSettings(): WallpaperSettings {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading wallpaper settings:', error);
    }
    
    return {
      mode: 'manual',
      currentUrl: undefined,
      lastUpdate: 0
    };
  }

  // 保存壁纸设置
  saveWallpaperSettings(settings: WallpaperSettings): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(settings));
      // 通知监听者模式或设置变更
      window.dispatchEvent(new CustomEvent(this.EVENT_MODE_CHANGED, { detail: settings.mode }));
    } catch (error) {
      console.error('Error saving wallpaper settings:', error);
    }
  }

  // 获取当前壁纸信息
  getCurrentWallpaper(): WallpaperData | null {
    try {
      const stored = localStorage.getItem(this.CURRENT_WALLPAPER_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading current wallpaper:', error);
    }
    return null;
  }

  // 保存当前壁纸信息
  saveCurrentWallpaper(wallpaper: WallpaperData): void {
    try {
      localStorage.setItem(this.CURRENT_WALLPAPER_KEY, JSON.stringify(wallpaper));
      window.dispatchEvent(new CustomEvent(this.EVENT_UPDATED, { detail: wallpaper }));
    } catch (error) {
      console.error('Error saving current wallpaper:', error);
    }
  }

  // 读取缩略图缓存
  private getThumbCache(): Record<string, string> {
    try {
      const raw = localStorage.getItem(this.THUMB_CACHE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {};
  }
  // 写入缩略图缓存（简单限制最多20条）
  private setThumbCache(cache: Record<string, string>): void {
    const entries = Object.entries(cache).slice(-20);
    const limited: Record<string, string> = {};
    entries.forEach(([k,v]) => limited[k]=v);
    localStorage.setItem(this.THUMB_CACHE_KEY, JSON.stringify(limited));
  }
  // 生成缩略图（dataURL）
  private async generateThumbnail(imageUrl: string, maxWidth = 480, maxHeight = 270): Promise<string | null> {
    try {
      // 先尝试通过 query 参数缩放（Bing 图片支持）
      try {
        const url = new URL(imageUrl);
        url.searchParams.set('w', String(maxWidth));
        url.searchParams.set('h', String(maxHeight));
        return url.toString();
      } catch {
        // URL 解析失败，继续使用 canvas 方法
      }

      const res = await fetch(imageUrl, { 
        mode: 'cors',
        cache: 'default',
        headers: {
          'Accept': 'image/*'
        }
      });
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Image load failed'));
        image.src = objectUrl;
        // 添加超时
        setTimeout(() => reject(new Error('Image load timeout')), 10000);
      });
      
      const canvas = document.createElement('canvas');
      const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
      canvas.width = Math.max(1, Math.floor(img.width * ratio));
      canvas.height = Math.max(1, Math.floor(img.height * ratio));
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        return null;
      }
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      URL.revokeObjectURL(objectUrl);
      return dataUrl;
    } catch (e) {
      console.warn('generateThumbnail failed:', e);
      return null;
    }
  }
  // 获取或生成缩略图
  private async getOrCreateThumbnail(imageUrl: string): Promise<string | null> {
    const cache = this.getThumbCache();
    if (cache[imageUrl]) return cache[imageUrl];
    const thumb = await this.generateThumbnail(imageUrl);
    if (thumb) {
      cache[imageUrl] = thumb;
      this.setThumbCache(cache);
    }
    return thumb;
  }

  // 设置壁纸模式
  setWallpaperMode(mode: WallpaperSettings['mode']): void {
    const settings = this.getWallpaperSettings();
    settings.mode = mode;
    settings.lastUpdate = Date.now();
    this.saveWallpaperSettings(settings);
  }

  // 检查是否需要更新壁纸
  shouldUpdateWallpaper(): boolean {
    const settings = this.getWallpaperSettings();
    const now = Date.now();
    const lastUpdate = settings.lastUpdate || 0;
    
    switch (settings.mode) {
      case 'daily':
        // 每天更新一次（24小时）
        return now - lastUpdate > 24 * 60 * 60 * 1000;
      case 'disabled':
        return false;
      case 'manual':
      default:
        return false;
    }
  }

  // 确保壁纸URL是完整的
  private ensureFullUrl(wallpaper: WallpaperData): WallpaperData {
    if (wallpaper.url && !wallpaper.url.startsWith('http')) {
      wallpaper.url = `https://cn.bing.com${wallpaper.url}`;
    }
    return wallpaper;
  }

  // 获取今日壁纸
  async getTodayWallpaper(): Promise<WallpaperData | null> {
    try {
      const data = await this.getBingWallpaper(0, 1);
      if (data.images && data.images.length > 0) {
        const wallpaper = this.ensureFullUrl({ ...data.images[0] });
        console.log('Today wallpaper URL:', wallpaper.url);
        return wallpaper;
      }
    } catch (error) {
      console.error('Error fetching today wallpaper:', error);
    }
    
    // 如果获取失败，返回第一个备用壁纸
    const fallback = { ...this.FALLBACK_WALLPAPERS[0] } as WallpaperData;
    fallback.startdate = this.getTodayString();
    return fallback;
  }

  // 获取随机壁纸
  async getRandomWallpaper(): Promise<WallpaperData | null> {
    try {
      const index = Math.floor(Math.random() * 8);
      const data = await this.getBingWallpaper(index, 8);
      if (data.images && data.images.length > 0) {
        const imgIndex = Math.floor(Math.random() * data.images.length);
        const wallpaper = this.ensureFullUrl({ ...data.images[imgIndex] });
        console.log('Random wallpaper URL:', wallpaper.url);
        return wallpaper;
      }
    } catch (error) {
      console.error('Error fetching random wallpaper:', error);
    }
    
    // 如果获取失败，返回随机备用壁纸
    const randomIndex = Math.floor(Math.random() * this.FALLBACK_WALLPAPERS.length);
    return this.FALLBACK_WALLPAPERS[randomIndex];
  }

  // 应用壁纸到页面背景
  applyWallpaper(wallpaperUrl: string): void {
    const body = document.body;
    body.style.backgroundImage = `url(${wallpaperUrl})`;
    body.style.backgroundSize = 'cover';
    body.style.backgroundPosition = 'center';
    body.style.backgroundRepeat = 'no-repeat';
    body.style.backgroundAttachment = 'fixed';
    window.dispatchEvent(new CustomEvent(this.EVENT_UPDATED, { detail: { url: wallpaperUrl } }));
  }

  // 移除壁纸
  removeWallpaper(): void {
    const body = document.body;
    body.style.backgroundImage = '';
    body.style.backgroundSize = '';
    body.style.backgroundPosition = '';
    body.style.backgroundRepeat = '';
    body.style.backgroundAttachment = '';
    window.dispatchEvent(new CustomEvent(this.EVENT_UPDATED, { detail: null }));
  }

  // 自动更新壁纸
  async autoUpdateWallpaper(): Promise<boolean> {
    if (!this.shouldUpdateWallpaper()) {
      return false;
    }

    const settings = this.getWallpaperSettings();
    let wallpaper: WallpaperData | null = null;

    if (settings.mode === 'daily') {
      wallpaper = await this.getTodayWallpaper();
    }

    if (wallpaper) {
      // 生成缩略图（异步，不阻塞应用背景）
      try {
        const thumb = await this.getOrCreateThumbnail(wallpaper.url);
        if (thumb) wallpaper.thumbnailUrl = thumb;
      } catch {}
      this.saveCurrentWallpaper(wallpaper);
      this.applyWallpaper(wallpaper.url);
      
      // 更新设置中的最后更新时间
      settings.lastUpdate = Date.now();
      settings.currentUrl = wallpaper.url;
      this.saveWallpaperSettings(settings);
      
      return true;
    }

    return false;
  }

  // 手动切换壁纸
  async switchWallpaper(): Promise<WallpaperData | null> {
    const wallpaper = await this.getRandomWallpaper();
    if (wallpaper) {
      try {
        const thumb = await this.getOrCreateThumbnail(wallpaper.url);
        if (thumb) wallpaper.thumbnailUrl = thumb;
      } catch {}
      // 标记为手动来源，并写入当日日期（用于展示，不影响手动逻辑）
      wallpaper.source = 'manual';
      wallpaper.startdate = wallpaper.startdate || this.getTodayString();
      this.saveCurrentWallpaper(wallpaper);
      this.applyWallpaper(wallpaper.url);
      
      // 更新设置
      const settings = this.getWallpaperSettings();
      settings.currentUrl = wallpaper.url;
      settings.lastUpdate = Date.now();
      this.saveWallpaperSettings(settings);
    }
    return wallpaper;
  }

  // 初始化壁纸服务
  async initialize(): Promise<void> {
    const settings = this.getWallpaperSettings();
    
    if (settings.mode === 'disabled') {
      this.removeWallpaper();
      return;
    }

    // 尝试加载当前保存的壁纸
    const currentWallpaper = this.getCurrentWallpaper();

    // 规则：
    // 1) 若来源为 manual，则直接应用并不做日期判断
    // 2) 若非 manual：
    //    - 没有缓存 → 拉取今日壁纸
    //    - 有缓存但不是今日 → 重新拉取今日并覆盖
    //    - 是今日 → 直接应用
    if (currentWallpaper && currentWallpaper.url) {
      if (currentWallpaper.source === 'manual') {
        this.applyWallpaper(currentWallpaper.url);
      } else if (!this.isToday(currentWallpaper.startdate)) {
        const today = await this.getTodayWallpaper();
        if (today) {
          // 生成缩略图
          let thumb: string | null = null;
          try {
            thumb = await this.getOrCreateThumbnail(today.url);
          } catch (error) {
            console.warn('Failed to generate thumbnail during initialization:', error);
          }
          const updated: WallpaperData = {
            ...today,
            source: 'daily',
            thumbnailUrl: thumb || today.thumbnailUrl
          };
          this.saveCurrentWallpaper(updated);
          this.applyWallpaper(updated.url);
        }
      } else {
        // 是今日，直接应用；若缩略图缺失则后台生成
        this.applyWallpaper(currentWallpaper.url);
        if (!currentWallpaper.thumbnailUrl) {
          this.getOrCreateThumbnail(currentWallpaper.url).then((thumb) => {
            if (thumb) this.saveCurrentWallpaper({ ...currentWallpaper, thumbnailUrl: thumb });
          }).catch(() => {});
        }
      }
    } else {
      const today = await this.getTodayWallpaper();
      if (today) {
        let thumb: string | null = null;
        try {
          thumb = await this.getOrCreateThumbnail(today.url);
        } catch (error) {
          console.warn('Failed to generate thumbnail during initialization:', error);
        }
        const updated: WallpaperData = {
          ...today,
          source: 'daily',
          thumbnailUrl: thumb || today.thumbnailUrl
        };
        this.saveCurrentWallpaper(updated);
        this.applyWallpaper(updated.url);
      }
    }
  }
}

export const wallpaperService = new WallpaperService();
