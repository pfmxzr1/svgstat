# SVGStat

> 把每一次访问，变成看得见的增长信号。

[English](./README.md)

SVGStat 是一个基于 Go 构建、面向开发者展示场景的 SVG 数据统计平台。它不是为传统网站后台而生，而是为 GitHub README、文档站、官网落地页、变更日志和内部工作台这些高曝光位置而设计。

你不需要接入前端埋点脚本，不需要维护截图，也不需要额外做组件封装。SVGStat 直接把访问量、下载量和自定义指标变成可嵌入的实时 SVG 地址，让你的项目在任何支持图片的地方都能持续展示真实活跃度、增长感和可信度。

## 为什么选择 SVGStat

大多数统计工具关注的是“站点后台”。

SVGStat 关注的是“项目展示面”：

- GitHub README
- Markdown 文档
- 文档门户
- 静态网站
- 开源项目主页
- 内部工程工作台

它把展示能力和分析能力放进同一条工作流里：

- 用 SVG 地址发布实时计数器
- 生成更适合公开展示的高质量徽章
- 在 GitHub 隐藏来源页时，通过 `page_id` 做页面归因
- 查看 PV、UV、来源页、国家地区、设备、浏览器和最近访客
- 在一个多项目工作区里实时预览并复制可直接上线的嵌入代码

## 你能获得什么

### 实时 SVG 计数器

把访问量、下载量、Star、关注数和自定义指标直接发布成轻量 SVG 计数器，适合任何支持 Markdown 图片语法或 `<img>` 标签的环境。

### 更适合公开展示的 SVG 徽章

生成可直接投入生产使用的徽章，支持文案、颜色、样式和首页跳转链接，适合 README、官网、产品文档和公开状态展示位。

### 真正可用的分析工作区

在一个聚焦的 SPA 控制台里看到每个徽章和计数器背后的真实数据，目前已经覆盖：

- 页面访问量
- 独立访客
- 来源页与访问页面
- 国家地区
- 设备类型
- 浏览器分布
- 最近访客明细

### 面向 GitHub 的页面归因

GitHub 的图片代理经常会隐藏原始来源页。SVGStat 已支持 `page_id`，即使徽章嵌入在 README 或其他 Markdown 页面里，你也依然可以把访问归因到正确页面，而不是只看到一团模糊流量。

### 免费公共徽章节点

SVGStat 还内置了一个无需注册即可使用的公共徽章节点。每个 `page_id` 都会独立计数，非常适合快速生成 GitHub 访客徽章。

## 实际演示

- 产品站点：[https://svgstat.com](https://svgstat.com)
- 免费公共徽章：`https://svgstat.com/svg/free/badge/visitor.svg?label=visitors&page_id=github.com/svgstat/demo`
- 演示项目标识：`demo`
- 计数器地址：`https://svgstat.com/svg/demo/counter/visits.svg?label=Visits&color=7c3aed&page_id=github.com/svgstat/demo`
- 徽章地址：`https://svgstat.com/svg/demo/badge/downloads.svg?label=Downloads&color=0ea5e9&style=flat&page_id=github.com/svgstat/demo`
- Markdown 嵌入：

```markdown
![Visits](https://svgstat.com/svg/demo/counter/visits.svg?label=Visits&color=7c3aed&page_id=github.com/svgstat/demo)
```

![Visits](https://svgstat.com/svg/demo/counter/visits.svg?label=Visits&color=7c3aed&page_id=github.com/svgstat/demo)

## 快速开始

### 环境要求

- Go `1.25.1`
- Podman 或 Docker
- Podman Compose 或 Docker Compose

### 1. 准备环境变量

```bash
cp .env.example .env
```

### 2. 启动 PostgreSQL 与 Redis

```bash
make up
```

### 3. 执行数据库迁移

```bash
make migrate-up
```

### 4. 启动应用

使用热重载开发模式：

```bash
make watch
```

或者直接启动 API：

```bash
go run cmd/api/main.go
```

### 5. 打开应用

- SPA 首页：[http://localhost:8080](http://localhost:8080)
- 健康检查：[http://localhost:8080/health](http://localhost:8080/health)

### 可选：初始化本地测试数据

```bash
go run scripts/init_test_data.go
```

## API 与嵌入示例

### 计数器 SVG

```text
GET /svg/{projectSlug}/counter/{name}.svg
```

示例：

```text
https://svgstat.com/svg/demo/counter/visits.svg?label=Visits&color=brightgreen
```

### 徽章 SVG

```text
GET /svg/{projectSlug}/badge/{name}.svg
```

示例：

```text
https://svgstat.com/svg/demo/badge/downloads.svg?label=Downloads&style=flat-square
```

### 项目统计

```text
GET /api/v1/projects/{id}/stats
```

### 认证接口

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

## 架构概览

SVGStat 将渲染、统计与项目管理聚合在一个高聚焦的 Go 服务中，并配套轻量 SPA 前端。

```text
README / 文档站 / 官网 / 控制台
              │
              ▼
         SVGStat HTTP 层
       ┌──────┼───────┐
       ▼      ▼       ▼
      SPA    API   SVG 渲染
              │
              ▼
            Redis
              │
              ▼
         PostgreSQL
```

设计原则：

- 性能优先
- Redis 优先处理高频事件
- SVG 渲染尽量无状态
- API First
- 渲染与统计职责清晰分离

## 项目结构

```text
cmd/
  api/        # API 服务入口
  migrate/    # 数据库迁移命令

internal/
  analytics/  # 统计聚合
  api/        # 路由与处理器
  auth/       # 认证与会话逻辑
  cache/      # 缓存层
  config/     # 配置加载
  counter/    # 计数器 SVG 生成
  database/   # 数据库初始化
  geoip/      # GeoIP 查询
  migrate/    # 迁移执行器
  project/    # 项目数据访问
  renderer/   # 通用 SVG 渲染

migrations/   # SQL 迁移文件
scripts/      # 辅助脚本
web/          # Alpine.js SPA 前端
resource/     # 静态资源
```

## 技术栈

- Go `1.25.1`
- PostgreSQL `16`
- Redis `7`
- Gorilla Mux
- pgx `v5`
- go-redis `v9`
- Alpine.js
- UnoCSS Runtime

## 路线图

### 当前已具备

- 动态 SVG 计数器
- 动态 SVG 徽章
- 项目统计面板
- 流量分析
- 用户认证与项目管理

### 下一阶段

- 更丰富的 SVG Widgets
- 趋势视图与图表能力
- 项目公开统计页
- 团队协作支持

### 后续阶段

- SVG 原生评论能力
- 模板与市场能力
- 更完善的自托管体验

## 文档

- [GETTING_STARTED.md](./GETTING_STARTED.md)
- [API.md](./API.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [DATABASE.md](./DATABASE.md)
- [MIGRATIONS.md](./MIGRATIONS.md)
- [ANALYTICS.md](./ANALYTICS.md)
- [RENDERER.md](./RENDERER.md)
- [REDIS.md](./REDIS.md)
- [INTEGRATION.md](./INTEGRATION.md)
- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [AGENT.md](./AGENT.md)

## 参与贡献

欢迎提交 Issue 和 PR。

在开始贡献前，建议先阅读：

- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [AGENT.md](./AGENT.md)

## 许可证

MIT License.

## 愿景

SVGStat 不只是一个访问计数器。

它想成为面向开发者展示场景的 SVG 数据基础设施，让统计能力像静态资源一样易缓存、像图片一样易嵌入、像产品指标一样持续产生说服力。
