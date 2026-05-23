# Childhood Experience Tracker - App Setup Guide

## Purpose

Build a self-hosted web app for tracking childhood experiences, activities, places, planning steps, age suitability, and completion history across multiple child profiles.

The app should help plan broad life experiences for children as they grow up, such as kayaking, fishing, camping, cultural trips, independence skills, museums, sports, nature activities, and family adventures.

The app should initially be a responsive web app, with the possibility of later transitioning to a native or hybrid iOS app.

---

# Core Concept

Experiences should be reusable templates.

For example, "Beginner kayaking" exists once as an experience, but each child has their own status, eligibility, actions, completed dates, notes, memories, and repeat history.

This allows the same experience to be done once with Louis, and then reused later for Bea when she is old enough.

---

# Deployment Requirements

The app will run using Docker Compose.

It will be hosted behind an existing reverse proxy.

Authentication will be handled externally by Authelia at the reverse proxy layer, so the app does not need to implement user login initially.

The app should still be designed with future authentication in mind.

---

# Suggested Stack

Use a simple, maintainable stack:

- Next.js web app
- PostgreSQL database
- Prisma ORM
- Docker Compose
- Responsive UI suitable for desktop and mobile browsers

Avoid unnecessary complexity in version 1.

Do not implement native iOS yet, but keep the UI and API structure clean enough that a future iOS app could consume the same backend.

---

# Docker Compose Requirements

Create a docker-compose.yml with:

- app service
- db service using PostgreSQL
- persistent database volume
- environment variables loaded from .env
- app exposed internally on a configurable port, e.g. 3000

Example:

yaml services:   app:     build: .     container_name: childhood-experience-tracker     restart: unless-stopped     ports:       - "3000:3000"     environment:       DATABASE_URL: ${DATABASE_URL}     depends_on:       - db    db:     image: postgres:16     container_name: childhood-experience-db     restart: unless-stopped     environment:       POSTGRES_DB: experience_tracker       POSTGRES_USER: experience       POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}     volumes:       - experience_db:/var/lib/postgresql/data  volumes:   experience_db: 

Example .env:

env POSTGRES_PASSWORD=change_me DATABASE_URL=postgresql://experience:change_me@db:5432/experience_tracker 

---

# Reverse Proxy / Authelia Assumptions

The app will sit behind a reverse proxy such as:

- Nginx Proxy Manager
- Traefik
- Caddy
- Nginx

Authelia will protect the route externally.

The app should assume that authentication has already happened before traffic reaches it.

Do not build login, registration, password reset, or session management in the MVP.

Optional future enhancement:

- read trusted headers from the reverse proxy
- support multi-user access later
- add audit fields such as created_by and updated_by

---

# Main Entities

## Children

Stores child profiles.

Fields:

- id
- name
- date_of_birth
- notes
- active
- created_at
- updated_at

The date of birth is used to calculate age suitability dynamically.

---

## Experiences

Reusable activity templates.

Fields:

- id
- title
- description
- category
- minimum_age_months
- ideal_age_min_months
- ideal_age_max_months
- season
- cost_band
- typical_duration_hours
- parent_confidence_required
- repeatable
- notes
- created_at
- updated_at

Example categories:

- Adventure
- Nature
- Culture
- Sport
- Practical Skill
- Independence
- Travel
- People & Community
- STEM
- Family Tradition

---

## Places

Possible places/providers where an experience can happen.

Fields:

- id
- name
- location
- postcode
- website_url
- booking_url
- phone
- distance_minutes
- notes
- created_at
- updated_at

---

## Experience Places

Links reusable experiences to possible places.

Fields:

- id
- experience_id
- place_id
- minimum_age_months_override
- notes

This allows a general experience to have a different provider-specific age limit.

Example:

- Kayaking generally suitable from 6+
- Specific provider may require 8+

---

## Child Experiences

Tracks a specific child's relationship with an experience.

Fields:

- id
- child_id
- experience_id
- status
- priority
- target_date
- completed_date
- booking_reference
- child_interest_level
- parent_confidence_level
- planning_notes
- created_at
- updated_at

planning_notes is a free-form text field for unstructured thoughts — research findings, conversations with providers, things to remember. Distinct from actions, which are list items.

booking_reference stores a confirmation code or reference when something is booked.

Suggested statuses:

- idea
- researching
- planned
- booked
- done
- repeat
- not_interested
- paused

Do not store too_young as a status. It should be calculated from DOB and experience age limits.

---

## Actions

Tracks preparation steps, checklist items, reminders, and kit items against a child experience.

Fields:

- id
- child_experience_id
- description
- action_type
- due_date
- completed_at
- notes
- created_at
- updated_at

action_type enum:

- task — something to do (Email provider, Book session, Check age limit)
- checklist — an option being considered or compared (MSR Hubba tent, Vango Blade 2)
- kit_item — gear needed (waterproof trousers, head torch, sleeping bag liner)
- reminder — a time-based or conditional note (Check weather week before, Wait until Bea turns 6)

Due date and completed_at are optional for checklist and kit_item types.

Example actions by type:

Tasks: Check minimum age, Ask Beavers leader, Email provider, Book session, Add to calendar
Checklist: Tents to compare, campsites to shortlist
Kit items: Waterproof trousers, head torch, sleeping bag
Reminders: Check weather the week before, Wait until Bea is old enough

---

## Activity Log / Memories

Stores what actually happened.

Fields:

- id
- child_experience_id
- place_id
- date
- what_happened
- child_reaction
- parent_notes
- rating
- would_repeat
- cost_actual
- duration_minutes
- photo_url
- created_at
- updated_at

would_repeat drives the "Repeatable Favourites" section on the dashboard. Any activity log entry with would_repeat = true qualifies that experience to appear there.

cost_actual records what you actually spent on the day (to calibrate future planning).

duration_minutes records how long it actually took (to calibrate the typical_duration_hours estimate on the experience template).

This should act as a memory journal as well as a tracking system. In a future version, activity log entries should be exportable as a printable or PDF memory keepsake per child — design the fields with this in mind.

---

# Age Eligibility Logic

Calculate current age from date_of_birth.

Calculate eligibility like this:

text eligible_from_date = child.date_of_birth + experience.minimum_age_months 

If an experience is linked to a place with minimum_age_months_override, use the stricter or provider-specific value when viewing that place.

The UI should show:

- Available now
- Available soon
- Too young
- Done
- Repeatable
- Suitable for both children
- Done with one child but not another

---

# Key Views

## Dashboard

Show useful prompts, not just lists.

Sections:

- Available now
- Coming up soon
- Needs next action
- Booked experiences
- Recently completed
- Repeatable favourites
- Upcoming age milestones (experiences a child will become eligible for within the next 60 days)

A persistent Quick Add button should be accessible from all screens, allowing a new experience idea to be captured in two taps (child → experience → saved as "idea" status).

---

## Child Profile Page

For each child show:

- current age
- age-appropriate experiences
- planned experiences
- completed experiences
- upcoming eligibility milestones
- memories/activity log

---

## Experience Library

Reusable list of all experiences.

Allow filtering by:

- category
- age range
- season
- cost
- parent confidence
- repeatable

---

## Experience Detail Page

Show:

- description
- age suitability and typical duration
- linked places (with phone, booking URL, age overrides)
- child-specific statuses and booking references
- actions grouped by type (tasks, checklist, kit items, reminders)
- planning notes
- completed history and memories

---

## Places Page

Show providers/locations.

Useful for things like:

- Bradford-on-Avon Canoe Hire
- Mendip Activity Centre
- Avon Springs Fishing Lakes
- Wookey Hole
- Cheddar Gorge
- Westonbirt Arboretum
- Forest of Dean

---

## “What Can We Do Soon?” View

This is a critical feature.

Filters:

- child
- available now or within next 6 months
- distance
- season
- cost
- parent confidence
- status not done
- has place assigned

This should be the app’s most useful planning screen.

---

# MVP Scope

Version 1 should include:

1. Create/edit children
2. Create/edit experiences (with typical duration)
3. Create/edit places (with phone, booking URL)
4. Link experiences to places
5. Track child-specific experience status, booking reference, and planning notes
6. Add actions (tasks, checklist items, kit items, reminders) and mark them complete
7. Calculate age suitability from DOB
8. Mark experiences as done
9. Add memory notes after completion (with actual cost and duration)
10. Dashboard with age milestone section
11. Quick Add button accessible from all screens
12. Calendar view (uses existing booked/completed dates — no external integration)
13. PWA support
14. Map embeds for places
15. AI support for activity suggestions (gpt-5.4-nano)

---

# Future Enhancements

Possible later features:

- iOS app using shared API
- Apple/Google calendar integration
- photo attachments (MinIO or local volume)
- weather-aware suggestions
- push/email age milestone notifications (e.g. "Bea turns 5 in 3 weeks — Go Ape Junior will be available")
- memory export — printable or PDF keepsake of a child's completed activity log (fields already designed for this)
- recurring reminders
- Beavers/Scouts activity tracking
- provider contact log
- family-wide traditions
- yearly review of experiences completed

---

# UI Principles

The app should feel warm, practical, and family-oriented.

Avoid making it feel like a corporate CRM.

Prefer language like:

- “What could we try next?”
- “Ready now”
- “Coming up soon”
- “Needs a tiny next step”
- “Worth doing again”
- “Memory added”

The app should encourage doing things, not just administrating them.

---

# Important Product Principle

The app must avoid becoming a museum of good intentions.

Every planned experience should have a clear next step.

Examples:

- Check age limit
- Pick a date
- Ask Alice
- Email provider
- Book session
- Add kit list
- Wait until Bea turns 6

The most important field in the whole app is:

text Next tiny step 

---

# Initial Seed Data

Add sample children:

- Louis
- Bea

Add example experiences:

- Beginner kayaking
- Fishing taster session
- Camping overnight
- Rock pooling
- Visit a cave
- Go Ape junior
- Steam train trip
- Museum day
- Cook a meal
- Night walk with torches
- Build a fire safely
- Paddleboarding
- Visit an air museum
- Forest bike ride

Add example local places near Corsham/Bath:

- Bradford-on-Avon Canoe Hire
- Mendip Activity Centre
- Avon Springs Fishing Lakes
- Wookey Hole
- Cheddar Gorge
- Westonbirt Arboretum
- Forest of Dean
- SS Great Britain
- Fleet Air Arm Museum
- Longleat
- Bath area walks
- Cotswold Water Park

---

# Deliverables

Generate:

- Next.js app
- Prisma schema
- PostgreSQL Docker Compose setup
- .env.example
- seed script
- basic responsive UI
- README with setup instructions
- migration commands
- sample data
- dashboard and CRUD screens

---

# Success Criteria

The app is successful when it can answer:

- What can Louis do now?
- What will Bea be old enough for soon?
- What have we already done?
- What should we repeat?
- What needs booking?
- What is the next tiny step?
- Which experiences are suitable for both children?
- Which experiences did Louis enjoy that Bea has not done yet?