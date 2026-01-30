# Pantry: Shared Household Pantry (PANTRY-012)

## Overview

Allow multiple users in the same household to share a single pantry. When one person adds chicken from a grocery trip, everyone's "What Can I Make" updates. When someone cooks a recipe, the shared pantry deducts for everyone. This makes Mangia work for families and roommates, not just individuals.

---

## Problem

| Issue | Impact |
|-------|--------|
| Each user has their own isolated pantry | Family of 4 has 4 separate, contradictory pantries |
| One person shops, another cooks — pantry is always wrong | Multi-person households can't use the pantry feature effectively |
| No way to collaborate on grocery lists | Duplicated items, missed items, wasted money |

---

## Design Decisions

| Question | Decision | Rationale |
|----------|----------|-----------|
| Sharing model? | **Household** — one shared pantry, shared grocery list | Mirrors physical reality: one kitchen, one pantry |
| Invite mechanism? | **Invite link/code** | Simple, works without requiring contact access |
| Permissions? | **All members equal** — anyone can add, edit, delete | Keep it simple; families don't need role hierarchies |
| Data ownership? | **Household creator owns data** | If household dissolves, creator keeps everything |
| Max members? | **6** | Covers families; prevents abuse |
| Personal vs shared? | **Shared pantry replaces personal** when in a household | No confusion about which pantry to update |
| Premium? | **Yes** — household plan (premium required for creator) | Natural upsell for families |

---

## Server Implementation

### New Database Tables

```sql
CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'My Household',
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE household_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member', -- 'owner' | 'member'
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(household_id, user_id)
);
CREATE INDEX idx_household_members_user ON household_members(user_id);
```

### New Endpoints

**`POST /api/households`** — Create a household
```typescript
// Request
{ "name": "The Rowe Family" }
// Response
{ "id": "uuid", "name": "The Rowe Family", "inviteCode": "MANGIA-ABC123", "members": [...] }
```

**`POST /api/households/join`** — Join via invite code
```typescript
// Request
{ "inviteCode": "MANGIA-ABC123" }
// Response
{ "household": { "id": "uuid", "name": "The Rowe Family", "members": [...] } }
```

**`GET /api/households/mine`** — Get current user's household

**`DELETE /api/households/members/[userId]`** — Remove a member (owner only) or leave (self)

### Modified: All Pantry Endpoints

Every pantry endpoint must be "household-aware":
1. Check if user belongs to a household
2. If yes, operate on the **household's shared pantry** (filter by all household member user IDs, or migrate to household-owned items)
3. If no, operate on the user's personal pantry (current behavior)

**Migration approach:**
- Add optional `household_id` column to `pantry_items`
- When a household is created, migrate owner's personal items to household
- When a member joins, offer to merge their items into the shared pantry

### Modified: Grocery List Endpoints

Same household-aware logic — shared grocery list for the household.

### New File: `apps/api/lib/household.ts`

- `getUserHousehold(userId)` — returns household if user is in one, null otherwise
- `getHouseholdMembers(householdId)` — returns all member user IDs
- `generateInviteCode()` — generates unique human-readable code (format: `MANGIA-XXXXXX`)

---

## Client Changes

### New Screen: `apps/mobile/screens/HouseholdScreen.tsx`

- Create household flow
- Show invite code (shareable)
- Member list with avatars
- "Leave Household" / "Remove Member" actions
- Merge personal items prompt when joining

### `apps/mobile/screens/AccountScreen.tsx`

- Add "Household" section
- Show household name and member count if in one
- "Create Household" or "Join Household" if not in one

### `apps/mobile/screens/PantryScreen.tsx`

- Show household name in header when in shared mode
- Member avatars showing who added each item (optional)

### `apps/mobile/screens/GroceryListScreen.tsx`

- Show shared indicator when in household
- "Added by [Name]" labels on items

---

## Acceptance Criteria

- [ ] `POST /api/households` creates a household with invite code
- [ ] `POST /api/households/join` adds user to household via invite code
- [ ] Household limited to 6 members
- [ ] Pantry endpoints operate on shared pantry when user is in a household
- [ ] Grocery list endpoints operate on shared list when user is in a household
- [ ] Personal items migrated to shared pantry on household creation/join
- [ ] Owner can remove members; members can leave
- [ ] Household name and members visible in Account screen
- [ ] Pantry screen shows shared mode indicator
- [ ] Only premium users can create households
- [ ] `pnpm typecheck` passes in all packages
