---
title: 博客上线啦：Hexo + NexT 从零搭建与部署全记录
date: 2026-10-18 00:10:00
updated: 2026-10-18 00:10:00
categories:
  - 技术
tags:
  - Hexo
  - NexT
  - GitHub Pages
  - 博客搭建
description: 记录一次从零开始的 Hexo 博客搭建：安装初始化、NexT 主题美化、GitHub Pages 部署与踩坑总结。
---

## 前言

这是一篇用于验证站点排版与部署流程的测试文章。经过一番折腾，这个基于 **Hexo + NexT** 的博客终于跑起来了，访问地址是 [sovoyf999.github.io](https://sovoyf999.github.io/)。

之所以自己搭博客，是因为想有一个完全属于自己的写作空间：没有平台限制，没有广告，数据在自己手里。

<!-- more -->

## 技术栈

| 组件 | 版本 / 选择 | 作用 |
| --- | --- | --- |
| Hexo | 8.1.2 | 静态站点生成器 |
| NexT | 8.29.0（Gemini 方案） | 简洁响应式主题 |
| Node.js | 22 LTS | 运行环境 |
| GitHub Pages | 免费托管 | 站点托管与 CDN |
| hexo-deployer-git | 4.0.0 | 一键部署插件 |

## 搭建过程

初始化的命令其实很简单：

```bash
# 安装 CLI 并初始化项目
npm install -g hexo-cli
hexo init my-blog
cd my-blog
npm install

# 安装 NexT 主题
git clone https://github.com/next-theme/hexo-theme-next themes/next
```

写文章、本地预览、生成与部署：

```bash
hexo new post "文章标题"   # 新建文章
hexo server                # 本地预览 http://localhost:4000
hexo clean && hexo generate
hexo deploy                # 推送到 gh-pages
```

## 这次做的美化

主题默认已经很好看了，但稍微调一调会更舒服：

- **侧栏头像**：换成 GitHub 头像，加了渐变光环和悬浮旋转
- **主题色**：统一为靛蓝色 `#6366f1`，链接、进度条、书签保持一致
- **阅读进度条**：页面顶部随滚动前进
- **代码一键复制**：所有代码块右上角都有复制按钮
- **返回顶部**：右下角显示滚动百分比
- **本地搜索**：侧栏可直接搜索文章内容
- **卡片动效**：文章卡片悬浮时轻微上浮 + 阴影加深
- **标签页 / 分类页**：补齐了菜单里缺失的两个页面

## 部署架构

站点采用「源码与产物分离」的方式：

1. `main` 分支存放 Hexo 源码（配置、文章、主题）
2. `gh-pages` 分支存放 `hexo generate` 生成的静态文件
3. GitHub Pages 从 `gh-pages` 分支根目录发布

这样既能保留完整的写作工程，又能让 Pages 只读取构建产物，干净利落。

> 小提示：GitHub 已经不支持用账号密码直接 `git push`，需要 Personal Access Token 或 SSH Key。首次推送时用凭据管理器登录一次即可。

## 踩过的坑

搭建过程中也遇到几个值得记录的问题：

1. **主题被当成 submodule**：`git clone` 下来的主题自带 `.git`，直接提交会变成子模块引用，需要先删掉 `themes/next/.git`。
2. **Pages 发布源选错**：仓库创建时 Pages 默认从 `main` 构建，而 `main` 是源码没有 `index.html`，导致 404；改成 `gh-pages` 后才正常。
3. **`.nojekyll` 不是必须的**：确认 NexT 产物里没有下划线开头的文件，Jekyll 不会误伤，所以可以不添加。

## 小结

从空白目录到线上可访问的博客，核心其实就三件事：**写好内容、选好主题、配对部署**。剩下的美化都是锦上添花。

接下来打算在这里记录一些技术笔记和生活琐碎，希望自己能坚持下去。

---

*本文由 Hexo 生成，主题 NexT，托管于 GitHub Pages。*
