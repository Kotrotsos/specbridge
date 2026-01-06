# UI Design

## Design Reference

BridgeSpec UI is inspired by the Claude Console design system, featuring a warm, minimal aesthetic with clear information hierarchy.

## Color Palette

| Element | Color | Usage |
|---------|-------|-------|
| Background | `#F5F3EE` | Main page background (warm cream) |
| Sidebar | `#EDEAE4` | Navigation sidebar |
| Cards | `#FFFFFF` | Project cards, content panels |
| Text Primary | `#1A1A1A` | Headings, primary content |
| Text Secondary | `#666666` | Dates, metadata, labels |
| Text Muted | `#999999` | Section headers (BUILD, ANALYTICS) |
| Accent | `#1A1A1A` | Buttons, active states |
| Border | `#E5E2DC` | Card borders, dividers |

## Typography

- **Font Family**: System sans-serif stack (no serifs)
- **Headings**: Medium weight, larger sizes
- **Body**: Regular weight, comfortable reading size
- **Labels**: Small caps for section headers (BUILD, MANAGE)

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

## Layout Structure

```
+------------------+----------------------------------------+
|                  |                                        |
|    SIDEBAR       |           MAIN CONTENT                 |
|    (220px)       |                                        |
|                  |   +------------------------------+     |
|  BUILD           |   |     Greeting Header          |     |
|  - Dashboard     |   +------------------------------+     |
|  - Projects      |                                        |
|  - Templates     |   +--------+ +--------+ +--------+     |
|                  |   | Action | | Action | | Action |     |
|  ANALYTICS       |   +--------+ +--------+ +--------+     |
|  - Usage         |                                        |
|  - History       |   +------------------------------+     |
|                  |   | Project Card                 |     |
|  MANAGE          |   | Title                        |     |
|  - Settings      |   | Date by Author               |     |
|  - Export        |   +------------------------------+     |
|                  |                                        |
|  -------------   |   +------------------------------+     |
|  Documentation   |   | Project Card                 |     |
|  User Profile    |   +------------------------------+     |
|                  |                                        |
+------------------+----------------------------------------+
```

## Component Specifications

### Sidebar

- Width: 220px fixed
- Background: `#EDEAE4`
- Collapsible with toggle icon
- Sticky positioning

**Section Headers:**
- Text: Uppercase, small, muted color
- Spacing: 24px top margin between sections

**Navigation Items:**
- Padding: 8px 12px
- Border-radius: 6px
- Hover: Slightly darker background
- Active: Dark background with light text

### Main Content Area

- Max-width: 1000px centered
- Padding: 48px horizontal, 32px vertical

### Greeting Header

```
Good evening, Marco
```

- Time-aware greeting (morning/afternoon/evening)
- Font size: 32px
- Font weight: 400 (regular)
- Centered alignment
- Margin bottom: 32px

### Action Buttons Row

Three primary actions, horizontally centered:

| Button | Icon | Action |
|--------|------|--------|
| New Project | `+` | Create new knowledge capture |
| Continue Interview | Sparkles | Resume in-progress interview |
| Export | Key/Download | Export project data |

**Button Style:**
- Background: White with subtle border
- Padding: 16px 24px
- Border-radius: 8px
- Icon + text layout
- Hover: Slight shadow elevation

### Project Cards

```
+--------------------------------------------------+
|  Project Title                                    |
|  Aug 20, 2025 by Marco Kotrotsos                 |
+--------------------------------------------------+
```

- Background: White
- Border: 1px solid `#E5E2DC`
- Border-radius: 8px
- Padding: 16px 20px
- Margin bottom: 12px
- Hover: Subtle shadow, pointer cursor

**Title:**
- Font size: 16px
- Font weight: 500

**Metadata:**
- Font size: 14px
- Color: `#666666`
- Format: `{date} by {author}`

### Footer

- Centered links: API status, Help & support, Feedback
- Font size: 14px
- Color: `#666666`
- Separator: Visual spacing between items

## Page-Specific Layouts

### Dashboard (Project List)

```
Greeting
Action Buttons
Project Cards (sorted by date, newest first)
```

### Expert Interview

```
+------------------+----------------------------------------+
|                  |  Project: Customer Discount            |
|    SIDEBAR       |  Status: In Progress (Q5 of ~12)       |
|                  +----------------------------------------+
|                  |                                        |
|                  |  [Chat Interface]                      |
|                  |                                        |
|                  |  BridgeSpec: What factors determine    |
|                  |  the discount amount?                  |
|                  |                                        |
|                  |  Expert: Customer type, order value... |
|                  |                                        |
|                  |  BridgeSpec: What are the specific     |
|                  |  customer types?                       |
|                  |                                        |
|                  +----------------------------------------+
|                  |  [Input field]            [Send]       |
+------------------+----------------------------------------+
```

### Implementer View

```
+------------------+----------------------------------------+
|                  |  Customer Discount Calculation         |
|    SIDEBAR       +----------------------------------------+
|                  |  [Summary] [Rules] [Diagram] [Code]    |
|                  +----------------------------------------+
|                  |                                        |
|                  |  Tab Content Area                      |
|                  |                                        |
|                  |  - Decision tree visualization         |
|                  |  - Rule cards                          |
|                  |  - Pseudo-code blocks                  |
|                  |                                        |
|                  +----------------------------------------+
|                  |  Ask a question...            [Ask]    |
+------------------+----------------------------------------+
```

## Responsive Behavior

### Desktop (> 1024px)
- Full sidebar visible
- Three action buttons in row

### Tablet (768px - 1024px)
- Collapsible sidebar (hamburger menu)
- Two action buttons per row

### Mobile (< 768px)
- Hidden sidebar (slide-out drawer)
- Stacked action buttons
- Full-width project cards

## Interaction States

### Buttons
- Default: White background, dark border
- Hover: Light shadow, slight scale (1.02)
- Active: Pressed appearance
- Disabled: Reduced opacity (0.5)

### Cards
- Default: White with border
- Hover: Shadow elevation, cursor pointer
- Selected: Accent border highlight

### Form Inputs
- Default: White background, subtle border
- Focus: Darker border, subtle glow
- Error: Red border, error message below

## Status Indicators

| Status | Visual |
|--------|--------|
| Draft | Gray dot |
| In Progress | Yellow/amber dot |
| Complete | Green dot |
| Needs Clarification | Orange dot |

## Icons

Use simple, line-based icons consistent with the minimal aesthetic:
- Plus (`+`) for create actions
- Sparkles for AI/generate actions
- Key for API/export actions
- Document for projects
- Chat bubble for interview
- Diagram for visualizations
