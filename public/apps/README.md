# ChatAB Apps - 模块化架构

本目录包含了ChatAB扩展的模块化处理器架构。

## 架构概述

### 核心文件
- `constants.js` - 支持的网站配置和通用选择器常量
- `utils.js` - 通用工具函数类
- `BaseHandler.js` - 所有网站处理器的抽象基类
- `HandlerFactory.js` - 处理器工厂，负责创建和管理处理器实例

### 网站处理器
每个支持的网站都有一个独立的处理器文件：

- `chatgpt.js` - ChatGPT处理器
- `deepseek.js` - DeepSeek处理器  
- `gemini.js` - Gemini处理器
- `doubao.js` - Doubao处理器
- `perplexity.js` - Perplexity处理器
- `kimi.js` - Kimi处理器
- `tongyi.js` - Tongyi处理器
- `yuanbao.js` - Yuanbao处理器
- `grok.js` - Grok处理器
- `yiyan.js` - Yiyan处理器

## 工作流程

1. `contentScript.js` 主入口文件检测当前网站
2. `HandlerFactory` 根据网站类型创建对应的处理器实例
3. 处理器继承自 `BaseHandler`，实现网站特定的逻辑
4. 使用 `ChatABUtils` 提供的通用工具函数

## 添加新网站支持

1. 在 `constants.js` 中添加网站配置
2. 创建新的处理器文件，继承 `BaseHandler`
3. 在 `HandlerFactory.js` 中注册新处理器
4. 更新 `manifest.json` 包含新的处理器文件

## 优势

- **模块化**：每个网站的逻辑独立，便于维护
- **可扩展**：添加新网站支持非常简单
- **代码复用**：通用逻辑在基类中实现
- **调试友好**：每个处理器独立，便于定位问题
