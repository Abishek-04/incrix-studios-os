# Week 5: Testing Guide for Design & Dev Project Systems

## ✅ Completed Fixes

1. **Fixed `allProjects` prop bug** - Design modal now receives necessary data
2. **Fixed BlockEditor lowlight import** - Updated to use `createLowlight()` for compatibility
3. **Build verification** - Production build now succeeds without errors

---

## 🧪 Manual Testing Checklist

### Prerequisites
- Dev server running: `npx next dev` (http://localhost:3000)
- MongoDB connection working
- Test users with different roles available

### Test 1: Role-Based Navigation Visibility

**Objective**: Verify that navigation items appear correctly based on user role.

| Role | Should See | Should NOT See |
|------|------------|----------------|
| Manager | Design Projects, Dev Projects, Performance, Users, Channels | None |
| Designer | Design Projects, Daily Tasks | Dev Projects, Performance, Users, Channels |
| Developer | Dev Projects, Daily Tasks | Design Projects, Performance, Users, Channels |
| Creator/Editor | Performance, Projects, Board, Calendar | Design Projects, Dev Projects, Users |

**Steps:**
1. Log in with **AccountSwitcher** (bottom right corner)
2. Switch to each role: Alex (Manager), David (Designer), Lisa (Developer), Mike (Creator)
3. Verify navigation menu shows correct items
4. Check header title updates when navigating to each page

**Expected Results:**
- ✅ Designers see purple "Design Projects" icon (Palette)
- ✅ Developers see blue "Dev Projects" icon (Code)
- ✅ Managers see both design and dev project links
- ✅ Content creators don't see design/dev links

---

### Test 2: Design Project CRUD Operations

**Objective**: Create, read, update, delete design projects.

**Steps:**

#### Create:
1. Log in as **Designer** or **Manager**
2. Navigate to Design Projects
3. Click "New Design Project" button
4. Fill out the form:
   - Title: "YouTube Channel Logo"
   - Type: "Logo"
   - Designer: Select yourself
   - Priority: "High"
   - Status: "Not Started"
   - Due Date: Tomorrow
   - Design Brief: "Modern, minimalist logo for tech channel"
5. Click "Create Project"

**Expected Results:**
- ✅ Modal opens with empty form
- ✅ All fields are editable
- ✅ Validation works (required fields marked with *)
- ✅ Project appears in grid after creation
- ✅ Card shows correct stage color (Briefing = blue)

#### Read:
1. Click on the created project card
2. Verify all saved data displays correctly

**Expected Results:**
- ✅ Modal reopens with saved data
- ✅ All fields populated correctly
- ✅ "Edit Design Project" in header

#### Update:
1. With modal open, change:
   - Stage: "Design"
   - Status: "In Progress"
   - Add dimensions: "1920x1080"
   - Add color scheme: "#FF5733, #3498DB"
2. Click "Save Changes"

**Expected Results:**
- ✅ Changes save immediately
- ✅ Card updates with new stage color (Design = amber)
- ✅ Status badge updates to "In Progress"
- ✅ Reopening shows updated data

#### Delete:
1. Open project modal
2. Click "Delete" button (bottom left)
3. Confirm deletion

**Expected Results:**
- ✅ Confirmation prompt appears
- ✅ Project removed from grid after confirmation
- ✅ Modal closes

---

### Test 3: Dev Project CRUD Operations

**Objective**: Create, read, update, delete dev projects.

**Steps:**

#### Create:
1. Log in as **Developer** or **Manager**
2. Navigate to Dev Projects
3. Click "New Dev Project" button
4. Fill out the form:
   - Title: "Add User Authentication"
   - Type: "New Feature"
   - Developer: Select yourself
   - Priority: "High"
   - Status: "Not Started"
   - Due Date: 1 week from now
   - Estimated Hours: 16
   - Repository: "github.com/company/app"
   - Branch: "feature/auth"
   - Requirements: "JWT-based auth with refresh tokens"
   - Technical Spec: "Use NextAuth.js with MongoDB adapter"
5. Click "Create Project"

**Expected Results:**
- ✅ Modal opens with empty form
- ✅ All dev-specific fields present (repo, branch, PR, hours)
- ✅ Project appears in grid
- ✅ Card shows repository info with GitBranch icon

#### Read & Update:
1. Click on project card
2. Update:
   - Stage: "Development"
   - Actual Hours: 8
   - Pull Request: "PR #123"
3. Save changes

**Expected Results:**
- ✅ Hours display as "8/16h" on card
- ✅ Stage color updates (Development = blue)
- ✅ All fields persist correctly

---

### Test 4: Filtering & Search

**Objective**: Verify filtering and search functionality.

#### Design Projects:
1. Create 3 design projects with different:
   - Stages: Briefing, Concept, Design
   - Designers: Different team members
2. Test stage filter dropdown
3. Test designer filter dropdown
4. Test search (by title, description, designer)

**Expected Results:**
- ✅ Stage filter shows only matching projects
- ✅ Designer filter works correctly
- ✅ Search is case-insensitive and searches all relevant fields
- ✅ Filters can be combined
- ✅ Project count updates ("Showing X of Y projects")

#### Dev Projects:
1. Create 3 dev projects with different:
   - Stages: Planning, Development, Testing
   - Developers: Different team members
2. Test filters similarly

**Expected Results:**
- ✅ Same filtering behavior as design projects
- ✅ Search includes repository field

---

### Test 5: Access Control

**Objective**: Verify role-based access restrictions.

**Steps:**
1. Log in as **Creator** (content role)
2. Try to access `/design-projects` directly (URL bar)
3. Try to access `/dev-projects` directly

**Expected Results:**
- ✅ Shows "Access Denied" message
- ✅ Icon displays (Palette for design, Code for dev)
- ✅ Message: "You don't have permission to view X projects"
- ✅ No error in console, just graceful denial

4. Log in as **Manager**
5. Access both pages

**Expected Results:**
- ✅ Full access to both design and dev projects
- ✅ Can create, edit, delete all project types

---

### Test 6: Data Persistence (API Integration)

**Objective**: Verify projects save to MongoDB and persist across reloads.

**Steps:**
1. Create a design project and dev project
2. Refresh the page (Cmd/Ctrl + R)
3. Verify projects still appear
4. Check MongoDB database:
   ```bash
   # Connect to MongoDB and check
   # Should see projects in baseprojects collection
   ```

**Expected Results:**
- ✅ Projects persist after page reload
- ✅ Design projects have `projectType: 'design'`
- ✅ Dev projects have `projectType: 'dev'`
- ✅ All discriminator-specific fields are saved

---

### Test 7: UI/UX Quality

**Objective**: Check visual polish and user experience.

#### Design Quality:
- ✅ Stage color coding matches (Briefing=blue, Concept=purple, etc.)
- ✅ Priority badges colored correctly (High=red, Medium=yellow, Low=gray)
- ✅ Status badges colored correctly
- ✅ Hover effects on cards (border changes to purple/blue)
- ✅ Animations smooth (Framer Motion fade-in)
- ✅ Modal opens/closes smoothly

#### Responsiveness:
1. Resize browser window to mobile size
2. Check grid layout adapts
3. Verify filters stack vertically on mobile

**Expected Results:**
- ✅ Grid switches from 3 columns → 2 → 1 as screen narrows
- ✅ Filters remain usable on mobile
- ✅ Modal is scrollable on small screens

---

### Test 8: Edge Cases

**Objective**: Test unusual scenarios.

1. **Empty State**:
   - Fresh install with no projects
   - Should show empty state message with create button

2. **Long Text**:
   - Create project with very long title (100+ chars)
   - Create project with very long description
   - Verify text truncates/wraps correctly

3. **Date Handling**:
   - Create project with due date in the past
   - Verify "overdue" styling (red text)
   - Create project due today
   - Verify "Due today" displays

4. **Concurrent Edits**:
   - Open same project in two browser tabs
   - Edit in both
   - Last save wins (expected behavior)

**Expected Results:**
- ✅ Graceful handling of all edge cases
- ✅ No console errors
- ✅ UI remains functional

---

## 🐛 Known Issues & Limitations

### Current Limitations:
1. **File Uploads**: Design files are URL-based (no actual upload yet)
2. **Cross-Project Linking**: Related content project field exists but no UI to show links
3. **Daily Task Integration**: `sourceProjectId` field exists but not yet integrated in UI
4. **Board View**: Design/dev projects don't appear on Kanban board yet
5. **Mobile Optimization**: Some modals may be cramped on very small screens

### Non-Critical Issues:
- Mongoose duplicate index warnings (safe to ignore)
- No real-time collaboration yet
- No project templates yet

---

## 📊 Test Results Template

Use this to document your testing:

```
## Test Session: [Date]
Tester: [Name]
Environment: Development / Production

### Test 1: Navigation
- [ ] Manager sees all links
- [ ] Designer sees design link only
- [ ] Developer sees dev link only
Issues: [None / List issues]

### Test 2: Design Projects CRUD
- [ ] Create works
- [ ] Read works
- [ ] Update works
- [ ] Delete works
Issues: [None / List issues]

### Test 3: Dev Projects CRUD
- [ ] Create works
- [ ] Read works
- [ ] Update works
- [ ] Delete works
Issues: [None / List issues]

### Test 4: Filters
- [ ] Stage filter works
- [ ] User filter works
- [ ] Search works
Issues: [None / List issues]

### Test 5: Access Control
- [ ] Access denied for unauthorized roles
- [ ] Manager has full access
Issues: [None / List issues]

### Test 6: Persistence
- [ ] Data survives reload
- [ ] MongoDB stores correctly
Issues: [None / List issues]

### Overall Assessment
Grade: [Pass / Needs Work / Fail]
Critical Issues: [Count]
Minor Issues: [Count]
Notes: [Any additional observations]
```

---

## 🚀 Next Steps After Testing

Once testing is complete:

1. **Fix Critical Bugs**: Any blockers found during testing
2. **Enhance Features**:
   - Add file upload for design files
   - Implement cross-project links in UI
   - Integrate with daily tasks
   - Add design/dev projects to Kanban board
3. **Performance**:
   - Test with 100+ projects
   - Optimize queries if slow
4. **Documentation**:
   - Update user guide
   - Create workflow diagrams
5. **Deploy**:
   - Run production build
   - Test on staging environment
   - Deploy to production

---

## 📝 Feedback

After testing, please provide feedback on:
- Any bugs or issues found
- UX improvements needed
- Missing features that would be valuable
- Performance concerns
- Documentation gaps

This will help prioritize enhancements in future iterations.
