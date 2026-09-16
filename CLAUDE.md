Project

This project is a private, offline-first household inventory PWA called “Vorrat”.

The purpose is to let a household quickly track quantities of supermarket products, food, cleaning products, paper goods and other consumables.

The central interaction is extremely simple:

* Add one unit with “+”
* Remove one unit with “−”
* Tap the quantity to edit it directly

The application must be significantly faster to use than a traditional inventory management application.

⸻

Primary Use Case

Examples:

* Flour → 4 packs → Basement
* Sugar → 2 packs → Basement
* Detergent → 3 bottles → Basement
* Kitchen towels → 8 packs → Basement
* Dishwasher tablets → 2 packs → Basement

The user should be able to update these quantities in seconds.

⸻

Technology

Use:

* TypeScript
* React
* Vite
* Dexie.js
* IndexedDB
* CSS
* Service Worker
* Web App Manifest

Do not introduce unnecessary dependencies.

This is a PWA, not a native SwiftUI application.

Do not implement SwiftUI code in v1.0.

The architecture must nevertheless remain suitable for a possible future native SwiftUI application.

⸻

Architecture

Use this dependency direction:

UI
→ Features
→ Services
→ Repositories
→ Database

React components must NOT access IndexedDB directly.

All database access must go through repositories/services.

Business logic must not be embedded in presentation components.

⸻

Data Model

Item

Fields:

* id
* name
* categoryId
* locationId
* quantity
* unit
* minimumQuantity
* isFavorite
* notes
* createdAt
* updatedAt

Category

Fields:

* id
* name
* icon
* parentId
* createdAt
* updatedAt

Location

Fields:

* id
* name
* parentId
* createdAt
* updatedAt

InventoryTransaction

Fields:

* id
* itemId
* delta
* previousQuantity
* newQuantity
* reason
* timestamp

Reasons:

* purchase
* consumption
* adjustment

Tag

Fields:

* id
* name

Item/tag relationships may be implemented through an ItemTag relation.

⸻

Quantity Rules

Quantity must never become negative.

Example:

quantity = 0

Pressing “−” must not create:

quantity = -1

Instead:

* keep quantity at 0
* optionally provide subtle feedback

The quantity update and transaction creation should happen atomically.

⸻

Core UX

The main inventory screen is the most important screen.

Every item should expose:

[ − ] quantity [ + ]

The user should not need to open item details to perform normal inventory operations.

Prioritize:

* one-handed use
* large touch targets
* minimal navigation
* immediate visual feedback
* fast interaction

Support direct quantity editing.

Support undo after a quantity change.

⸻

Low Stock

If:

quantity <= minimumQuantity

the item is considered low stock.

If:

quantity == 0

the item is considered out of stock.

The UI should visually distinguish these states.

Do not use excessive visual noise.

⸻

Search

Search should match at least:

* item name
* category
* location
* tags

Search must feel instant for normal household inventory sizes.

⸻

Favorites

Users can mark items as favorites.

Favorites should be easy to access and can appear near the top of the dashboard.

⸻

Locations

Locations support hierarchy using parentId.

Example:

Basement
→ Shelf 3
→ Compartment B

v1.0 may expose only simple locations in the primary UI, but the data model must support hierarchy.

⸻

Categories

Provide sensible default categories for:

Food:

* Baking
* Canned Food
* Pasta & Rice
* Breakfast
* Sweets
* Drinks
* Frozen
* Spices
* Sauces
* Other

Household:

* Detergent
* Cleaning
* Paper Goods
* Dishwashing
* Waste Bags
* Personal Care
* Other

Users must be able to create custom categories.

⸻

PWA Requirements

The application must:

* be installable
* contain a valid web manifest
* contain app icons
* support standalone display
* use HTTPS in deployment
* provide a service worker
* cache the required application assets
* work offline after initial loading

Offline functionality is a core requirement, not an optional enhancement.

⸻

Data Storage

Use IndexedDB through Dexie.js.

Inventory data must remain local.

Do NOT add:

* authentication
* cloud database
* analytics
* advertising
* tracking
* external inventory APIs

unless explicitly requested.

⸻

Backup

Implement export/import.

Preferred format:

Vorrat-Backup-YYYY-MM-DD.zip

At minimum the backup must contain:

data.json

Import must:

1. validate the file
2. validate the schema
3. detect malformed data
4. show the user what will happen
5. never silently discard data
6. handle conflicts explicitly

⸻

UI

Design direction:

* modern
* minimal
* calm
* Apple-inspired in usability, but do not copy Apple’s proprietary UI
* generous spacing
* rounded cards
* subtle borders
* clear typography
* excellent touch targets
* responsive
* dark mode

Primary device:

iPhone.

Design mobile-first.

Target minimum viewport:

375px.

Also support:

* 390px
* 430px
* 768px
* 1024px+
* desktop widths

⸻

Navigation

Mobile:

* Overview
* Inventory
* Settings

Desktop:

* sidebar navigation

The primary inventory interaction must remain accessible immediately.

⸻

Error Handling

Never silently fail.

For database errors:

* show a user-friendly message
* log technical details appropriately
* preserve user data whenever possible

Avoid exposing raw stack traces to normal users.

⸻

Testing

After meaningful changes run:

* TypeScript checks
* unit tests
* build
* relevant integration tests

Test especially:

* quantity +1
* quantity -1
* zero boundary
* direct quantity editing
* transaction creation
* search
* low-stock calculation
* favorites
* persistence
* export
* import
* offline operation
* responsive layout

⸻

Development Rules

Before modifying the project:

1. Inspect the repository.
2. Read CLAUDE.md.
3. Inspect existing architecture.
4. Reuse existing components and services.
5. Avoid unnecessary rewrites.

Work incrementally.

Do not implement the entire application in one uncontrolled change.

After each meaningful phase:

* run checks
* run tests
* run build
* fix regressions

⸻

Scope v1.0

Implement:

* dashboard
* inventory
* item CRUD
* +/− quantity controls
* direct quantity editing
* undo
* categories
* locations
* favorites
* search
* filters
* sorting
* minimum stock
* transaction history
* IndexedDB persistence
* export/import
* responsive UI
* dark mode
* PWA installation
* offline operation

Do NOT implement in v1.0:

* accounts
* cloud synchronization
* multi-user sharing
* barcode scanning
* OCR
* receipt recognition
* AI
* supermarket APIs
* price comparison
* recipe management
* shopping list synchronization
* payments
* native SwiftUI

⸻

Future Extension Points

Keep the architecture extensible for:

* barcode scanning
* receipt OCR
* automatic product recognition
* shopping lists
* automatic shopping suggestions
* expiration dates
* product photos
* price tracking
* iCloud synchronization
* native SwiftUI application
* widgets
* Siri/Shortcuts
* multi-user synchronization

Do not implement these features unless explicitly requested.

⸻

Definition of Done

A feature is complete only when:

* implemented
* type-safe
* tested
* responsive
* accessible
* works offline where applicable
* handles errors
* does not break existing functionality
* build succeeds
* architecture remains maintainable

Reliability and speed of everyday use are more important than feature count.
