#!/usr/bin/env bash
# 用法：./deploy-to-github.sh <你的 GitHub 用户名>
# 作用：把占位符替换为真实用户名，添加远程仓库，推送源码，并部署 gh-pages
set -euo pipefail

GITHUB_USERNAME=${1:-${GITHUB_USERNAME:-}}

if [[ -z "$GITHUB_USERNAME" ]]; then
  echo "❌ 请提供 GitHub 用户名。用法："
  echo "   ./deploy-to-github.sh yourname"
  exit 1
fi

REPO_URL="https://github.com/${GITHUB_USERNAME}/${GITHUB_USERNAME}.github.io.git"
SITE_URL="https://${GITHUB_USERNAME}.github.io"

echo "🔧 准备为 GitHub 用户：${GITHUB_USERNAME}"
echo "   站点地址：${SITE_URL}"
echo "   仓库地址：${REPO_URL}"

# 1. 替换 _config.yml 中的占位符
sed -i.bak -e "s|^url: .*|url: ${SITE_URL}|" \
           -e "s|repo: https://github.com/yourname/yourname.github.io.git|repo: ${REPO_URL}|" \
           _config.yml

# 2. 替换 _config.next.yml 中的 GitHub 社交链接
sed -i.bak -e "s|https://github.com/yourname|https://github.com/${GITHUB_USERNAME}|" \
           _config.next.yml

# 3. 添加/更新 git 远程
if git remote | grep -q '^origin$'; then
  git remote set-url origin "${REPO_URL}"
else
  git remote add origin "${REPO_URL}"
fi

# 4. 提交配置变更
git add _config.yml _config.next.yml 2>/dev/null || true
git diff --cached --quiet || git commit -m "配置 GitHub Pages 部署：${GITHUB_USERNAME}"

# 5. 推送源码分支 main
# 注意：首次 push 会提示登录，建议用 Git Credential Manager 或 Personal Access Token
git push -u origin main

# 6. 生成并部署站点到 gh-pages
npx hexo clean
npx hexo generate
npx hexo deploy

echo ""
echo "✅ 部署命令已执行完毕。"
echo "   源码分支：main"
echo "   站点分支：gh-pages"
echo "   访问地址：${SITE_URL}"
echo "   GitHub Pages 首次生效可能需要 1-5 分钟，请稍后再访问。"
