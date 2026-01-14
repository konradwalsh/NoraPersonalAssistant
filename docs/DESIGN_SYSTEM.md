# Nora Design System

This document outlines the core design principles, tokens, and component patterns that define the Nora Personal Assistant user experience. This "locked-in" design system ensures consistency and premium aesthetics across all future developments.

## 🎨 Core Philosophy

Nora is designed to be **Natural, Delightful, and Invisible**.

- **Premium Aesthetics**: High-contrast dark mode with subtle gradients and glassmorphism.
- **Fluid Motion**: Everything is animated using spring physics (Framer Motion).
- **Contextual Intelligence**: UI elements change based on the confidence and type of data extracted.

## 💎 Design Tokens

### Color Palette (OKLCH)

We use the modern OKLCH color space for superior perceptual uniformity and vibrant colors.

| Token | Light Value | Dark Value | Usage |
| :--- | :--- | :--- | :--- |
| `background` | `oklch(1 0 0)` | `oklch(0.145 0 0)` | Main app surface |
| `foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` | Primary text |
| `primary` | `oklch(0.205 0 0)` | `oklch(0.922 0 0)` | Accents and buttons |
| `card` | `oklch(1 0 0)` | `oklch(0.205 0 0)` | Surface elements |
| `border` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` | Subtle separators |

### Semantic Colors

Used for data categorization in AI analysis:

- **Summary**: `blue-400` (Information/General)
- **Obligations**: `amber-400` (Attention Required)
- **Deadlines**: `rose-400` (Critical/Time-sensitive)
- **Documents**: `indigo-400` (Assets/Records)
- **Financials**: `emerald-400` (Value/Growth)
- **Life Domain**: `purple-400` (Context/Clarity)

### Typography

- **Primary Font**: `Inter` (Variable font preferred)
- **Fallback**: `ui-sans-serif, system-ui`
- **Weights**:
  - Regular (400) for body text
  - Medium (500) for labels
  - Bold (700) for headers and tracking-tight highlights

### Layout & Spacing

- **Base Radius**: `0.625rem` (10px) - used for most cards and buttons.
- **Container Radius**: Up to `3xl` (`calc(var(--radius) + 12px)`) for main content areas.
- **Glassmorphism**: `bg-white/[0.03]` with `border-white/10` and `backdrop-blur` where applicable.

## 🧱 Key Components

### 1. Intelligence Report (`AiAnalysisDisplay`)

The flagship component for displaying AI-extracted metadata.

- **Accordion Style sections** with unique icons and semantic coloring.
- **Confidence Badges**: Dynamic coloring based on score (>80% Green, >50% Amber, <50% Rose).
- **Actionable Items**: Direct "Create Task" or "Add Deadline" buttons integrated into insights.
- **Animated Transitions**: Smooth height expansion and opacity fades using `AnimatePresence`.

### 2. Stats Dashboard (`StatCard`)

- Minimalist design with top-right iconography.
- Subtle `border-white/5` and `bg-white/1` for depth.
- Animated counters for metrics.

### 3. Sidebar Navigation (`Layout`)

- Slim, elegant sidebar with `lucide-react` icons.
- Active states highlighted with `bg-white/10` and `text-white`.
- Integrated "Intelligence Hub" feel.

## ✨ Animation Principles (Framer Motion)

All interactive elements should follow these motion rules:

1. **Entrance**: `initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}`
2. **Hover**: Subtle scale-up (`scale: 1.02`) or background brightness increase.
3. **Stagger**: Children lists should use `transition={{ staggerChildren: 0.1 }}`.
4. **Physics**: Use `type: "spring"` with `damping: 20` and `stiffness: 100` for a premium, heavy feel.

## 🛠 Tech Stack Integration

- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS 4+ (with OKLCH)
- **Components**: Radix UI + shadcn/ui
- **Motion**: Framer Motion
- **Icons**: Lucide React

### Changelog
