# 部署配置

## 重要：Cloudflare Pages 自动部署

这个项目使用 **Cloudflare Pages** 连接 GitHub 仓库，**不是** GitHub Actions。

- 代码推送到 GitHub 后，Cloudflare 会自动拉取并构建部署
- 不需要手动运行 `wrangler deploy`
- 不需要关注 GitHub Actions 的状态
- 构建日志在 Cloudflare Dashboard 的 Pages 项目中查看

## 技术栈

- Next.js 16 + @opennextjs/cloudflare
- Cloudflare Workers (Edge Runtime)
- D1 数据库
- R2 存储桶
- GitHub OAuth 登录

## 环境变量

- `GITHUB_CLIENT_ID` - 在 wrangler.toml 的 [vars] 中
- `GITHUB_CLIENT_SECRET` - 通过 `wrangler secret put` 设置
- `GITHUB_ALLOWED_USER` - 允许登录的 GitHub 用户名
- `NEXT_PUBLIC_SITE_URL` - 站点 URL

## 绑定

- `DB` - D1 数据库
- `BUCKET` - R2 存储桶
