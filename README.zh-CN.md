# SVGStat

> 让数据统计像插入一张图片一样简单。

[English](./README.md)

SVGStat 是一个面向开发者的 SVG 数据统计平台，基于 Go 构建。

它通过纯 SVG 地址输出实时计数器、动态徽章与可操作的流量分析能力，让你的 GitHub README、文档站、官网落地页和内部控制台都能展示真实活跃度，而且不需要注入 JavaScript。

## 为什么选择 SVGStat

大多数统计工具是为传统网站设计的。

SVGStat 则是为开发者展示项目成果的场景设计的：

- GitHub README
- Markdown 文档
- 文档门户
- 静态网站
- 开源项目主页
- 内部工程工作台

SVGStat 不依赖脚本埋点在前端页面做复杂渲染，而是把统计能力直接变成可嵌入的 SVG 图片地址。这意味着它更轻量、更易缓存、更容易分发，也更适合任何支持 `<img>` 或 Markdown 图片语法的环境。

## 你能获得什么

### 实时 SVG 计数器

将实时指标直接发布为 SVG 计数器。

常见用途包括：

- 访问量
- 下载量
- Star 数
- 关注数
- 自定义项目指标

### 动态 SVG 徽章

生成可直接投入生产使用的徽章，并支持标签、颜色、样式等参数配置。

常见用途包括：

- 下载量展示
- 版本可视化
- 项目状态展示
- 增长信号展示
- 自定义 KPI

### 面向开发者的统计面板

通过一个聚焦、轻量的 SPA 控制台查看项目真实访问情况。

当前面板已覆盖：

- 页面访问量
- 独立访客
- 来源 Referrer
- 国家地区
- 设备类型
- 浏览器分布
- 最近访客明细

### 多项目工作区

在同一界面中管理多个项目，并带有实时预览地生成计数器和徽章嵌入代码。

## 实际演示

- 产品站点：[https://svgstat.com](https://svgstat.com)
- 演示项目名称：`demo`
- 计数器地址：`https://svgstat.com/svg/demo/counter/visits.svg?label=Visits&color=7c3aed`
- 徽章地址：`https://svgstat.com/svg/demo/badge/downloads.svg?label=Downloads&color=0ea5e9&style=flat-square`
- Markdown 嵌入：

```markdown
![Visits](https://svgstat.com/svg/demo/counter/visits.svg?label=Visits&color=7c3aed)
```

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
http://localhost:8080/svg/demo/counter/visits.svg?label=Visits&color=brightgreen
```

### 徽章 SVG

```text
GET /svg/{projectSlug}/badge/{name}.svg
```

示例：

```text
http://localhost:8080/svg/demo/badge/downloads.svg?label=Downloads&style=flat-square
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
