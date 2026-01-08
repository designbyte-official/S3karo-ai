# Color System Documentation

## Custom Tailwind Colors (Primary System)

This project uses **custom Tailwind colors** defined in `tailwind.config.ts`. These are used throughout the codebase.

### Brand Colors

- **`brand`** (DEFAULT): `#FA7275` - Primary brand color (salmon pink)
- **`brand-50`**: `#FFF0F0` - Very light brand tint
- **`brand-75`**: `#FFE0E0` - Light brand tint
- **`brand-100`**: `#EA6365` - Darker brand shade
- **Usage**: Buttons, accents, highlights, icons

### Light Colors (Text & Backgrounds)

- **`light-100`**: `#333F4E` - Dark text color (primary text)
- **`light-200`**: `#A3B2C7` - Medium text color (secondary text)
- **`light-300`**: `#F2F5F9` - Light background (sections, cards)
- **`light-400`**: `#F2F4F8` - Very light background
- **Usage**:
  - `text-light-100` for primary text
  - `text-light-200` for secondary text
  - `bg-light-300` for section backgrounds
  - `bg-light-400` for main content areas

### Dark Colors (Dark Sections)

- **`dark-100`**: `#04050C` - Very dark (almost black)
- **`dark-200`**: `#131524` - Dark background (footers, dark sections)
- **Usage**: Dark sections, footers, modals

### Additional Colors

- **`red`**: `#FF7474` - Error/red accent
- **`error`**: `#b80000` - Error color
- **`green`**: `#3DD9B3` - Success/green accent
- **`blue`**: `#56B8FF` - Blue accent
- **`pink`**: `#EEA8FD` - Pink accent
- **`orange`**: `#F9AB72` - Orange accent

## ShadCN Colors (Secondary System)

ShadCN CSS variables are also available but used less frequently:

- `background`, `foreground`
- `card`, `card-foreground`
- `primary`, `primary-foreground`
- `secondary`, `secondary-foreground`
- `muted`, `muted-foreground`
- `border`, `input`, `ring`

## Usage in Landing Page

### Current Color Usage:

- **Backgrounds**: `bg-white`, `bg-light-300`, `bg-dark-200`
- **Text**: `text-dark-200` (headings), `text-light-100` (body), `text-light-200` (secondary)
- **Brand**: `bg-brand`, `text-brand`, `bg-brand/10` (light backgrounds)
- **Borders**: `border-light-300`
- **Shadows**: `shadow-drop-1`, `shadow-drop-2`, `shadow-drop-3`

## Best Practices

1. **Use custom Tailwind colors** (`brand`, `light`, `dark`) for consistency
2. **Use opacity modifiers** like `bg-brand/10` for light backgrounds
3. **Follow the hierarchy**: `dark-200` → `light-100` → `light-200` for text
4. **Use shadows**: `shadow-drop-1` (light), `shadow-drop-2` (medium), `shadow-drop-3` (heavy)
