# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two primary decision-makers arrive at the landing page with equal priority (neither is favored over the other):
- **Síndico** managing a single condominium — often non-technical, currently coordinating via WhatsApp groups and spreadsheets.
- **Administradora profissional** managing multiple condominiums at once, needing a consolidated view across properties.

Secondary in-product users (not the landing page's decision-makers, but confirmed roles inside the app): **moradores** (residents) who reserve areas and report issues, and **funcionários/zeladores/porteiros** (staff) who execute tasks.

## Product Purpose

CondoFlow automates day-to-day condominium operations — common-area reservations, maintenance task generation and tracking, resident notifications — so the síndico stops manually coordinating everything through WhatsApp groups and spreadsheets. Success looks like: fewer WhatsApp messages, zero overdue maintenance, tasks that get created and assigned without the síndico typing them out one by one.

## Positioning

AI is native to the platform's core, not a bolted-on integration: the síndico describes what needs to happen in plain language and the AI turns it into a structured task plan with assignees and deadlines; it also reads historical maintenance data to predict when preventive work is due, and gives a professional administradora one consolidated operational view across every condominium she manages — something a generic task-management or field-service tool would not claim specifically.

## Operating Context

- Brazilian, Portuguese-language market. Domain vocabulary (síndico, subsíndico, administradora, zelador, porteiro, morador) is load-bearing terminology, not filler to translate away.
- Delivery is web (mobile-responsive), with WhatsApp (via a self-hosted Evolution API instance) as a real, already-built notification channel — notable tension: the product's pitch is "less WhatsApp," while WhatsApp is simultaneously the chosen channel for its own alerts.
- Roles inside the product: síndico, administradora, morador, funcionário (worker/zelador/porteiro).

## Capabilities and Constraints

Confirmed, already-built capabilities: common-area reservations with automatic conflict/rule checks; AI-generated task proposals from natural-language descriptions (síndico approves before a task is created); daily/recurring task templates; automatic escalation of overdue tasks to "urgente"; a permanent, non-deletable maintenance history log; AI-driven WhatsApp alerts for reservations, overdue tasks, and operational events, configurable per condominium.

Technical constraints: web app on TanStack Start + React + Tailwind CSS v4, Supabase backend. Content is Portuguese-only; no localization layer exists or is planned.

## Brand Commitments

Name: **CondoFlow**. Existing logo assets (`logo-dark.png` / `logo-light.png`, light/dark-mode variants). A `DESIGN.md` already documents the incumbent visual identity ("The Quiet Operations Room" — calm, near-monochrome, one indigo signal color, generous rounding). This record does not decide whether a new visual concept (e.g. an "instrument panel" direction) extends or replaces that world — that choice belongs to `new-work`, not here.

## Evidence on Hand

**Confirmed placeholder, not real:** every testimonial (names, roles, quotes, metrics like "80% menos mensagens"), every building/logo name in the logo strip ("Ed. Aurora", "Vista Park", etc.), and every animated statistic in the hero stats row are illustrative copy — CondoFlow has no real customers, testimonials, or verified metrics yet. Any future work must not present this placeholder content as verified proof, and should keep it clearly generic/replaceable (or flag plainly to the user where real proof is still needed) rather than inventing more specific fake proof.

**Real assets:** a promotional video file exists at `/condoflow-promo.mp4`. The product capabilities described in the landing page copy (reservations, AI task generation, notifications, maintenance history) reflect real, already-built functionality — only the social-proof layer (names/quotes/logos/stats) is placeholder, not the feature claims themselves.

Pricing shown on the landing page today is also explicitly placeholder (confirmed during a prior session) — real pricing has not been decided yet.

## Product Principles

1. AI is core infrastructure, not a bolted-on "AI mode" — any surface should read as if the AI is always working in the background, not as a separate feature to visit.
2. Calm over dense, even under a more technical/instrumented visual concept: the target user is often a non-technical síndico, so legibility to a layperson always outranks looking impressively technical.
3. Serve the single-building síndico and the multi-building administradora with equal visual weight — never let composition imply one is the "real" customer and the other an afterthought.
4. The product's voice is real, checkable operational detail (pool pumps, chlorine levels, elevator faults, specific staff names and dates) — avoid generic SaaS filler regardless of visual direction.
5. Portuguese-first, Brazilian condo-operations vocabulary is load-bearing, not decoration.

## Accessibility & Inclusion

No formal accessibility standard has been adopted yet. A prior design critique on this landing page found and fixed a missing keyboard-focus indicator across all interactive elements; no other accessibility requirement has been established as binding.
