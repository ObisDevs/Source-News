# Investigation Board Update

## ✅ Changes Made

### Default View Redesigned
The default view has been completely redesigned from spherical nodes to an **Investigation Board** style, mimicking a detective's evidence board with pinned cards and red string connections.

## 🎨 New Features

### Investigation Board (Default View)
- **Card-style News Items**: Stories displayed as white cards pinned to a dark wall
- **Slight Angles**: Each card is randomly rotated for a natural, pinned look
- **Red Pins**: Visual pushpins at the top of each card
- **Floating Animation**: Cards gently bob up and down for a "living" effect
- **Category Headers**: Color-coded category badges on each card
- **Red String Connections**: Curved red lines connecting related stories (like detective boards)
- **Dark Background**: Dark floor plane for contrast

### Visual Elements
- **Card Design**:
  - White background (paper-like)
  - Category color strip at top
  - Story title (3 lines max)
  - Publication date
  - Red pushpin with metallic finish
  
- **Connections**:
  - Red curved lines (bezier curves)
  - Animated opacity pulsing
  - Only shows for related stories (similarity > 0.6)
  
- **Lighting**:
  - Ambient light for overall illumination
  - Spotlight from above for dramatic effect
  - Point lights for depth

### Hover Effects
- Card scales up slightly (1.05x)
- Smooth transitions
- Interactive cursor

## 📁 New Files

1. **investigation-board.tsx** - Main board component with card rendering
2. **red-string-connections.tsx** - Red string connections between related stories

## 🎯 View Modes

### 1. Investigation Board (Default)
- Card-style layout
- Red string connections
- Dark background
- Floating animation

### 2. Heatmap
- Original spherical nodes
- Heatmap overlays (Engagement/Temporal/Controversy)
- Grid helper
- Connection lines

### 3. Clusters
- Original spherical nodes
- Translucent cluster bubbles
- Grid helper
- Connection lines

## 🎨 Design Details

### Card Positioning
- Grid-based layout with random offsets
- Spacing: 5 units between cards
- Random Z-depth for layering effect
- Slight random rotation (±0.15 rad)

### Animation
- Gentle vertical bobbing (sin wave)
- Each card has unique phase offset
- Smooth scale transitions on hover
- Red string opacity pulsing

### Colors
- **Card Background**: White (#ffffff)
- **Pins**: Red (#dc2626) with metallic finish
- **Strings**: Red (#dc2626) with transparency
- **Floor**: Dark gray (#1a1a1a)
- **Category Colors**: Same as before (Blue/Green/Orange/Purple/Pink/Red/Gray)

## 🔧 Technical Implementation

### Card Component
```tsx
- White plane (4x5 units)
- Category color strip (3.8x0.8 units)
- HTML overlay for text content
- Cylindrical pin body
- Spherical pin head
- Random rotation on mount
- Floating animation loop
```

### Red String Component
```tsx
- Quadratic bezier curves
- 20 points per curve
- Animated opacity
- Only renders for related stories
- Curved downward for natural look
```

### Performance
- Efficient HTML rendering with `transform` and `occlude`
- Memoized curve calculations
- Conditional rendering based on view mode
- Pointer events only on hover

## 🎮 Controls

Same as before:
- **Drag**: Rotate view
- **Scroll**: Zoom in/out
- **Click card**: View story details
- **View mode buttons**: Switch between Investigation Board/Heatmap/Clusters

## ✅ Build Status

- TypeScript: ✅ No errors
- Build: ✅ Successful
- All view modes: ✅ Working

## 🚀 Testing

Start dev server and navigate to `/event-map`:
```bash
npm run dev
```

The default view now shows the Investigation Board style!

## 📊 Comparison

### Before (Old Default)
- Spherical nodes
- Grid layout
- Standard connections
- Generic appearance

### After (Investigation Board)
- Card-style items
- Pinned to wall
- Red string connections
- Detective/investigation aesthetic
- Living animation
- More engaging and thematic

---

**Status**: ✅ Complete and ready for testing
