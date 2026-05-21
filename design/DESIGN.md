---
name: Panel Pub
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#3e4850'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#6e7881'
  outline-variant: '#bec8d1'
  surface-tint: '#00658e'
  primary: '#00658e'
  on-primary: '#ffffff'
  primary-container: '#34adea'
  on-primary-container: '#003e59'
  inverse-primary: '#84cfff'
  secondary: '#1c695f'
  on-secondary: '#ffffff'
  secondary-container: '#a5ede0'
  on-secondary-container: '#226e63'
  tertiary: '#006b5f'
  on-tertiary: '#ffffff'
  tertiary-container: '#4bb3a4'
  on-tertiary-container: '#00413a'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c7e7ff'
  primary-fixed-dim: '#84cfff'
  on-primary-fixed: '#001e2e'
  on-primary-fixed-variant: '#004c6c'
  secondary-fixed: '#a8f0e3'
  secondary-fixed-dim: '#8cd4c7'
  on-secondary-fixed: '#00201c'
  on-secondary-fixed-variant: '#005047'
  tertiary-fixed: '#8ff4e3'
  tertiary-fixed-dim: '#72d8c8'
  on-tertiary-fixed: '#00201c'
  on-tertiary-fixed-variant: '#005047'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  headline-xl:
    fontFamily: New Amsterdam
    fontSize: 48px
    fontWeight: '400'
    lineHeight: 52px
    letterSpacing: 0.02em
  headline-lg:
    fontFamily: New Amsterdam
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 36px
    letterSpacing: 0.01em
  headline-lg-mobile:
    fontFamily: New Amsterdam
    fontSize: 28px
    fontWeight: '400'
    lineHeight: 32px
  headline-md:
    fontFamily: New Amsterdam
    fontSize: 24px
    fontWeight: '400'
    lineHeight: 28px
  body-lg:
    fontFamily: Roboto Flex
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Roboto Flex
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Roboto Flex
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Roboto Flex
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 16px
  label-sm:
    fontFamily: Roboto Flex
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style

The design system is centered on a premium, high-utility aesthetic tailored for the intersection of e-commerce and instant messaging. It bridges the gap between a high-end storefront and a functional SaaS dashboard. The brand personality is professional, efficient, and transparent, aimed at building trust between sellers and buyers within the WhatsApp ecosystem.

The style is rooted in **Minimalism** with a **Corporate Modern** execution. It leverages expansive whitespace to reduce cognitive load during transaction flows. To differentiate from standard enterprise tools, the system incorporates subtle **Tactile** cues through soft shadows and meaningful micro-interactions that provide immediate feedback, such as hover-fill icons and pulsing status indicators.

## Colors

The palette is led by a vibrant **Panel Blue** (#34ADEA), used strategically for primary actions, progress indicators, and key branding moments. This color is chosen for its high visibility and professional energy.

To establish the connection with WhatsApp selling, the secondary and tertiary colors utilize deep and medium teals, used primarily for messaging-related icons and status indicators. 

The neutral palette is biased toward cool grays and off-whites. Backgrounds use a very light tint to allow white surface containers to "pop" via elevation, maintaining a clean, breathable interface. Success, error, and warning states follow standard semantic conventions but are adjusted for high legibility against the primary blue.

## Typography

This design system employs a high-contrast typographic pairing to balance character with utility. **New Amsterdam** is reserved for headlines (H1-H3). Its distinct, vertical structure provides a "published" and editorial feel that anchors the brand.

**Roboto Flex** handles all body copy, labels, and data-heavy dashboard elements. It is chosen for its exceptional legibility at small sizes and its mechanical neutrality, which ensures the e-commerce content (product names, prices, descriptions) remains the focus. 

For the mobile storefront view, headline sizes are slightly compressed to maximize screen real estate while maintaining the signature brand voice.

## Layout & Spacing

The layout philosophy follows a **Fluid Grid** for the customer-facing mobile view and a **Fixed-Max Grid** for the seller dashboard. 

1.  **Mobile (Storefront):** Uses a single-column layout with a 16px safe-margin. Content blocks are separated by 24px vertical spacing to ensure tap targets are clear and the UI feels spacious.
2.  **Desktop (Dashboard):** Implements a 12-column grid with a fixed left-hand navigation sidebar (240px). The main content area utilizes a maximum width of 1280px to prevent line lengths from becoming unreadable on ultra-wide monitors.

Spacing follows an 8px linear scale. Internal component padding (e.g., inside buttons or cards) should consistently use 12px or 16px to maintain a soft, approachable feel.

## Elevation & Depth

Visual hierarchy is established through **Tonal Layers** and **Ambient Shadows**. The background uses a neutral tint (#F8FAFC), while primary interaction surfaces (Cards, Modals) use pure white (#FFFFFF).

Depth is communicated through:
- **Low-level:** A 1px border (#E2E8F0) for static elements like input fields and inactive cards.
- **Mid-level:** A soft, diffused shadow (0px 4px 12px rgba(0,0,0,0.05)) for active cards and navigation bars to suggest "lift."
- **High-level:** A more pronounced shadow (0px 12px 24px rgba(0,0,0,0.1)) reserved exclusively for modals, dropdowns, and the floating WhatsApp contact button.

This system avoids heavy shadows, opting for "lightness" to ensure the app feels fast and modern.

## Shapes

The shape language is consistently **Rounded** (0.5rem / 8px) to soften the professional tone and make the app feel more accessible. 

- **Primary Buttons:** Utilize the standard 8px radius.
- **Input Fields & Radio Groups:** Utilize the standard 8px radius.
- **Product Cards:** Utilize `rounded-lg` (16px) for a more pronounced "object" feel.
- **Pills/Status Tags:** Use a full pill-shape (999px) to distinguish them from interactive buttons.

## Components

### Buttons & Interaction
- **Primary Button:** Solid #34ADEA fill with white text. On hover, the color deepens slightly.
- **WhatsApp Floating Action Button (FAB):** Features a subtle continuous pulse animation (scale 1.0 to 1.05) to draw attention without being intrusive.
- **Sidebar Icons:** Use a "Hover-Fill" state where the stroke icon transitions to a solid fill of the primary color upon interaction.

### Custom Radio Buttons
For product variations (size, color), use "Box Radios." Instead of a circle, these are large 8px rounded tiles. When selected, they gain a 2px #34ADEA border and a light blue background tint.

### Inputs & Forms
- **Input Fields:** 1px soft border. On focus, the border transitions to 2px #34ADEA with a subtle glow.
- **Cart:** The cart icon in the header should "bounce" (y-axis translation) briefly when an item is added to provide tactile confirmation.

### Cards
- **Product Cards:** Use white backgrounds, a 1px soft border, and a mid-level shadow on hover to indicate interactivity. Images should have a top-only 16px corner radius.