# SVGStat

> Make analytics as easy to embed as an image.

[中文说明](./README.zh-CN.md)

SVGStat is a developer-first SVG analytics platform built with Go.

It helps you publish live counters, dynamic badges, and actionable traffic insights through plain SVG endpoints, so your GitHub README, documentation, landing pages, and dashboards can display real activity without injecting JavaScript.

## Why SVGStat

Most analytics tools are designed for websites.

SVGStat is designed for places where developers actually present work:

- GitHub README files
- Markdown documents
- Documentation portals
- Static websites
- Open source project pages
- Internal engineering dashboards

Instead of shipping a tracking script, SVGStat turns analytics into embeddable image URLs. That makes it lightweight, cache-friendly, fast to distribute, and easy to integrate anywhere an `<img>` tag or Markdown image is supported.

## What You Get

### Live SVG Counters

Expose real-time metrics as SVG counters.

Typical use cases:

- Visitors
- Downloads
- Stars
- Followers
- Custom project metrics

### Dynamic SVG Badges

Generate production-ready badges with configurable labels, colors, and styles.

Typical use cases:

- Downloads
- Version visibility
- Project status
- Adoption signals
- Custom KPIs

### Developer Analytics Dashboard

View project traffic and usage signals from a focused SPA dashboard.

Current dashboard coverage includes:

- Page views
- Unique visitors
- Referrers
- Countries
- Devices
- Browsers
- Recent visitor details

### Project Workspace

Manage multiple projects from one interface and generate embed code for counters and badges with live preview.

## Live Demo

- Product site: [https://svgstat.com](https://svgstat.com)
- Demo project name: `demo`
- Counter endpoint: `https://svgstat.com/svg/demo/counter/visits.svg?label=Visits&color=7c3aed`
- Badge endpoint: `https://svgstat.com/svg/demo/badge/downloads.svg?label=Downloads&color=0ea5e9&style=flat-square`
- Markdown embed:

```markdown
![Visits](https://svgstat.com/svg/demo/counter/visits.svg?label=Visits&color=7c3aed)
```

## Quick Start

### Requirements

- Go `1.25.1`
- Podman or Docker
- Podman Compose or Docker Compose

### 1. Prepare environment

```bash
cp .env.example .env
```

### 2. Start PostgreSQL and Redis

```bash
make up
```

### 3. Apply database migrations

```bash
make migrate-up
```

### 4. Start the app

Use hot reload:

```bash
make watch
```

Or run the API directly:

```bash
go run cmd/api/main.go
```

### 5. Open the app

- SPA: [http://localhost:8080](http://localhost:8080)
- Health check: [http://localhost:8080/health](http://localhost:8080/health)

### Optional: seed local test data

```bash
go run scripts/init_test_data.go
```

## API And Embed Examples

### Counter SVG

```text
GET /svg/{projectSlug}/counter/{name}.svg
```

Example:

```text
http://localhost:8080/svg/demo/counter/visits.svg?label=Visits&color=brightgreen
```

### Badge SVG

```text
GET /svg/{projectSlug}/badge/{name}.svg
```

Example:

```text
http://localhost:8080/svg/demo/badge/downloads.svg?label=Downloads&style=flat-square
```

### Project Statistics

```text
GET /api/v1/projects/{id}/stats
```

### Authentication

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

## Architecture

SVGStat keeps rendering, analytics, and project management in one focused Go service with a lightweight SPA frontend.

```text
README / Docs / Websites / Dashboards
                │
                ▼
          SVGStat HTTP Layer
        ┌───────┼────────┐
        ▼       ▼        ▼
      SPA     API    SVG Renderer
                │
                ▼
              Redis
                │
                ▼
           PostgreSQL
```

Design principles:

- Performance first
- Redis-first event handling
- Stateless SVG rendering
- API-first product design
- Clear separation between rendering and analytics

## Project Structure

```text
cmd/
  api/        # API server entrypoint
  migrate/    # migration CLI

internal/
  analytics/  # statistics aggregation
  api/        # routes and handlers
  auth/       # auth and session logic
  cache/      # cache layer
  config/     # configuration loading
  counter/    # counter SVG generation
  database/   # database bootstrap
  geoip/      # GeoIP lookup
  migrate/    # migration runner
  project/    # project data access
  renderer/   # shared SVG rendering

migrations/   # SQL migrations
scripts/      # helper scripts
web/          # Alpine.js SPA frontend
resource/     # static resources
```

## Tech Stack

- Go `1.25.1`
- PostgreSQL `16`
- Redis `7`
- Gorilla Mux
- pgx `v5`
- go-redis `v9`
- Alpine.js
- UnoCSS Runtime

## Roadmap

### Current

- Dynamic SVG counters
- Dynamic SVG badges
- Project dashboard
- Traffic analytics
- User auth and project management

### Next

- Richer SVG widgets
- Trend views and chart surfaces
- Public project dashboards
- Team collaboration support

### Later

- SVG-native comments
- Marketplace and templates
- Self-hosting improvements

## Documentation

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

## Contributing

Contributions are welcome.

Before opening a PR, please read:

- [CONTRIBUTING.md](./CONTRIBUTING.md)
- [AGENT.md](./AGENT.md)

## License

MIT License.

## Vision

SVGStat is more than a visitor counter.

It is building the infrastructure layer for developer-facing analytics that can be distributed as SVG, cached like static assets, and embedded as easily as an image.
