# SVGStat

> Turn every visit into a visible signal.

[中文说明](./README.zh-CN.md)

SVGStat is a developer-first SVG analytics platform built with Go for the places where software gets judged in public: GitHub READMEs, docs, landing pages, changelogs, and internal dashboards.

Instead of asking you to wire up tracking scripts, screenshots, or custom widgets, SVGStat turns metrics into live SVG endpoints. You ship a URL, embed it like an image, and instantly make your project look active, trusted, and alive.

## Why SVGStat

Most analytics products are built for websites you fully control.

SVGStat is built for high-visibility surfaces developers use to win trust:

- GitHub README files
- Markdown documents
- Documentation portals
- Static websites
- Open source project pages
- Internal engineering dashboards

It combines presentation and analytics in one workflow:

- Publish live counters as embeddable SVGs
- Generate polished badges that match your project style
- Attribute GitHub embeds with `page_id` when referrers are hidden
- Track PV, UV, referrers, countries, devices, browsers, and recent visitors
- Manage multiple projects and copy production-ready embed code with live preview

## What You Get

### Live SVG Counters

Publish visitor counts, downloads, stars, followers, and custom metrics as lightweight SVG counters that work anywhere Markdown or an `<img>` tag is supported.

### Brand-Ready SVG Badges

Generate production-ready badges with configurable labels, colors, styles, and clickable homepage links for README files, docs, product pages, and status surfaces.

### Actionable Analytics Workspace

See what is actually happening behind every badge and counter through a focused SPA dashboard covering:

- Page views
- Unique visitors
- Referrers and visited pages
- Countries
- Devices
- Browsers
- Recent visitor details

### GitHub-Friendly Attribution

GitHub often hides the original referring page behind its image proxy. SVGStat supports `page_id` so you can still attribute README and Markdown embeds to the correct page and keep your dashboard useful.

### Shared Free Badge Node

SVGStat also includes a shared no-signup badge node for quick public usage. Each `page_id` gets an independent counter, which makes it ideal for lightweight GitHub visitor badges.

## Live Demo

- Product site: [https://svgstat.com](https://svgstat.com)
- Shared free badge: `https://svgstat.com/svg/free/badge/visitor.svg?label=visitors&page_id=github.com/svgstat/demo`
- Demo project slug: `demo`
- Counter endpoint: `https://svgstat.com/svg/demo/counter/visits.svg?label=Visits&color=7c3aed&page_id=github.com/svgstat/demo`
- Badge endpoint: `https://svgstat.com/svg/demo/badge/downloads.svg?label=Downloads&color=0ea5e9&style=flat&page_id=github.com/svgstat/demo`
- Markdown embed:

```markdown
![Visits](https://svgstat.com/svg/demo/counter/visits.svg?label=Visits&color=7c3aed&page_id=github.com/svgstat/demo)
```
![Visits](https://svgstat.com/svg/demo/counter/visits.svg?label=Visits&color=7c3aed&page_id=github.com/svgstat/demo)

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
GET https://svgstat.com/svg/{projectSlug}/counter/{name}.svg
```

Example:

```text
https://svgstat.com/svg/demo/counter/visits.svg?label=Visits&color=brightgreen
```

### Badge SVG

```text
GET /svg/{projectSlug}/badge/{name}.svg
```

Example:

```text
https://svgstat.com/svg/demo/badge/downloads.svg?label=Downloads&style=flat-square
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
