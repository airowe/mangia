# Submission Checklist

## Competition Requirements

**Platform:** Devpost  
**URL:** https://revenuecat-shipyard-2026.devpost.com/  
**Deadline:** February 12, 2026, 11:45pm EST  
**Creator Brief:** Eitan Bernath

---

## Required Deliverables

### 1. Working App Access ✅

**Requirement:** TestFlight or Google Play Internal Testing link

- [ ] iOS app built with `eas build --platform ios`
- [ ] Submitted to TestFlight
- [ ] TestFlight link generated
- [ ] App reviewable without App Store approval
- [ ] Core features functional:
  - [ ] User authentication
  - [ ] Recipe import from URL
  - [ ] Grocery list generation
  - [ ] Pantry tracking
  - [ ] Subscription purchase flow

**Link format:** `https://testflight.apple.com/join/XXXXXXXX`

---

### 2. Demo Video (2-3 minutes) ✅

**Requirement:** Product walkthrough showing key features and monetization

**Video must include:**
- [ ] Product walkthrough showcasing key features
- [ ] User flow from onboarding to monetization
- [ ] App functioning on device

**Recommended structure:**

| Section | Duration | Content |
|---------|----------|---------|
| Hook | 10 sec | Problem statement with Eitan's quote |
| Import Demo | 40 sec | Paste URL → extract recipe → save |
| Pantry Feature | 20 sec | Add items to pantry |
| Grocery List | 40 sec | Generate list, show pantry deduction |
| Cook Flow | 15 sec | Mark recipe as cooked |
| Premium Features | 25 sec | Show paywall, premium features |
| Roadmap | 15 sec | Future features (cookbook matching) |
| Close | 15 sec | Call to action, app name |

**Technical requirements:**
- [ ] Under 3 minutes (judges won't watch beyond)
- [ ] Shows app on actual device
- [ ] Uploaded to YouTube, Vimeo, Facebook Video, or Youku
- [ ] Publicly visible (or unlisted with link)
- [ ] No third-party trademarks or copyrighted music (unless permitted)

**Link format:** `https://youtube.com/watch?v=XXXXXXXXXXX`

---

### 3. Written Proposal (1-2 pages) ✅

**Required sections:**

#### Problem Statement
> "People, especially nowadays, are inundated with recipes, whether in their cookbooks or on social media. And I feel like actually getting it from something you see and wanna make to in your kitchen can be a challenge for people." — Eitan Bernath

- The gap between recipe inspiration and execution
- Pain points: scattered saves, manual grocery lists, buying duplicates

#### Solution Overview
- App description (one paragraph)
- Core flow: URL → ingredients → pantry check → grocery list
- Key differentiators: video URL support, pantry awareness

#### Monetization Strategy
| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | 3 recipes/month, basic list, manual pantry |
| Premium | $4.99/mo or $29.99/yr | Unlimited imports, smart pantry, "What Can I Make?" |

- Paywall placement strategy
- Why this model works for Eitan's audience

#### Roadmap / Future Features
- Cookbook integration (Eitan's idea, acknowledge copyright considerations)
- Meal planning calendar
- Share lists with family
- Pantry expiry alerts
- Store-specific organization

---

### 4. Technical Documentation ✅

**Required content:**

#### High-level Architecture Overview
```
┌─────────────────────────────────────────┐
│           React Native (Expo 53)        │
│              iOS App                    │
├─────────────────────────────────────────┤
│              Services Layer             │
│  ┌─────────┐ ┌─────────┐ ┌───────────┐ │
│  │ Recipe  │ │ Grocery │ │ Pantry    │ │
│  │ Parser  │ │ List    │ │ Service   │ │
│  └────┬────┘ └────┬────┘ └─────┬─────┘ │
├───────┼──────────┼─────────────┼───────┤
│       │    Supabase            │       │
│       │   (Auth + Database)    │       │
├───────┼──────────┼─────────────┼───────┤
│ External APIs:                         │
│ • Firecrawl (recipe extraction)        │
│ • Claude API (ingredient parsing)      │
│ • RevenueCat (subscriptions)           │
└─────────────────────────────────────────┘
```

#### RevenueCat Integration Details
- Products: `mangia_premium_monthly`, `mangia_premium_yearly`
- Entitlement: `premium`
- Integration method: React Native SDK
- Paywall triggers: 4th recipe import, premium features

#### Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | React Native (Expo 53) |
| Language | TypeScript |
| Backend | Supabase (Auth, Postgres) |
| AI | Claude API |
| Scraping | Firecrawl |
| Payments | RevenueCat |

---

### 5. Public GitHub Repository ✅

**Requirements from rules:**
> "The repository must be public and open source by including an open source license file."

- [ ] Repository is public
- [ ] Contains all source code
- [ ] Contains assets and instructions
- [ ] LICENSE file present (MIT recommended)
- [ ] README.md with:
  - [ ] Project description
  - [ ] Setup instructions
  - [ ] Environment variables needed
  - [ ] How to run locally

**Link format:** `https://github.com/airowe/mangia`

---

### 6. Developer Bio ✅

**Required content:**
- Background and relevant experience
- Portfolio links
- Motivation for participating

**Template:**
```
Adam Rowe is a Mobile Engineering Leader and Application Security Specialist 
with 15+ years of experience in iOS, Android, and React Native development. 
Currently an Application Security Engineer at Walgreens, Adam has previously 
held engineering roles at Rite Aid, Dr. Treat (as third engineer through 
successful exit), Le Tote, and Meltwater.

Adam leverages AI-powered development tools including Claude Code, GitHub 
Copilot, and custom MCP integrations to accelerate development. His side 
projects include Snagg (meme search platform), Swoop Chat (event-based social 
app), and The Low Post newsletter covering college basketball.

Motivation: "Eitan's brief resonated with me because I've built recipe and 
grocery planning tools before with my grosheries project. The problem of 
going from 'I saved this recipe' to 'I actually cooked it' is real and 
solvable. I'm excited to bring my mobile expertise and AI-powered 
development approach to build something Eitan's audience will love."

Portfolio: github.com/airowe
LinkedIn: linkedin.com/in/adamrowe
```

---

## Submission Form Fields

Based on Devpost requirements:

| Field | Content |
|-------|---------|
| Project Name | Mangia (or chosen name) |
| Tagline | From saved recipe to dinner made |
| Creator Brief | Eitan Bernath |
| Description | [Written proposal content] |
| Video URL | YouTube/Vimeo link |
| GitHub URL | Public repo link |
| TestFlight URL | TestFlight invite link |
| Technologies Used | React Native, Expo, Supabase, Claude API, Firecrawl, RevenueCat |
| Team Members | Adam Rowe |

---

## Pre-Submission Checklist

### 48 Hours Before (Feb 10)
- [ ] All features working
- [ ] TestFlight build stable
- [ ] Demo video recorded
- [ ] Written proposal drafted
- [ ] Technical docs drafted

### 24 Hours Before (Feb 11)
- [ ] Final TestFlight build uploaded
- [ ] Demo video uploaded and link working
- [ ] Written proposal finalized
- [ ] Technical docs finalized
- [ ] GitHub repo public with LICENSE
- [ ] Developer bio written
- [ ] All links tested

### Day Of (Feb 12)
- [ ] Review all materials one more time
- [ ] Submit on Devpost
- [ ] Verify submission confirmation
- [ ] Screenshot confirmation for records
- [ ] **Submit by 10:00pm EST** (buffer before 11:45pm deadline)

---

## Judging Criteria Reminder

| Criteria | Weight | How We Address It |
|----------|--------|-------------------|
| **Audience Fit** | 30% | Built exactly to Eitan's brief, using his quotes |
| **User Experience** | 25% | 3-tap flow: paste URL → grocery list |
| **Monetization Potential** | 20% | Freemium model, clear upgrade path |
| **Innovation** | 15% | Video URL parsing, smart pantry deduction |
| **Technical Quality** | 10% | Production-ready stack, clean code |

---

## Post-Submission

### Winners Announced
**Date:** February 26, 2026

### If Selected as Winner
- $20,000 prize
- Featured on RevenueCat blog
- Social media feature
- Opportunity to work with Eitan long-term
- Potential distribution to 3M+ followers

---

## Emergency Contacts

- **Devpost Support:** support@devpost.com
- **RevenueCat Hackathon Manager:** julie.farley@revenuecat.com
- **Discord:** https://discord.gg/3aV6EUCYqR
