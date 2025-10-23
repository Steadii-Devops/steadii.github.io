# Zoom Iframe Integration Guide

## Problem: Duplicate Variable Error

### Error Details

```
[Error] SyntaxError: Can't create duplicate variable: 'caregiver_id'
  replaceChild (softr-page-renderer.min.js:168:1117)
```

### Root Cause

The error occurs when a variable (in this case `caregiver_id`) is declared multiple times in the same scope using `const`, `let`, or `var` in strict mode. This typically happens when:

1. Custom code blocks in Softr declare the same variable multiple times
2. Code is copy-pasted without proper scoping
3. Variables are declared both globally and within functions

### Solution

**Wrap all custom code in an Immediately Invoked Function Expression (IIFE)** to create a private scope:

```javascript
(function() {
  'use strict';

  // All your variables and code here
  const caregiver_id = '...';
  // ... rest of code

})();
```

## Complete Integration Steps

### Step 1: Fix the Meeting Page Code

**Location:** Softr → Meeting Page → Custom Code Block (Header or Body)

**Replace any existing code with:**

```html
<script src="https://steadii-devops.github.io/steadii.github.io/meeting-page-code.js"></script>
```

**OR** if you prefer inline code, copy the entire contents of `meeting-page-code.js` into a `<script>` tag.

### Step 2: Add Meeting Container to Page

**Location:** Softr → Meeting Page → Custom HTML Block

```html
<div id="zoom-meeting-container">
  <div class="loading-spinner">
    <div class="spinner"></div>
    <p>Loading your meeting...</p>
  </div>
</div>

<style>
  body, html {
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

  #zoom-meeting-container {
    width: 100vw;
    height: 100vh;
    position: fixed;
    top: 0;
    left: 0;
    background-color: #000;
  }

  .loading-spinner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background-color: #1a202c;
    color: white;
  }

  .spinner {
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top: 4px solid #4299e1;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>
```

### Step 3: Update "Join Session" Button Handler

**Location:** Softr → Caregiver Details Page → Custom Code Block

**Replace any existing join session code with:**

```html
<script src="https://steadii-devops.github.io/steadii.github.io/join-session-button-code.js"></script>
```

**OR** copy the entire contents of `join-session-button-code.js` into a `<script>` tag.

### Step 4: Ensure Legacy Notification Guard is Loaded

**Location:** Softr → Site-wide Custom Code (Header) or each page's header

```html
<script src="https://steadii-devops.github.io/steadii.github.io/legacy-notif-guard-enhanced.js"></script>
```

**This must be the FIRST script loaded on every page.**

## How It Works

### Flow Diagram

```
Caregiver Details Page
│
├─ User clicks "Join Session" button
│  └─ join-session-button-code.js
│     ├─ Extracts Zoom meeting URL
│     ├─ Extracts session ID (if available)
│     └─ Redirects to /meeting?meetingUrl=...&sessionId=...
│
Meeting Page
│
├─ meeting-page-code.js loads
│  ├─ Extracts URL parameters (meetingUrl, sessionId)
│  ├─ Creates fullscreen iframe
│  ├─ Sets iframe src to Zoom meeting URL
│  ├─ Hides loading spinner
│  └─ User joins Zoom meeting
```

### Variable Scoping

All code is wrapped in IIFEs to prevent variable conflicts:

```javascript
// File 1: join-session-button-code.js
(function() {
  'use strict';
  const caregiver_id = '...'; // Scoped to this file only
})();

// File 2: meeting-page-code.js
(function() {
  'use strict';
  const caregiver_id = '...'; // Different scope, no conflict!
})();
```

## Troubleshooting

### Issue: Still seeing duplicate variable error

**Solution:**

1. Check **all** custom code blocks on the page
2. Look for any code that declares `caregiver_id` outside of an IIFE
3. Wrap each code block in `(function() { ... })()`
4. Clear browser cache and hard reload (Cmd+Shift+R or Ctrl+Shift+R)

### Issue: Zoom iframe not displaying

**Debug steps:**

1. Open browser console
2. Check for errors
3. Run: `window.MeetingPageDebug.meetingUrl`
   - Should show the Zoom URL
   - If null, the URL parameter is not being passed correctly
4. Check that `/meeting` page exists in Softr
5. Verify URL parameters are in the format: `/meeting?meetingUrl=https://zoom.us/...`

### Issue: "Join Session" button not working

**Debug steps:**

1. Open browser console
2. Run: `window.JoinSessionHandler.getZoomMeetingUrl()`
   - Should return the Zoom meeting URL
   - If null, add the URL to the page in one of these ways:
     - Data attribute: `<div data-zoom-url="https://zoom.us/..."></div>`
     - Hidden input: `<input type="hidden" name="zoom_meeting_url" value="https://zoom.us/...">`
3. Check that button contains text "Join Session", "Start Meeting", or "Join Meeting"
4. Try manually: `window.JoinSessionHandler.handleJoinSession('https://zoom.us/...')`

### Issue: Loading spinner won't disappear

**Solution:**

1. Ensure `meeting-page-code.js` is loaded
2. Check console for errors
3. Verify `#zoom-meeting-container` element exists on page
4. Try manually: `window.MeetingPageDebug.reinitialize()`

## Testing Checklist

- [ ] No console errors on page load
- [ ] "Join Session" button is clickable (no spinner blocking it)
- [ ] Clicking "Join Session" redirects to `/meeting` page
- [ ] Meeting page shows loading spinner initially
- [ ] Zoom iframe loads and replaces loading spinner
- [ ] Zoom meeting is accessible and functional
- [ ] Camera/microphone permissions work
- [ ] No duplicate variable errors in console
- [ ] Works on Chrome, Safari, Firefox, Edge
- [ ] Works on mobile (iOS Safari, Android Chrome)

## File Reference

### Created Files

1. **meeting-page-code.js** - Main meeting page JavaScript
2. **meeting-page-template.html** - Complete HTML template for reference
3. **join-session-button-code.js** - Button handler for caregiver details page
4. **ZOOM_IFRAME_INTEGRATION.md** - This documentation

### Existing Files (Already Deployed)

1. **legacy-notif-guard-enhanced.js** - Error prevention guard

## Deployment Steps

1. **Commit files to repository:**
   ```bash
   git add meeting-page-code.js join-session-button-code.js meeting-page-template.html ZOOM_IFRAME_INTEGRATION.md
   git commit -m "Add Zoom iframe integration with duplicate variable fix"
   git push
   ```

2. **Update Softr pages:**
   - Meeting page: Add script reference to `meeting-page-code.js`
   - Meeting page: Add HTML container for iframe
   - Caregiver details page: Add script reference to `join-session-button-code.js`
   - Site-wide header: Ensure `legacy-notif-guard-enhanced.js` is loaded

3. **Test in staging:**
   - Test on multiple browsers
   - Test on mobile devices
   - Verify no console errors

4. **Deploy to production:**
   - Update production Softr site
   - Monitor for errors
   - Be ready to rollback if issues occur

## Support

For issues or questions:

- Check browser console for error messages
- Run debug commands: `window.MeetingPageDebug` or `window.JoinSessionHandler`
- Create issue in repository with:
  - Browser/device information
  - Console logs
  - Steps to reproduce
  - Screenshots if applicable

## Version History

- **v1.0** (2025-10-23): Initial implementation with duplicate variable fix

---

**Status:** ✓ Ready for deployment
**Last Updated:** 2025-10-23
