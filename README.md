# EVCC Crowdscience

A crowdsourced data platform for [EVCC](https://evcc.io) (Electric Vehicle Charge Controller) installations. Collects and visualizes EV charging data from users worldwide.

## Project Structure

Monorepo with two main applications:

- **`apps/transporter`** - MQTT data collector that subscribes to EVCC instances and stores time-series data in InfluxDB
- **`apps/web`** - Web dashboard for data visualization, analysis, and user management

## Prerequisites

- [Bun](https://bun.sh) runtime
- InfluxDB instance (for time-series data storage)
- MQTT broker access (for data collection)

## Setup

Install dependencies:

```bash
bun install
```

### Web App Configuration

Configure environment variables in `apps/web`:

```bash
cd apps/web
cp .env.example .env  # Create and configure your environment
```

### Transporter Configuration

Configure MQTT and InfluxDB connection in `apps/transporter`.

## Development

### Web Dashboard

```bash
cd apps/web
bun run dev
```

Database commands:

```bash
bun run db:generate  # Generate migrations
bun run db:migrate   # Run migrations
bun run db:studio    # Open Drizzle Studio
```

### Transporter Service

```bash
cd apps/transporter
bun run dev          # Watch mode
bun test             # Run tests
```

## Production

### Build

```bash
# Web app
cd apps/web
bun run build
bun run start

# Transporter
cd apps/transporter
bun run build
```

### Docker

Both apps include Dockerfiles for containerized deployment.

## Tech Stack

### Web App

- **Framework**: TanStack Start (React)
- **Database**: SQLite with Drizzle ORM
- **API**: oRPC
- **UI**: Radix UI + Tailwind CSS
- **Charts**: uPlot, Recharts
- **Authentication**: Custom session-based auth

### Transporter

- **MQTT Client**: mqtt.js
- **Time-Series DB**: InfluxDB
- **Runtime**: Bun

## License

Developed by Forschungsgruppe Solar, HTW Berlin
