# Product

FoodLoop is a food waste reduction and redistribution app for a college campus.
A canteen posts surplus food, registered recipients request it, volunteers
collect and deliver it, and an admin manages accounts and assignments.

Source: this file is written from the project's build brief (`PROMPT.md`).
Lines marked *(inferred)* are assumptions, not statements from the brief.

## Platform

web — a responsive web app (phones, tablets and laptops in the browser).

## Stack

MERN: React 19 (Vite, JavaScript) with React Router, Tailwind CSS v4, motion,
Recharts and react-hook-form.
Node.js + Express + MongoDB (Mongoose) backend with JWT auth.

## Users

- **Donor (canteen staff):** posts surplus after a meal service, approves or
  rejects requests. Busy, standing at a counter, often on a phone *(inferred)*.
- **Recipient (shelter, hostel mess, student group):** browses what is
  available, requests a quantity, tracks the request.
- **Volunteer:** sees assigned pickups and updates their status while moving
  between places *(inferred: one-handed phone use)*.
- **Admin:** approves accounts, reviews listings, assigns volunteers, reads
  statistics. Mostly on a laptop *(inferred)*.

## Product Purpose

Get edible surplus food from the canteen to people who can use it before its
pickup deadline, with no over-allocation and a clear record of what was
actually delivered.

## Positioning

A small campus tool, not a marketplace. It looks and speaks like the canteen
it serves: token slips, chalkboard menus, rubber stamps and printed receipts.

## Operating Context

MCA mini-project, run locally for a demo and viva. No payments, GPS, SMS,
cloud deployment or AI. Because the logic is simple, the interface is the
main way the project shows quality.

## Capabilities and Constraints

- Four roles with role-based access; new accounts wait for admin approval.
- Listings have a quantity, a pickup deadline and a food type.
- Claims reserve quantity atomically; food counts as redistributed only when
  a pickup is delivered.
- In-app notifications only.
- Must work at 360, 768 and 1440 wide with no overflow.

## Brand Commitments

The "Canteen Token" concept in `DESIGN.md` is fixed: paper and chalkboard
palette, Bricolage Grotesque / Instrument Sans / JetBrains Mono, token slips,
stamps, receipts. Warm, tactile, local and a little playful, while staying
clean and easy to use.

## Evidence on Hand

Seeded demo data only (one canteen, two recipients, two volunteers, eight
listings). Impact figures come from the database, never from invented claims.

## Product Principles

1. The deadline is the most important fact about any listing.
2. Status is always a word, never a colour alone.
3. Each role's screen is laid out for that role's job; screens do not share
   one template.
4. Motion only confirms an action or shows a change.
5. Food safety is stated plainly: a deadline does not guarantee food is safe.

## Accessibility & Inclusion

WCAG AA contrast, 48px tap targets, semantic labels on icons, reduced motion
respected, text scaling supported, light and dark themes.
