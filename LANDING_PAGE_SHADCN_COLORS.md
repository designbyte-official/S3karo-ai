# Landing Page - ShadCN Color System

## ✅ Conversion Complete

All landing page components have been converted to use **ShadCN color system** (CSS variables) instead of custom Tailwind colors.

## Color Mappings Applied

### Backgrounds

- `bg-white` → `bg-background`
- `bg-light-300` → `bg-muted/50`
- `bg-dark-200` → `bg-popover`
- `bg-brand` → `bg-primary`
- `bg-brand/10` → `bg-primary/10`

### Text Colors

- `text-dark-200` → `text-foreground`
- `text-light-100` → `text-muted-foreground`
- `text-light-200` → `text-muted-foreground`
- `text-brand` → `text-primary`
- `text-white` (on primary) → `text-primary-foreground`

### Borders

- `border-light-300` → `border-border`

### Cards

- `bg-white` (cards) → `bg-card`
- `text-dark-200` (on cards) → `text-card-foreground`

## Updated Components

### 1. LandingNav

- ✅ `bg-background/80` - Navigation background
- ✅ `border-border` - Border
- ✅ `bg-primary` - Primary button
- ✅ `text-primary-foreground` - Button text

### 2. HeroSection

- ✅ `bg-primary/10` - Badge background
- ✅ `text-primary` - Badge and accent text
- ✅ `text-foreground` - Main heading
- ✅ `text-muted-foreground` - Description text
- ✅ `bg-primary` - CTA button
- ✅ `bg-card` - Hero cards
- ✅ `text-card-foreground` - Card text

### 3. FeaturesSection

- ✅ `bg-muted/50` - Section background
- ✅ `text-foreground` - Section heading
- ✅ `text-muted-foreground` - Section description
- ✅ `bg-card` - Feature cards
- ✅ `border-border` - Card borders
- ✅ `text-primary` - Icons

### 4. HowItWorksSection

- ✅ `text-foreground` - Section heading
- ✅ `text-muted-foreground` - Description
- ✅ `bg-primary` - Step circles
- ✅ `text-primary-foreground` - Step numbers

### 5. CTASection

- ✅ `bg-gradient-to-br from-primary to-primary/80` - Gradient background
- ✅ `text-primary-foreground` - Heading and text
- ✅ `bg-card` - Buttons
- ✅ `text-primary` - Button text

### 6. LandingFooter

- ✅ `bg-popover` - Footer background
- ✅ `text-popover-foreground` - Footer text
- ✅ `text-muted-foreground` - Secondary text
- ✅ `border-border` - Border

### 7. Main Page

- ✅ `bg-background` - Page background

## Benefits of ShadCN Color System

1. **Dark Mode Ready** - Colors automatically adapt when dark mode is enabled
2. **Consistent** - Uses standard shadcn/ui color tokens
3. **Maintainable** - Change colors globally via CSS variables
4. **Accessible** - Proper contrast ratios built-in
5. **Flexible** - Easy to theme and customize

## Current Color Values (from globals.css)

```css
:root {
  --background: 0 0% 100%; /* White */
  --foreground: 0 0% 3.9%; /* Almost black */
  --primary: 359 93% 71%; /* #FA7275 (salmon pink) */
  --primary-foreground: 0 0% 98%; /* White */
  --muted: 0 0% 96.1%; /* Light gray */
  --muted-foreground: 0 0% 45.1%; /* Medium gray */
  --card: 0 0% 100%; /* White */
  --card-foreground: 0 0% 3.9%; /* Almost black */
  --popover: 0 0% 100%; /* White (light mode) */
  --popover-foreground: 0 0% 3.9%; /* Almost black */
  --border: 0 0% 89.8%; /* Light border */
}
```

## Usage Examples

```tsx
// Primary button
<Button className="bg-primary text-primary-foreground">
  Click Me
</Button>

// Card
<div className="bg-card border border-border">
  <h3 className="text-card-foreground">Title</h3>
  <p className="text-muted-foreground">Description</p>
</div>

// Section background
<section className="bg-muted/50">
  <h2 className="text-foreground">Heading</h2>
</section>
```
