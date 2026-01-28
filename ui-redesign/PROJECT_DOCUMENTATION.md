# 🎨 DESIGN REPLICATION INSTRUCTIONS

> **IMPORTANT**: The screen HTML files are located in the `screens/` folder within this exported ZIP file. You MUST replicate the designs **one-to-one** exactly as shown in these HTML files.

## Critical Requirements

- **Source of Truth**: The HTML files in the `screens/` folder are the definitive reference designs
- **Exact Replication**: Every visual element, spacing, color, typography, and layout must match the HTML prototypes precisely
- **No Improvisation**: Do not change or "improve" the design - replicate it pixel-perfect as shown
- **All Screens**: If there are many screens, create an appropriate implementation plan, but remember each screen must be an exact visual replica
- **All-in-One File**: The `*_all_in_one.html` file in the root is for preview only - use the individual screen HTML files in `screens/` as your reference

---

# PROJECT DOCUMENTATION: Mangia Mobile App

## 1. Project Overview

**Mangia** is a premium, personal recipe management application designed for home cooks (aged 25-45) who value an editorial, magazine-inspired experience. Unlike generic utility apps, Mangia treats recipes as beautiful content pieces while providing powerful tools for kitchen organization.

### Core Value Proposition
- **Capture Anywhere:** Import recipes from TikTok, YouTube, and blogs with a single link.
- **Editorial Experience:** A "Magazine-inspired" UI that uses high-quality photography and elegant typography.
- **Precision Cooking:** A specialized hands-free cooking mode for the kitchen environment.
- **Smart Shopping:** Automated shopping list generation with direct integration for grocery delivery services.

### Target Audience
- Enthusiastic home cooks who curate recipes from social media.
- Users who appreciate high-end design (NYT Cooking, Bon Appétit).
- Busy individuals looking for a seamless "Plan -> Shop -> Cook" workflow.

---

## 2. Visual Flow Diagram

```text
START
  │
▼ onboarding_problem_solution.html ────────┐
  │ (Organize My Kitchen)                   │
  │                                         │ (Skip)
▼ onboarding_features.html ─────────────────┤
  │ (Continue)                              │
  │                                         ▼
  └──────────────────────────────▶ onboarding_get_started.html
                                            │
                                            ▼
                                     paywall_screen.html
                                            │
                                            ▼
       ┌────────────────────────────── home_screen.html ◀──────────────────────┐
       │                                    │                                  │
       │         (Tab Bar Navigation)       │          (Select Recipe)         │
       │   ┌──────────────┬─────────────────┴───────────────┐                  │
       │   │              │                                 │                  │
       ▼   ▼              ▼                                 ▼                  │
import_recipe.html  collections_screen.html         recipe_detail.html         │
                                                            │                  │
                                                            ▼                  │
                                                    cooking_mode.html ─────────┘
                                                            │ (Exit)
                                                            ▼
                                                    shopping_list.html
```

---

## 3. User Journeys

### Journey 1: Onboarding & Conversion
1.  **Problem Awareness:** User views `onboarding_problem_solution.html` and identifies with the "screenshot chaos" pain point.
2.  **Feature Discovery:** User explores `onboarding_features.html` to see the value of Hands-Free mode and Smart Planning.
3.  **Account Creation:** User lands on `onboarding_get_started.html` and chooses a social login.
4.  **Monetization:** User is presented with `paywall_screen.html` highlighting Mangia Pro benefits before entering the main app.

### Journey 2: The Cooking Workflow
1.  **Queue Selection:** User opens `home_screen.html` and sees their "Up Next" queue.
2.  **Review:** User selects a recipe to view ingredients and prep work in `recipe_detail.html`.
3.  **Active Cooking:** User taps "Start Cooking" to enter the dark-mode, high-visibility `cooking_mode.html`.
4.  **Post-Cook:** User exits back to the detail view or home.

### Journey 3: Kitchen Management
1.  **Ingestion:** User finds a recipe online and uses `import_recipe.html` to save it via URL.
2.  **Organization:** User categorizes new recipes into folders in `collections_screen.html`.
3.  **Procurement:** User checks `shopping_list.html` to see what is missing for their planned meals and triggers a delivery order.

---

## 4. Screen Inventory

### 4.1 Onboarding & Auth
| Screen Name | File | Purpose | Key UI Elements |
|:---|:---|:---|:---|
| Problem/Solution | `onboarding_problem_solution.html` | Highlights user pain points. | Poster frame image, "No More Mess" sticker tag. |
| Features | `onboarding_features.html` | Showcases app capabilities. | Benefit cards with mixed border-radius styles. |
| Get Started | `onboarding_get_started.html` | Entry point for auth. | Social login buttons, "Join 50k" social proof pill. |
| Paywall | `paywall_screen.html` | Upsell for Mangia Pro. | Benefit list with icons, annual/monthly toggle. |

### 4.2 Core App Experience
| Screen Name | File | Purpose | Key UI Elements |
|:---|:---|:---|:---|
| Home Screen | `home_screen.html` | Daily cooking dashboard. | Hero recipe card, "Up Next" list, floating tab bar. |
| Recipe Detail | `recipe_detail.html` | Pre-cooking overview. | Ingredient checkboxes, metadata pills, scale button. |
| Cooking Mode | `cooking_mode.html` | Hands-free guidance. | Dark background, 32pt+ text, integrated timer. |
| Shopping List | `shopping_list.html` | Procurement tool. | Categorized items, grocery service logo integration. |
| Import Recipe | `import_recipe.html` | Adding content. | Large URL input field, "Paste" button shortcut. |
| Collections | `collections_screen.html` | Library organization. | Grid of collection folders, "New Collection" CTA. |

---

## 5. Data Models

### 5.1 Recipe Entity
```typescript
interface Recipe {
  id: string;
  title: string;
  author: string;
  heroImage: string;
  cookTime: number; // minutes
  servings: number;
  calories: number;
  tags: string[]; // e.g., ["Italian", "Vegetarian"]
  ingredients: Ingredient[];
  steps: Step[];
  isFeatured: boolean;
}
```

### 5.2 Ingredient Entity
```typescript
interface Ingredient {
  id: string;
  amount: number;
  unit: string; // e.g., "g", "cups"
  name: string;
  isPantryItem: boolean; // link to pantry status
  isChecked: boolean; // for shopping list
}
```

### 5.3 Collection Entity
```typescript
interface Collection {
  id: string;
  name: string;
  recipeCount: number;
  coverImage: string;
  recipeIds: string[];
}
```

---

## 6. Implementation Requirements

### 6.1 Design Replication (CRITICAL)
**The HTML prototypes are the source of truth.** All developers must adhere to the following:
- **Colors:** Use the hex codes exactly as defined (e.g., Terracotta `#D97742`, Sage `#A8BCA0`).
- **Typography:** 
  - Titles/Headers: Serif (Georgia/System Serif).
  - Body: Sans-serif (System).
  - Letter Spacing: Apply letter-spacing to uppercase labels/captions as shown in prototypes.
- **Shapes:** Replicate the "Italian Market" style—use inconsistent corner radii (e.g., `rounded-[24px] rounded-tl-[8px]`) as found in `onboarding_features.html`.
- **Glassmorphism:** The Tab Bar must use a backdrop blur effect (80% opacity white with `backdrop-filter: blur(20px)`).

### 6.2 Technical Stack Recommendations
- **Platform:** React Native (iOS/Android).
- **Icons:** Lucide Icons (consistent with the prototypes).
- **Animations:** React Native Reanimated (Spring-based transitions for card presses).
- **Blur:** `expo-blur` or `react-native-blur` for the tab bar.
- **Haptics:** `expo-haptics` (Trigger "Light" on button presses, "Success" on recipe completion).

### 6.3 Phased Implementation Plan

**Phase 1: Onboarding & Monetization**
- Implement `onboarding_problem_solution.html`, `onboarding_features.html`, `onboarding_get_started.html`, and `paywall_screen.html`.
- Establish global theme provider with the Mangia color palette.

**Phase 2: Core Viewing & Navigation**
- Build `home_screen.html` and the global Tab Bar navigation.
- Build `recipe_detail.html` with functional ingredient checkboxes.

**Phase 3: Cooking Mode**
- Implement `cooking_mode.html`.
- **Note:** This requires a specialized "Keep Awake" utility to prevent the screen from dimming while cooking.

**Phase 4: Management & Integrations**
- Implement `import_recipe.html` (URL parsing logic) and `collections_screen.html`.
- Finalize `shopping_list.html` with mock deep-links to Instacart/Amazon Fresh.