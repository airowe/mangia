# Sprint Plan

## Timeline Overview

**Start:** January 22, 2026 (Today)  
**Deadline:** February 12, 2026, 11:45pm EST  
**Duration:** 22 days (3 weeks)

---

## Week 1: Core Infrastructure (Jan 22-28)

### Day 1 — Wednesday, Jan 22
**Focus:** Project Setup

- [ ] Fork grosheries repo to new repository
- [ ] Create new branch: `shipyard-eitan` or rename to `mangia`
- [ ] Update `app.json`:
  - App name: "Mangia" (or chosen name)
  - Bundle identifier
  - Version: 1.0.0
- [ ] Remove unused dependencies from `package.json`:
  - `@veryfi/veryfi-sdk`
  - `tesseract.js`
- [ ] Delete unused files:
  - `screens/BarcodeScreen.tsx`
  - `screens/ReceiptScanScreen.tsx`
  - `screens/ProductDetailScreen.tsx`
  - `services/receiptScanner.ts`
  - `lib/ai.ts` (Tesseract/barcode)
- [ ] Run `pnpm install` to verify clean build
- [ ] Create new Supabase project (or plan schema migration)

**Deliverable:** Clean, building codebase with unused code removed

---

### Day 2 — Thursday, Jan 23
**Focus:** Database & Auth Setup

- [ ] Set up Supabase schema:
  - Run SQL from `02-DATA-MODELS.md`
  - Create all tables with RLS policies
- [ ] Set up RevenueCat account:
  - Create project
  - Configure iOS app
  - Create entitlement: `premium`
  - Create products (use placeholder prices for now)
- [ ] Update environment variables
- [ ] Verify Supabase auth still works
- [ ] Test basic recipe CRUD with new schema

**Deliverable:** Database ready, RevenueCat account configured

---

### Day 3 — Friday, Jan 24
**Focus:** Recipe Parser Service

- [ ] Create `lib/recipeParser.ts`:
  - URL type detection (TikTok, YouTube, Instagram, blog)
  - Route to appropriate handler
- [ ] Create `lib/ingredientParser.ts`:
  - Claude API integration
  - Prompt for structured recipe extraction
  - JSON parsing and normalization
- [ ] Test with sample blog URLs (Firecrawl already works)
- [ ] Test Claude extraction with sample transcripts

**Deliverable:** Recipe parsing working for blog URLs + Claude extraction

---

### Day 4 — Saturday, Jan 25
**Focus:** Import Recipe Screen

- [ ] Create `screens/ImportRecipeScreen.tsx`:
  - URL input with paste button
  - Platform hints
  - Loading state
  - Error handling
- [ ] Create recipe preview component:
  - Title (editable)
  - Ingredients list (editable)
  - Instructions preview
- [ ] Wire up to `recipeParser` service
- [ ] "Save to Queue" button → create recipe with `status: 'want_to_cook'`
- [ ] Add navigation from HomeScreen

**Deliverable:** Can paste blog URL → see extracted recipe → save

---

### Day 5 — Sunday, Jan 26
**Focus:** Home Screen ("Want to Cook" Queue)

- [ ] Redesign `HomeScreen.tsx`:
  - Header: "Want to Cook" or app branding
  - Recipe list filtered by `status = 'want_to_cook'`
  - Recipe cards: image, title, source icon, time
- [ ] Add FAB or header button: "+ Add Recipe"
- [ ] Add swipe actions:
  - Mark as Cooked
  - Archive
  - Delete
- [ ] Add "Generate Grocery List" button (bottom)
- [ ] Create empty state

**Deliverable:** Home screen shows queued recipes with actions

---

### Day 6 — Monday, Jan 27
**Focus:** Recipe Detail & Status Updates

- [ ] Update `RecipeDetailScreen.tsx`:
  - Full recipe display (ingredients, instructions)
  - Source URL with platform badge
  - "Add to Grocery List" button
  - "Mark as Cooked" button
  - Delete option
- [ ] Implement status update flow
- [ ] Add celebration/confetti on "Mark as Cooked"
- [ ] Navigation back to Home after status change

**Deliverable:** Full recipe detail view with actions

---

### Day 7 — Tuesday, Jan 28
**Focus:** Grocery List Generation

- [ ] Create `lib/groceryList.ts`:
  - `generateGroceryList()` function
  - Ingredient consolidation
  - Pantry checking
  - Category sorting
- [ ] Create `screens/GroceryListScreen.tsx`:
  - Sectioned list by category
  - Checkbox for each item
  - "Already Have" collapsed section
  - Recipe source indicators
- [ ] Wire up "Generate Grocery List" from Home

**Deliverable:** Basic grocery list working (without pantry deduction yet)

---

## Week 2: Features & Polish (Jan 29 - Feb 4)

### Day 8 — Wednesday, Jan 29
**Focus:** Pantry Integration

- [ ] Create/update `screens/PantryScreen.tsx`:
  - List of pantry items
  - Add item form
  - Edit quantity
  - Swipe to delete
- [ ] Wire pantry to grocery list:
  - Fetch pantry items
  - Mark ingredients as "in pantry"
  - Calculate "need to buy" quantities
- [ ] Update grocery list UI to show pantry status

**Deliverable:** Grocery list deducts pantry items

---

### Day 9 — Thursday, Jan 30
**Focus:** RevenueCat Integration

- [ ] Install `react-native-purchases`
- [ ] Create `lib/revenuecat.ts`:
  - Initialize SDK
  - Check premium status
  - Purchase flow
  - Restore purchases
- [ ] Create `contexts/SubscriptionContext.tsx`
- [ ] Create `screens/SubscriptionScreen.tsx` (paywall)
- [ ] Create `hooks/usePremiumFeature.ts`
- [ ] Create `hooks/useRecipeLimit.ts`

**Deliverable:** Subscription system working (sandbox)

---

### Day 10 — Friday, Jan 31
**Focus:** Premium Feature Gates

- [ ] Implement recipe import limit (3/month free)
- [ ] Gate "What Can I Make?" feature
- [ ] Gate cookbook collection
- [ ] Gate grocery list export
- [ ] Add upgrade prompts at gate points
- [ ] Test paywall flow end-to-end

**Deliverable:** Freemium model fully implemented

---

### Day 11 — Saturday, Feb 1
**Focus:** Video URL Support

- [ ] Create `lib/videoTranscript.ts`:
  - YouTube transcript extraction
  - TikTok handling (may need fallback)
- [ ] Test video URL → transcript → Claude → recipe
- [ ] Handle errors gracefully:
  - No transcript available
  - Rate limits
  - Invalid URLs
- [ ] Add fallback: "Paste video description" option

**Deliverable:** Video URLs working (at least YouTube)

---

### Day 12 — Sunday, Feb 2
**Focus:** My Recipes & Search

- [ ] Update `screens/MyRecipesScreen.tsx`:
  - Filter tabs: All / Want to Cook / Cooked / Archived
  - Search functionality
  - Grid or list toggle
- [ ] Implement recipe search
- [ ] Empty states per filter

**Deliverable:** Full recipe library with filtering

---

### Day 13 — Monday, Feb 3
**Focus:** Edge Cases & Error Handling

- [ ] Loading states on all screens
- [ ] Empty states on all screens
- [ ] Error boundaries
- [ ] Network error handling
- [ ] Invalid URL handling
- [ ] Session expiry handling
- [ ] Offline indicator (optional)

**Deliverable:** Robust error handling throughout

---

### Day 14 — Tuesday, Feb 4
**Focus:** UI Polish

- [ ] Consistent typography
- [ ] Consistent spacing
- [ ] Color scheme refinement
- [ ] Icon consistency
- [ ] Animations:
  - List item transitions
  - Button feedback
  - Screen transitions
- [ ] Haptic feedback on key actions
- [ ] Pull-to-refresh on lists

**Deliverable:** Polished, professional UI

---

## Week 3: Submission Prep (Feb 5-12)

### Day 15 — Wednesday, Feb 5
**Focus:** Internal Testing

- [ ] Test complete flow end-to-end:
  1. Sign up
  2. Import recipe (blog URL)
  3. Import recipe (video URL)
  4. Add to pantry
  5. Generate grocery list
  6. Check off items
  7. Mark recipe as cooked
- [ ] Test subscription flow
- [ ] Test edge cases
- [ ] Fix critical bugs

**Deliverable:** App stable for testing

---

### Day 16 — Thursday, Feb 6
**Focus:** TestFlight Build

- [ ] Verify App Store Connect setup
- [ ] Update app icons
- [ ] Update splash screen
- [ ] Build production bundle: `eas build --platform ios`
- [ ] Submit to TestFlight
- [ ] Invite testers
- [ ] Test on physical device

**Deliverable:** TestFlight build live

---

### Day 17 — Friday, Feb 7
**Focus:** Demo Video Prep

- [ ] Write demo video script (2-3 min)
- [ ] Create storyboard:
  - Problem intro (10 sec)
  - Import recipe demo (30 sec)
  - Pantry feature (20 sec)
  - Grocery list generation (30 sec)
  - Mark as cooked (10 sec)
  - Subscription/monetization (20 sec)
  - Closing (10 sec)
- [ ] Prepare demo data (recipes, pantry items)
- [ ] Clean up any debug UI

**Deliverable:** Demo script and storyboard ready

---

### Day 18 — Saturday, Feb 8
**Focus:** Record Demo Video

- [ ] Set up screen recording
- [ ] Record app walkthrough
- [ ] Record voiceover (or add captions)
- [ ] Edit video:
  - Trim dead time
  - Add transitions
  - Add text overlays
  - Add music (optional)
- [ ] Export final video (under 3 min)
- [ ] Upload to YouTube/Vimeo (unlisted)

**Deliverable:** Demo video complete

---

### Day 19 — Sunday, Feb 9
**Focus:** Written Proposal

- [ ] Write proposal (1-2 pages):
  - **Problem Statement** (use Eitan quotes)
  - **Solution Overview**
  - **Key Features**
  - **Monetization Strategy**
  - **Roadmap / Future Features**
- [ ] Review and edit
- [ ] Format for submission

**Deliverable:** Written proposal complete

---

### Day 20 — Monday, Feb 10
**Focus:** Technical Documentation

- [ ] Write architecture overview:
  - Tech stack
  - Data flow diagram
  - Key services
- [ ] Document RevenueCat integration:
  - Products configured
  - Entitlements
  - Paywall implementation
- [ ] Create high-level system diagram

**Deliverable:** Technical docs complete

---

### Day 21 — Tuesday, Feb 11
**Focus:** Final Polish & Prep

- [ ] Final bug fixes
- [ ] Update TestFlight build if needed
- [ ] Write developer bio
- [ ] Prepare all submission materials:
  - [ ] TestFlight link
  - [ ] Demo video link
  - [ ] Written proposal
  - [ ] Technical documentation
  - [ ] GitHub repo link (make public)
  - [ ] Developer bio
- [ ] Review submission requirements one more time

**Deliverable:** All materials ready

---

### Day 22 — Wednesday, Feb 12
**Focus:** SUBMIT

- [ ] Final review of all materials
- [ ] Submit on Devpost BEFORE 11:45pm EST
- [ ] Verify submission received
- [ ] Celebrate! 🎉

**Deliverable:** Submission complete!

---

## Contingency Buffer

If behind schedule:

**Can defer to post-competition:**
- iOS Share Extension
- "What Can I Make?" screen
- Cookbook collection
- Serving size scaling
- Instagram support
- Animations/polish

**Cannot skip:**
- URL → Recipe extraction (at least blog URLs)
- Grocery list generation
- Pantry tracking
- RevenueCat integration
- TestFlight build
- Demo video
- Written proposal

---

## Daily Standup Questions

Ask yourself each day:
1. What did I complete yesterday?
2. What am I working on today?
3. Any blockers?
4. Am I on track for the deadline?
