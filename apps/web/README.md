# evcc-crowdscience-web

This is a project to aggregate data from multiple evcc instances and display it in a dashboard.

## Setup

- Install [Bun](https://bun.sh/) Runtime
- copy `.env.example` to `.env` and fill in the missing values
  - generate auth secret with `openssl rand -base64 32`
  - generate influxdb token in influxdb dashboard
- run migrations with `bun run db:migrate`
- start dev server with `bun run dev`
- create test user
  - open browser and navigate to `http://localhost:3000/api/seed`
  - save the username and password and use it to login
  - update your user with your email, name and password (if you want to)
