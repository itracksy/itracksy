# Quick Start Guide - New Card Features

## 🚀 Getting Started

All the new features have been implemented and are ready to use! Here's a quick guide to start using them.

## 🎯 Feature Overview

### 1. ⏰ Deadline with Countdown
**What it does**: Shows when a task is due with automatic countdown
**Where**: Visible on each card in the board view
**Display**:
- "Due: Oct 10 (in 8 days)" - upcoming
- "Due: Oct 10 (today)" - due today
- "Due: Oct 10 (overdue by 2 days)" - past due

**Colors**:
- 🔴 Red = Overdue
- 🟠 Orange = Due today
- 🟡 Yellow = Due in 1-3 days
- ⚪ Gray = Due later

### 2. ⏱️ Estimated Time
**What it does**: Set how long you think a task will take
**Where**: Card detail dialog
**Benefit**: When you start a focus session, it automatically uses this time instead of the default

**Example**:
- Set estimated time: 2 hours 30 minutes
- Click "Start" on the card
- Timer starts at 2h 30m countdown

### 3. ✅ Subtasks
**What it does**: Break down tasks into smaller checkable items
**Where**: Card detail dialog
**Display**: "20% - 2/10 completed" on the card

**Usage**:
1. Open card detail
2. Type subtask name
3. Press Enter or click +
4. Check off as you complete

### 4. 📊 Column Metrics
**What it does**: Shows total cards and estimated time per column
**Where**: Top of each column
**Display**: "6 cards | Est: 10.5h"

## 📝 Step-by-Step Examples

### Example 1: Create a Task with Deadline

```
1. Create or click on a card
2. In the dialog, find "Due Date"
3. Click the date field
4. Select: October 10, 2025
5. Click "Save"
6. Card now shows: "Due: Oct 10 (in 8 days)"
```

### Example 2: Add Estimated Time

```
1. Click on a card
2. Find "Estimated Time" section
3. Enter:
   Hours: 2
   Minutes: 30
4. Click "Save"
5. Card shows: "Estimated: 2h 30m"
6. Click "Start" on card
7. Timer starts at 2:30:00 (countdown)
```

### Example 3: Break Down with Subtasks

```
1. Click on "Design Homepage" card
2. Scroll to "Subtasks" section
3. Add these subtasks:
   - "Create wireframe"
   - "Choose color scheme"
   - "Design header"
   - "Design footer"
4. Click "Save"
5. Card shows: "0% - 0/4 completed"
6. Complete wireframe: Check the box
7. Card updates: "25% - 1/4 completed"
```

### Example 4: Track Project Progress

```
Column: "In Progress"
Cards:
- Design Homepage (Est: 3h)
- Build Login Page (Est: 2h 30m)
- Write Tests (Est: 1h)

Column header shows: "3 cards | Est: 6.5h"
```

## 💡 Pro Tips

### Tip 1: Use All Features Together
```
Card: "Launch Marketing Campaign"
├─ Due Date: Nov 15 (in 12 days)
├─ Estimated: 8h
└─ Subtasks:
   ✅ Research target audience (done)
   ✅ Create content calendar (done)
   ☐ Design graphics
   ☐ Schedule posts
   ☐ Launch campaign

Progress: 40% - 2/5 completed
```

### Tip 2: Deadline Color Coding
Use the colors to prioritize:
1. 🔴 Red (overdue) - Handle first!
2. 🟠 Orange (today) - Do today
3. 🟡 Yellow (soon) - Plan for this week
4. ⚪ Gray (later) - Future work

### Tip 3: Column Planning
Track your sprint/week:
```
ToDo Column: 5 cards | Est: 12h
In Progress: 3 cards | Est: 6.5h
Done: 8 cards | Est: 20h

Total: 16 cards | 38.5h of work
```

### Tip 4: Realistic Estimates
Start with estimates, then compare with actual time tracked:
```
Card: "Build API endpoint"
Estimated: 2h
Actual tracked: 3h 15m

Learn for next time! 🎯
```

## 🎨 Visual Layout (Card Example)

```
┌─────────────────────────────────────────┐
│ 🗑️ Design Homepage              [Delete]│
│                                          │
│ Create wireframes and mockups for       │
│ the new homepage design...               │
│                                          │
│ 📅 Due: Oct 10 (in 8 days)              │
│ ⏱️ Estimated: 3h                         │
│ ✅ 40% - 2/5 completed                   │
│                                          │
│ ⏲️ 00:00:00           [▶️ Start (3h)]    │
└─────────────────────────────────────────┘
```

## 🔧 Technical Notes

- **Database**: New fields automatically added on next app start
- **Compatibility**: All fields are optional, old cards work fine
- **Data Format**:
  - Dates stored as Unix timestamps
  - Time stored as minutes
  - Subtasks stored as JSON

## ❓ FAQ

**Q: Do I have to set all fields for every card?**
A: No! All fields are optional. Use what you need.

**Q: What happens to existing cards?**
A: They continue to work exactly as before. New fields are optional.

**Q: Can I edit these later?**
A: Yes! Just click the card and update any field.

**Q: Do subtasks affect the main task timer?**
A: No, subtasks are just checkboxes. The main timer tracks the whole card.

**Q: Can I have a deadline without estimated time?**
A: Yes! Use any combination of features you want.

## 🎯 Best Practices

1. **Set deadlines for time-sensitive tasks**
   - Client deliverables
   - Meeting prep
   - Release dates

2. **Use estimated time for planning**
   - Daily capacity planning
   - Sprint planning
   - Time blocking

3. **Break down complex tasks with subtasks**
   - Multi-step processes
   - Checklists
   - Deliverables with parts

4. **Monitor column metrics for**
   - Sprint planning
   - Capacity management
   - Progress tracking

## 🚦 Next Steps

1. ✅ Read this guide
2. ✅ Start the app
3. ✅ Create or edit a card
4. ✅ Try each feature
5. ✅ Start a focus session with estimated time
6. ✅ Watch your productivity soar! 🚀

## 📚 Additional Documentation

- `CARD_FEATURES_UPDATE.md` - Detailed technical documentation
- `IMPLEMENTATION_SUMMARY.md` - Complete implementation details

---

**Ready to boost your productivity? Start using these features now! 🎉**





