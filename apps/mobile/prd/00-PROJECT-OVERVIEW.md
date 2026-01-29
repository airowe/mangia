# Project Overview: Mangia (Recipe-to-Grocery App)

## Shipyard Competition Submission for Eitan Bernath

**Competition:** RevenueCat Shipyard: Creator Contest  
**Creator:** Eitan Bernath (2.3M TikTok, 773K Instagram)  
**Prize:** $20,000 + Creator partnership  
**Deadline:** February 12, 2026, 11:45pm EST

---

## The Brief (Eitan's Own Words)

> "People, especially nowadays, are inundated with recipes, whether in their cookbooks... or on social media. And I feel like actually getting it from something you see and wanna make to in your kitchen can be a challenge for people."

> "Some type of tool where you can give the app a link to a video you saw or different videos you've seen on the Internet that you wanna make, and it will actually write a food list for you that you can go grocery shopping with to actually then make it."

> "If I can tell some app all the cookbooks I have in my collection, and then let's say in the fridge, I have chicken, broccoli... I can then tell this is what I have in the kitchen. And are there any recipes in my cookbooks that have that in it?"

> "Anything just in that genre of getting people to actually cook the recipes that they want to make and making the process of grocery shopping and getting it from an idea into their kitchen possible."

---

## Problem Statement

People save recipes everywhere (TikTok, Instagram, YouTube, blogs, cookbooks) but never actually cook them. The gap between "I saw this recipe" and "it's on my table" is too wide.

**The friction points:**
1. Recipes saved in different places (no central queue)
2. No easy way to extract ingredients from video content
3. Manual grocery list creation is tedious
4. Don't know what you already have at home
5. Buying duplicates or forgetting items

---

## Solution: Mangia

A mobile app that bridges the gap from recipe inspiration to dinner on the table.

**Core Flow:**
```
Paste recipe URL (TikTok, YouTube, Instagram, blog)
                    ↓
        AI extracts ingredients automatically
                    ↓
        Add to "Want to Cook" queue
                    ↓
        Check against pantry ("I already have eggs")
                    ↓
        Generate grocery list (minus pantry items)
                    ↓
              Go shopping → Cook it!
```

---

## Codebase Foundation

This project is built on top of **grosheries**, an existing Expo React Native app with:

- ✅ Supabase authentication & database
- ✅ Firecrawl recipe URL extraction
- ✅ Recipe data models & CRUD
- ✅ Pantry tracking
- ✅ Meal planning infrastructure
- ✅ UI components (bottom sheets, navigation, theming)

**What we're adding:**
- Video URL parsing (TikTok/YouTube → Claude API → ingredients)
- Grocery list with pantry deduction
- RevenueCat subscription integration
- UI focused on the "want to cook → grocery list" flow

---

## PRD Document Index

| Document | Description |
|----------|-------------|
| `00-PROJECT-OVERVIEW.md` | This file - project context and goals |
| `01-FEATURE-REQUIREMENTS.md` | Detailed feature specs with priorities |
| `02-DATA-MODELS.md` | TypeScript interfaces and Supabase schema |
| `03-SCREENS-AND-NAVIGATION.md` | Screen specs and navigation structure |
| `04-SERVICES-AND-APIs.md` | Backend services, external API integrations |
| `05-REVENUECAT-INTEGRATION.md` | Monetization and paywall implementation |
| `06-GROSHERIES-CODE-MAP.md` | What to reuse, adapt, or remove from grosheries |
| `07-SPRINT-PLAN.md` | Day-by-day development schedule |
| `08-SUBMISSION-CHECKLIST.md` | Competition deliverables and requirements |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React Native (Expo 53) |
| **Language** | TypeScript |
| **Navigation** | React Navigation 7 |
| **Backend** | Supabase (Auth, Postgres, Edge Functions) |
| **AI** | Claude API (ingredient extraction) |
| **Recipe Scraping** | Firecrawl API |
| **Subscriptions** | RevenueCat |
| **State** | React Context + hooks |
| **Styling** | React Native Paper + custom theme |

---

## Judging Criteria

| Criteria | Weight | Our Approach |
|----------|--------|--------------|
| **Audience Fit** | 30% | Directly implements Eitan's stated needs with his exact language |
| **User Experience** | 25% | Paste URL → grocery list in 3 taps |
| **Monetization Potential** | 20% | Freemium: 3 free recipes, premium for unlimited + pantry |
| **Innovation** | 15% | Video URL support, smart pantry deduction, multi-recipe consolidation |
| **Technical Quality** | 10% | Production-ready Expo + Supabase + TypeScript |

---

## Key Differentiators

1. **Video URL Support** — Parse TikTok, Instagram, YouTube recipe videos (not just blogs)
2. **Pantry Awareness** — "I have chicken, broccoli" → skip those on grocery list
3. **Multi-Recipe Lists** — Combine ingredients from multiple saved recipes
4. **"What Can I Make?"** — Reverse lookup: pantry → matching recipes (premium)
5. **Cookbook Tracking** — Log your cookbook collection (premium, addresses Eitan's idea)

---

## Success Metrics

For the competition:
- Working TestFlight build
- 2-3 minute demo video showing full flow
- Written proposal with Eitan's quotes
- RevenueCat integration demonstrated

Post-competition (if we win):
- Partner with Eitan for launch
- Access to 3M+ social followers
- Ongoing revenue share opportunity
