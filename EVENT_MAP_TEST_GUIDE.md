# Event Map Testing Guide

## ✅ Pre-Test Checklist

- ✅ TypeScript compilation: **PASSED** (npx tsc --noEmit)
- ✅ Production build: **SUCCESSFUL**
- ✅ All components created: **10 files**
- ✅ API endpoint: **Ready**
- ✅ Navigation link: **Added to header**

## 🧪 Testing Instructions

### 1. Start Development Server
```bash
npm run dev
```

### 2. Access Event Map
Navigate to: `http://localhost:3000/event-map`

Or click **"Event Map"** button in the header navigation.

## 🎯 Features to Test

### Basic Functionality
- [ ] Page loads without errors
- [ ] 3D visualization renders
- [ ] Stories appear as colored spheres
- [ ] Can rotate view by dragging
- [ ] Can zoom with scroll wheel
- [ ] Grid helper visible at bottom

### View Modes
- [ ] **Default Mode**: Standard view with all nodes
- [ ] **Heatmap Mode**: Overlay appears with color intensity
  - [ ] Switch to Engagement heatmap
  - [ ] Switch to Temporal heatmap
  - [ ] Switch to Controversy heatmap
- [ ] **Clusters Mode**: Translucent bubbles appear around category groups

### Interactive Controls
- [ ] Click on a story node → Details panel appears on right
- [ ] Story details show: title, category, date, source
- [ ] "View Full Story" button links to story page
- [ ] Close button (✕) dismisses details panel

### Control Panel (Bottom Left)
- [ ] View mode buttons work (Default/Heatmap/Clusters)
- [ ] Heatmap type selector appears in Heatmap mode
- [ ] Category filters toggle visibility
- [ ] Total story count updates when filtering
- [ ] Unchecking categories hides those stories

### Time Slider (Bottom Center)
- [ ] Slider appears at bottom
- [ ] Dragging slider changes visible stories
- [ ] Date label updates (e.g., "5 days ago")
- [ ] Play/Pause button present

### Minimap (Bottom Right)
- [ ] Small 2D overview canvas visible
- [ ] Colored dots represent stories
- [ ] Blue circle shows camera position

### Visual Elements
- [ ] Stories color-coded by category:
  - Politics: Blue
  - Business: Green
  - Sports: Orange
  - Technology: Purple
  - Entertainment: Pink
  - Health: Red
  - General: Gray
- [ ] Connection lines between related stories
- [ ] Hover effect: nodes pulse and glow
- [ ] Node size varies by credibility score

### Performance
- [ ] Smooth rotation and zoom
- [ ] No lag with 100+ stories
- [ ] Filters apply instantly
- [ ] View mode switches smoothly

## 🐛 Known Limitations

1. **Positioning**: Uses golden angle spiral (not UMAP/t-SNE yet)
2. **Sample Data**: Falls back to mock data if Supabase unavailable
3. **Real-time Updates**: Not implemented (manual refresh needed)

## 📊 Expected Behavior

### On First Load
- Fetches up to 200 recent stories from database
- Positions them in 3D space using golden angle distribution
- Shows all categories by default
- Default view mode active

### Story Nodes
- Size: Based on source credibility (0.9-1.7 units)
- Color: Category-based
- Hover: Pulsing animation + glow
- Click: Shows details panel

### Heatmap Modes
- **Engagement**: Red = high reactions, Blue = low
- **Temporal**: Red = recent, Blue = old
- **Controversy**: Red = divisive, Blue = consensus

### Cluster Bubbles
- Appear only in Clusters view mode
- Group stories by category
- Translucent wireframe spheres
- Gentle pulsing animation

## 🔧 Troubleshooting

### Issue: Blank screen
- Check browser console for errors
- Verify WebGL is enabled in browser
- Try refreshing the page

### Issue: No stories visible
- Check if all category filters are unchecked
- Adjust time range slider
- Verify API endpoint returns data

### Issue: Performance lag
- Reduce number of visible stories with filters
- Close other browser tabs
- Check GPU acceleration is enabled

### Issue: Controls not working
- Ensure JavaScript is enabled
- Try different browser (Chrome/Firefox recommended)
- Check for console errors

## 📝 Test Results Template

```
Date: ___________
Browser: ___________
Device: ___________

✅ Basic rendering
✅ View modes (Default/Heatmap/Clusters)
✅ Interactive controls
✅ Filters working
✅ Time slider
✅ Minimap
✅ Story details panel
✅ Performance acceptable

Issues found:
1. ___________
2. ___________

Notes:
___________
```

## 🎉 Success Criteria

Event Map is working correctly if:
- ✅ All 3 view modes render properly
- ✅ Stories are clickable and show details
- ✅ Filters affect visible stories
- ✅ No console errors
- ✅ Smooth 60fps interaction
- ✅ Responsive to user input

---

**Ready to test!** Start the dev server and navigate to `/event-map`.
