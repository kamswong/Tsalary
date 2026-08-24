# Tsalary

悬浮实时工资浮窗 —— 桌面右下角实时显示你的"每一秒都在赚钱"。

基于 **Electron + Vue 3 + Vite** 构建，轻量、常驻桌面，一边干活一边看着工资增长。

## 功能特性

- 实时计算已赚工资，精确到秒
- 悬浮窗常驻桌面，低资源占用
- 支持托盘图标，最小化后仍可操作
- 深色/浅色主题切换
- 自定义时薪、工作时长等参数
- 完整日期时间显示、直接时间差计算保证精度

## 技术栈

| 技术 | 用途 |
| --- | --- |
| Electron | 桌面应用与悬浮窗/托盘 |
| Vue 3 | 前端界面 |
| Vite | 构建与开发服务器 |
| SCSS / CSS Variables | 样式与主题切换 |

## 项目结构

```
tsalary/
├── electron/          # Electron 主进程与预加载脚本
├── src/               # Vue 前端源码
│   ├── views/         # 页面组件
│   ├── calc.js        # 计算逻辑
│   └── main.js        # 前端入口
├── assets/            # 图标资源（icon.ico / png / b64）
├── scripts/           # 辅助脚本（如图标生成）
├── index.html
├── vite.config.js
└── package.json
```

## 本地开发

```bash
npm install
npm run dev          # 启动 Vite 开发服务器
```

## 打包 Windows 可执行文件

```bash
npm run pack         # 构建 web + 打包 exe（输出到 dist_electron/）
```

## 获取发行版本

无需自己打包，每个带 `v` 前缀的 Git 标签会自动触发 GitHub Actions 构建，并在 **Releases** 页面生成可直接下载的 `.exe`：

```bash
git tag v1.0.0
git push origin v1.0.0
```

发布说明请在 Releases 页面补充完善。

## 许可证

Copyright © 2026. 保留所有权利。