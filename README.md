# hexo-blog

基于 **Hexo 8** + **NexT 主题** 的个人博客项目，已预配置 GitHub Pages 部署（hexo-deployer-git）。

完整的搭建、配置、部署与排障指南见同目录上级的
《Hexo-GitHub-Pages-博客搭建指南.md》。

## 快速开始

```bash
# 1. 安装依赖（首次）
npm install

# 2. 本地预览（默认 http://localhost:4000）
npx hexo server

# 3. 写文章
npx hexo new post "我的第一篇文章"

# 4. 生成静态文件
npx hexo generate

# 5. 部署到 GitHub Pages（先在 _config.yml 中把 repo 改成你的仓库地址）
npx hexo deploy
```

一键生成并部署：`npx hexo g -d`

## 需要修改的地方

| 文件 | 修改内容 |
| --- | --- |
| `_config.yml` | `title` / `author` / `url` / `deploy.repo`（把你的 GitHub 用户名填进去） |
| `_config.next.yml` | `social` 里的 GitHub / 邮箱，`avatar.url` 换成自己的头像 |
| `source/images/` | 放置头像、文章配图等静态资源 |

## 目录说明

```
├── _config.yml          # 站点配置（含部署配置）
├── _config.next.yml     # NexT 主题个性化配置（推荐方式，升级主题不冲突）
├── scaffolds/           # 文章/页面模板
├── source/              # 内容源文件
│   ├── _posts/          # 博客文章
│   └── about/           # 「关于」页面
├── themes/next/         # NexT 主题（v8，已去掉 .git，可直接提交）
└── public/              # hexo generate 的产物（不提交，.gitignore 已忽略）
```
