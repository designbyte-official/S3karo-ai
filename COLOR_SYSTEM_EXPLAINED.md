# Color System Explained: Brand vs Primary vs Dark Mode

## Overview

Your project uses **TWO different color systems** that are similar but serve different purposes:

---

## 1. **Brand Color (Tailwind Config)** - `tailwind.config.ts`

### Definition:

```typescript
brand: {
  '50': '#FFF0F0',
  '75': '#FFE0E0',
  '100': '#EA6365',
  DEFAULT: '#FA7275'  // ← This is the main brand color
}
```

### Characteristics:

- ✅ **Direct hex color** (`#FA7275`)
- ✅ **Static** - Never changes (same in light/dark mode)
- ✅ **Used throughout the codebase** (210+ times)
- ✅ **Usage**: `bg-brand`, `text-brand`, `bg-brand/10`

### Color Value:

- **Hex**: `#FA7275`
- **RGB**: `rgb(250, 114, 117)`
- **Description**: Salmon pink/coral color

---

## 2. **Primary Color (CSS Root Variables)** - `globals.css`

### Definition:

```css
:root {
  --primary: 359 93% 71%; /* HSL format */
  --primary-foreground: 0 0% 98%;
}

.dark {
  --primary: 359 93% 71%; /* Same color in dark mode */
  --primary-foreground: 0 0% 9%; /* But different text color */
}
```

### Characteristics:

- ✅ **HSL format** (`359 93% 71%`)
- ✅ **Dynamic** - Can change with dark mode (though currently same)
- ✅ **ShadCN system** - Part of shadcn/ui design system
- ✅ **Usage**: `bg-primary`, `text-primary`, `hsl(var(--primary))`

### Color Value:

- **HSL**: `hsl(359, 93%, 71%)`
- **Converts to**: `#FA7275` (same as brand!)
- **Description**: Same salmon pink color, just different format

---

## 3. **Dark Mode Colors** - `globals.css`

### Light Mode (`:root`):

```css
--background: 0 0% 100%; /* White */
--foreground: 0 0% 3.9%; /* Almost black */
--primary: 359 93% 71%; /* Brand pink */
--primary-foreground: 0 0% 98%; /* White text on pink */
```

### Dark Mode (`.dark`):

```css
--background: 0 0% 3.9%; /* Almost black */
--foreground: 0 0% 98%; /* White */
--primary: 359 93% 71%; /* Same pink */
--primary-foreground: 0 0% 9%; /* Dark text on pink */
```

### Key Difference:

- **Background/foreground** flip in dark mode
- **Primary color stays the same** (pink)
- **Primary-foreground changes** (text color on pink buttons)

---

## Key Differences Summary

| Feature        | Brand (Tailwind)         | Primary (CSS Variable)       |
| -------------- | ------------------------ | ---------------------------- |
| **Format**     | Hex (`#FA7275`)          | HSL (`359 93% 71%`)          |
| **Location**   | `tailwind.config.ts`     | `globals.css`                |
| **System**     | Custom Tailwind          | ShadCN/UI                    |
| **Dark Mode**  | Static (never changes)   | Can change (currently same)  |
| **Usage**      | `bg-brand`, `text-brand` | `bg-primary`, `text-primary` |
| **Popularity** | ⭐⭐⭐ Used 210+ times   | ⭐⭐ Used 55 times           |
| **Value**      | `#FA7275`                | `#FA7275` (same color!)      |

---

## Which One Should You Use?

### ✅ **Use `brand` (Recommended)**

- More widely used in your codebase
- Simpler (direct hex color)
- Consistent across light/dark modes
- Part of your custom design system

**Example:**

```tsx
<Button className="bg-brand text-white">Click</Button>
```

### ⚠️ **Use `primary` (For ShadCN Components)**

- When using shadcn/ui components that expect `primary`
- If you want dark mode support (though currently same)
- For consistency with shadcn design system

**Example:**

```tsx
<Button className="bg-primary text-primary-foreground">Click</Button>
```

---

## Current Status

**Both colors are the SAME value** (`#FA7275`), just different systems:

- `brand` = Direct Tailwind color
- `primary` = CSS variable (ShadCN system)

**Your codebase primarily uses `brand`** (210+ uses vs 55 uses for primary), so stick with `brand` for consistency!

---

## Dark Mode Explanation

The `.dark` class in CSS allows you to:

1. Toggle dark mode by adding `dark` class to `<html>`
2. Change background/foreground colors automatically
3. Keep brand/primary colors the same (or change them if needed)

Currently, your dark mode:

- Flips backgrounds (white ↔ black)
- Flips text colors (black ↔ white)
- Keeps brand/primary pink the same
