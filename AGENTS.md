# Agent Instructions

## Project

This repository contains a personal trackday planning app for comparing public trackday events with the user's calendar and travel constraints.

## Tech Stack

- Use TanStack Start with React and TypeScript.
- Use Vite as the build tool.
- Keep domain logic in typed modules under `src/features` once it grows beyond a single route.
- Prefer server functions or server routes for integrations that require secrets, such as Google Calendar, route-planning APIs, or future event ingestion.

## Current Product Direction

- The primary origin for travel-time estimates is Pardubice, Czechia.
- The app should help filter trackdays by date availability and geographic practicality.
- Calendar and map views are first-class workflows, not secondary reports.
- Treat current sample events as placeholder data only.

## Local Workflow

- Do not stage, commit, or push changes unless explicitly asked.
- Use `pnpm` for dependency management and scripts.
- Run `pnpm build` before considering a code change complete when dependencies are installed.

## Dev Server

- Prefer the portless workflow: `pnpm dev:portless`.
- The app URL is `https://<branch-name>.trackdays.localhost/`, where slashes in the branch name are replaced with dashes.
- Do not assume <http://localhost:3000> points to this app; it may be another local dev server.
