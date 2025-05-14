# Octopoda: Condensed Implementation Guide

This document provides a condensed overview of the Octopoda project, focusing on the technical details necessary for its implementation, based on the project report dated 27.01.2025.

## 1. Project Overview

- **Goal:** Develop a prototype to enable the long-term storage and analysis of EV charging behavior data from "evcc" (electric vehicle charge control) instances. The primary aim is to gain scientific insights and provide data donors with access to their individualized data.
- **Target Audience:**
  - Scientists (primarily from HTW Berlin for the Wallboxinspektion research project).
  - evcc users who donate their data.
- **Key Concept:** A "Datenspende" (data donation) function allows evcc users to send their data to a central system. This data is then processed, stored, and made available for analysis via a web application.

## 2. Key Requirements

### 2.1. Functional Requirements

1.  **Continuous Data Storage:** Store evcc user data in a database.
2.  **Data Protection & Security:** Prevent unauthorized access, pseudonymize instance data, and allow data deletion.
3.  **Analysis Function:** Enable data filtering based on specific criteria.
4.  **Statistical Evaluation:** Support evaluation of individual charging sessions.
5.  **Time-Series Visualization:** Visualize data over time.
6.  **Individualized Evaluation:** Data analysis is performed per instance.
7.  **Open Source:** The Git repository must be publicly available.
8.  **Web Application:** Provide a web portal for data access and analysis.
9.  **Scientific Standard:** The UI for scientific users should be in English.
10. **Data Export:** Allow manual data export as CSV and data retrieval via a REST API.
11. **Easy Data Donation Setup:** Provide clear instructions for users on how to donate data.

### 2.2. Non-Functional Requirements

- **High Performance:** Ensure fast website interactions.
- **Intuitive User Interface (UI):** Design should be user-friendly.
- **Flexible UI:** Cater to the needs of different user groups.
- **Maintainability & Extensibility:** Use best practices and well-known frameworks.
- **Quality Assurance:** Implement automated and manual tests.
- **Data Privacy:** Comply with European data protection guidelines (DSGVO).

### 2.3. User Roles

- **evcc Users (Data Donors):** Submit data from their evcc instances, view their own data.
- **Scientists:** Log in to the system, select datasets, filter, and analyze data.
- **System Administrators:** Manage user rights and roles, handle data imports.

## 3. System Architecture

### 3.1. Overview

The system employs a **Backend-for-Frontend (BFF)** pattern. The server-side application, built with TanStack Start, serves both the frontend and backend from a single codebase.

### 3.2. Frontend

- **Framework/Libraries:** React, Vite.
- **Routing:** TanStack Router.
- **UI Components:** shadcn, Radix UI.
- **Styling:** Tailwind CSS.
- **Rendering:** Server-Side Rendering (SSR) with streaming for initial load, then transitions to a Single Page Application (SPA).

### 3.3. Backend

- **Framework:** TanStack Start, utilizing the Nitro server (which is based on the H3 library).
- **API:** Provides data to the frontend and offers a REST API endpoint for data export (using HTTP Basic Auth for extracted session data).

### 3.4. Databases

- **InfluxDB:**
  - **Purpose:** Stores time-series data from evcc instances (sensor readings, charging states).
  - **Characteristics:** Dynamic schema, optimized for time-stamped data.
- **SQLite:**
  - **Purpose:** Stores relational data such as user accounts, application settings, and extracted/processed charging sessions.
  - **Characteristics:** File-based, fixed schema, accessed via Bun's integrated SQLite client.

### 3.5. Data Pipeline (evcc Data Ingestion)

1.  **Data Source:** evcc instances.
2.  **Transmission:** Data is sent via the **MQTT** protocol to an MQTT broker (Mosquitto).
3.  **Processing:** **Telegraf** subscribes to the MQTT broker, parses/modifies the incoming data (e.g., structuring topics, adding tags), and then writes it to InfluxDB. This approach was chosen over direct evcc-to-InfluxDB export for better data structure, collision avoidance, and flexibility.
4.  **Storage:** Processed time-series data is stored in InfluxDB.

### 3.6. Authentication

- **Mechanism:** Email and password-based login.
- **Security:** Passwords are hashed with a salt before being stored in the SQLite database.
- **Access Control:** Authenticated users are redirected to the dashboard; access to sensitive data and features is protected.

## 4. Data Management

### 4.1. InfluxDB Data Structure (via Telegraf)

- evcc data is structured into meaningful measurements and tags by Telegraf.
- **MQTT Topic Example (raw):** `evcc/lukas/loadpoints/1/sessionPrice 9.8995`
  - The `evcc/<instance_id>/...` prefix allows unique instance identification. Instance IDs are assigned to data donors.
- **Telegraf Parsing Rule Example:**
  ```
  [[inputs.mqtt_consumer.topic_parsing]]
    topic = "evcc/+/loadpoints/+/+"
    measurement = "_/_/measurement/_/_" # e.g., loadpoints
    tags = "_/instance/topic/componentId/aspect"
  ```
  This rule extracts parts of the topic into tags (like `instance`, `componentId`, `aspect`) and determines the measurement in InfluxDB.

### 4.2. SQLite Data

- Stores user information (credentials), application settings.
- Persists extracted charging sessions (to avoid re-computation for each analysis).
- **ORM:** Drizzle ORM is used for schema management and type-safe queries with TypeScript.

### 4.3. Data Import

- Supports import of historical charging data via **CSV files**. This allows past data to be included in analyses.

### 4.4. Frontend Data Handling

- **Library:** TanStack Query for data fetching, caching, and synchronization.
- **Caching:** Client-side cache with a validity of ~30 seconds to ensure data freshness while optimizing performance.
- **Pre-fetching:** Data for linked pages/views is pre-fetched on hover to improve perceived performance.
- **URL State Management:** TanStack tools are used to store filter and sort configurations in the URL, making them shareable.

## 5. User Interface (UI) & Key Features

### 5.1. Main Pages/Sections

- **Start Page:** Project information, FAQs, legal links (Impressum, Datenschutz), data donation call-to-action, access for users to view their own data (via "Octopoda-ID").
- **Login Page:** For accessing the evaluation/dashboard area.
- **Dashboard (Scientific View):**
  - Accessed after login, UI in **English**.
  - Data analysis, filtering, visualizations.
- **Instance Overview:** Detailed information and graphs for specific instances, exportable graphs.
- **Admin Area:** User overview, CSV data import functionality.

### 5.2. Graphing/Visualizations

- **Library:** **uPlot** (Canvas-based). Chosen for its high performance with large datasets, outperforming SVG-based libraries like Recharts or ApexCharts.
- **Features:** Supports dynamic data rendering, interactive features like zooming/cropping. Configuration can be complex due to varied data sources and dynamic axis labeling.

## 6. Technology Stack & Development

### 6.1. Core Technologies & Frameworks

- **Language:** TypeScript (for type safety across frontend and backend).
- **Frontend:** React, Vite, TanStack Router.
- **Backend/Server:** TanStack Start, Nitro, H3.
- **MQTT Broker:** Mosquitto.
- **Data Collection Agent:** Telegraf.
- **UI Component Libraries:** shadcn, Radix UI.
- **CSS Framework:** Tailwind CSS.
- **Runtime (Backend):** Node.js (with Bun as a flexible option mentioned in the report).

### 6.2. ORM

- **Drizzle ORM:** Used with SQLite for schema definition and type-safe database interactions.

### 6.3. Testing

- **End-to-End (E2E) Tests:** Playwright, using Chromium engine. Tests simulate user interactions across pages.

### 6.4. Deployment

- **Platform:** Coolify (manages services on the HTW Berlin server).
- **Automation:** CI/CD via GitHub webhooks; Coolify builds and deploys the application.
- **Containerization:** Docker (new versions deployed without downtime, includes health checks).
- **Infrastructure Management:** Coolify handles HTTPS encryption and management of services like evcc, Mosquitto, and InfluxDB.

## 7. Key Implementation Notes from Report

- **Graphing Performance:** The choice of uPlot (Canvas) over SVG-based charting libraries was critical due to performance issues with large datasets encountered with Recharts and ApexCharts.
- **Telegraf for Data Structuring:** Direct evcc to InfluxDB export was insufficient. Telegraf is crucial for structuring data correctly, adding necessary identifiers (like instance/component IDs from MQTT topics), and enabling robust queries.
- **Initial Framework Change:** The project initially started with Next.js but transitioned to TanStack Start due to perceived advantages in data processing, runtime flexibility, and codebase simplification.
- **Windows Development:** Due to compatibility issues with some technologies on Windows, Windows Subsystem for Linux (WSL) with Ubuntu was used for development on Windows machines.
