# Design System Specification: Editorial Precision for Language Learning

## 1. Overview & Creative North Star
### Creative North Star: "The Curated Lexicon"
This design system moves away from the "gamified" clutter common in language apps, instead adopting the persona of a perfectionist artist. The goal is to create a digital environment that feels like a high-end editorial publication or a minimalist architectural studio. 

The "Curated Lexicon" aesthetic is defined by **intentional asymmetry** and **breathable composition**. We do not fill space simply because it exists; we use whitespace as a functional element to reduce cognitive load during the intense process of language acquisition. By utilizing a "Soft Minimalist" approach, we ensure that the only thing demanding the user's attention is the German language itself.

---

## 2. Colors: Functional Sophistication
The palette is rooted in muted, professional tones that serve specific semantic purposes without being garish.

### Semantic Gender Tokens
- **Masculine (der):** `secondary` (`#48607e`) — A deep, intellectual slate blue. Use for masculine nouns to evoke a sense of professional stability.
- **Feminine (die):** `tertiary` (`#6b2e2a`) — A refined, muted rose/terracotta. Used to provide warmth and distinction.
- **Neuter (das):** `on_secondary_container` (`#49617f`) — A sophisticated sage-adjacent blue-grey.

### Core Brand & Neutrals
- **Primary Action:** `primary` (`#414141`) — A crisp, authoritative charcoal. 
- **The Canvas:** `background` (`#f9f9f9`) — An off-white that prevents screen fatigue.

### Rules for Application
- **The "No-Line" Rule:** 1px solid borders are strictly prohibited for defining sections. Content containment must be achieved through **background color shifts**. For example, a `surface_container_low` section sitting on a `surface` background is the only acceptable way to delineate sections.
- **Surface Hierarchy:** Use the nested tiers to create depth. A `surface_container_lowest` card should sit atop a `surface_container_low` background. 
- **Signature Textures:** For high-impact areas (like "Start Session"), use a subtle gradient from `primary` to `primary_container` to add a "soul" to the UI that flat color lacks.

---

## 3. Typography: Editorial Authority
We utilize two distinct typefaces to create a clear hierarchy between "The Lesson" (Display) and "The Instruction" (Body).

- **Headlines (Manrope):** A geometric sans-serif used for `display` and `headline` roles. Its wide stance and modern proportions provide the "Apple-esque" premium feel.
- **Functional Text (Inter):** Used for `title`, `body`, and `labels`. Inter is selected for its exceptional legibility at small sizes and perfect kerning, essential for reading complex German compound words.

**Hierarchy Strategy:**
- **Display-LG (3.5rem):** Use only for milestone achievements (e.g., "85% Mastery").
- **Title-MD (1.125rem):** The workhorse for vocabulary words. It should feel prominent but not shouting.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are too "standard." We achieve hierarchy through **Ambient Stacking**.

- **The Layering Principle:** Instead of shadows, stack surface tiers. Place a `surface_container_lowest` (#FFFFFF) card on a `surface_container` (#EEEEEE) base to create a natural, soft lift.
- **Ambient Shadows:** When a floating state is required (e.g., a modal), use an ultra-diffused shadow. 
    - *Spec:* `0px 20px 40px rgba(26, 28, 28, 0.04)`.
    - The shadow color is a 4% opacity tint of the `on_surface` color, mimicking natural light.
- **Glassmorphism:** For top navigation bars or floating action buttons, use `surface` with 80% opacity and a `20px` backdrop-blur. This makes the interface feel integrated and modern.
- **Ghost Borders:** If a boundary is required for accessibility, use `outline_variant` at **15% opacity**. Never use 100% opaque borders.

---

## 5. Components: Minimalist Primitives

### Buttons
- **Primary:** `primary` background, `on_primary` text. Radius: `8px` (`md`). No shadow; use a subtle scale-down on press (98%).
- **Secondary:** `surface_container_high` background. This creates a "recessed" look rather than a raised look.

### Vocabulary Cards
- **Structure:** Cards must use `surface_container_lowest` with a radius of `1rem` (`lg`). 
- **Spacing:** Use `spacing.6` (2rem) for internal padding to ensure the word "breathes."
- **Dividers:** Forbid the use of line dividers. Use `spacing.4` (1.4rem) of vertical whitespace to separate the German word from its English translation.

### Progress Bars
- **Style:** Height should be thin (`0.35rem` / `spacing.1`). 
- **Track:** `surface_container_highest`. 
- **Indicator:** `primary` or the respective gender color (der/die/das).

### Interaction Chips
- **Selection State:** Use a 2px "Ghost Border" of the `primary` color only when selected. Unselected chips should simply be `surface_container_low`.

---

## 6. Do's and Don'ts

### Do
- **Do** prioritize asymmetrical layouts. A center-aligned header with a left-aligned body creates a bespoke, editorial feel.
- **Do** use `on_surface_variant` (#42474F) for secondary information to maintain a soft contrast ratio.
- **Do** lean into `surface_container` shifts to guide the eye rather than using boxes.

### Don't
- **Don't** use pure black (#000000). Always use `primary` (#414141) or `on_surface` (#1A1C1C).
- **Don't** use standard Material Design "Drop Shadows." They feel dated and "AI-generated."
- **Don't** use cartoonish icons. Use thin-stroke, 24px geometric icons that match the `outline` weight.
- **Don't** crowd the screen. If a screen has more than 5 primary interaction points, move the secondary ones into a "More" drawer.