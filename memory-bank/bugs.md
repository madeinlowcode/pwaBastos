# Bug Tracking

## Overview
This document tracks all bugs found during the development of the PWA Medical Appointment Scheduling application, including their severity, status, and resolution details.

## Active Bugs
*No active bugs at this time.*

## Fixed Bugs

### BUG-001: Notification Icon Showing as Star Instead of Medical Cross
**Severity**: MEDIUM
**Status**: FIXED
**Found**: 2025-10-21
**Fixed**: 2025-10-21
**Related Task**: Notification System Implementation

**Description**:
Push notifications were displaying a generic star icon from CDN instead of the custom medical cross branding icon. This affected brand consistency and user recognition of the application.

**Impact**:
- Poor brand recognition in notification tray
- Inconsistent visual identity
- User confusion about notification source

**Root Cause**:
Service worker was using CDN URLs for notification icons:
```javascript
// BEFORE (service-worker.js)
icon: 'https://cdn-icons-png.flaticon.com/512/3209/3209265.png'
badge: 'https://cdn-icons-png.flaticon.com/512/3209/3209265.png'
```

**Solution**:
Changed to use locally hosted PNG files with medical cross branding:
```javascript
// AFTER (service-worker.js, line ~95)
icon: '/icons/android-launchericon-192-192.png'
badge: '/icons/android-launchericon-96-96.png'
```

**Files Modified**:
- `public/service-worker.js` (lines 95-96)
- `services/notificationService.js` (lines 45-46)

**Testing**:
Verified on PC and Android mobile devices. Notifications now display correct medical cross icon.

---

### BUG-002: Missing Route for Marking Notifications as Unread
**Severity**: HIGH
**Status**: FIXED
**Found**: 2025-10-21
**Fixed**: 2025-10-21
**Related Task**: Notification Management Features

**Description**:
The notification inbox UI had a "Marcar como não lida" button, but clicking it resulted in a 404 error. The route `/notificacoes/marcar-nao-lida` was not implemented in the backend.

**Impact**:
- Users unable to mark read notifications as unread
- Poor user experience with broken functionality
- Console errors in browser

**Root Cause**:
Missing controller function and route definition. Only "mark as read" and "mark all as read" were implemented.

**Solution**:
1. Added controller function in `controllers/notificationController.js`:
```javascript
// Line 104-125
exports.markNotificationAsUnread = async (req, res) => {
    const { notificationId } = req.body;
    const userId = req.session.userId;

    try {
        await pool.query(
            'UPDATE notifications SET lido = FALSE WHERE id = $1 AND user_id = $2',
            [notificationId, userId]
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao marcar notificação como não lida:', error);
        res.status(500).json({ success: false, error: 'Erro ao atualizar notificação' });
    }
};
```

2. Added route in `routes/notificationRoutes.js`:
```javascript
// Line 23
router.post('/marcar-nao-lida', notificationController.markNotificationAsUnread);
```

**Files Modified**:
- `controllers/notificationController.js` (lines 104-125)
- `routes/notificationRoutes.js` (line 23)

**Testing**:
Verified full read/unread toggle functionality in notification inbox.

---

### BUG-003: Test Routes Returning 302 Redirect Instead of Success Response
**Severity**: HIGH
**Status**: FIXED
**Found**: 2025-10-21
**Fixed**: 2025-10-21
**Related Task**: Public Testing Infrastructure

**Description**:
Public test routes `/test-push` and `/test-info` were returning 302 redirects to the login page instead of executing the notification test. This prevented external testing and debugging.

**Impact**:
- Unable to test push notifications without authentication
- Blocked external testing via ngrok
- Poor developer experience

**Root Cause**:
Test routes were added to `notificationRoutes.js` which uses the `isAuthenticated` middleware. All routes in that router require authentication.

```javascript
// BEFORE (server.js)
app.use('/notificacoes', notificationRoutes); // All routes protected
```

**Solution**:
Created separate public test router without authentication middleware:

1. Created new file `routes/testRoutes.js`:
```javascript
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.get('/test-push', notificationController.sendTestNotification);
router.get('/test-info', async (req, res) => {
    // Implementation...
});

module.exports = router;
```

2. Added to `server.js` BEFORE protected routes:
```javascript
// Line 45 (before notificationRoutes)
const testRoutes = require('./routes/testRoutes');
app.use('/', testRoutes); // Public routes without auth
```

**Files Created**:
- `routes/testRoutes.js` (new file)

**Files Modified**:
- `server.js` (line 45)

**Testing**:
Successfully tested via `https://overargumentatively-unsprouting-lizzette.ngrok-free.dev/test-push`

---

### BUG-004: PWA Not Installable on Mobile Devices
**Severity**: CRITICAL
**Status**: FIXED
**Found**: 2025-10-21
**Fixed**: 2025-10-21
**Related Task**: PWA Installation System

**Description**:
The PWA was not showing the "Add to Home Screen" prompt on mobile devices. Browser console showed warnings about missing icons in the manifest file. Lighthouse audit failed the installability check.

**Impact**:
- Users unable to install PWA on home screen
- Core PWA functionality broken
- Failed PWA compliance standards
- Poor offline experience

**Root Cause**:
The `manifest.json` file had incomplete icon configuration:
```json
// BEFORE
{
  "icons": []
}
```

**Solution**:
1. Created complete icon set (9 PNG files) in `public/icons/`:
   - android-launchericon-48-48.png
   - android-launchericon-72-72.png
   - android-launchericon-96-96.png
   - android-launchericon-144-144.png
   - android-launchericon-192-192.png
   - android-launchericon-512-512.png
   - ios-appicon-152-152.png
   - ios-appicon-167-167.png
   - ios-appicon-180-180.png

2. Updated `manifest.json` with complete icons array:
```json
// Line 9-81
"icons": [
  {
    "src": "/icons/android-launchericon-48-48.png",
    "sizes": "48x48",
    "type": "image/png",
    "purpose": "any maskable"
  },
  // ... 8 more icons
]
```

3. Added favicon and Apple touch icons to `views/layouts/main.hbs`:
```html
<!-- Lines 8-11 -->
<link rel="icon" type="image/png" sizes="48x48" href="/icons/android-launchericon-48-48.png">
<link rel="apple-touch-icon" sizes="152x152" href="/icons/ios-appicon-152-152.png">
<link rel="apple-touch-icon" sizes="167x167" href="/icons/ios-appicon-167-167.png">
<link rel="apple-touch-icon" sizes="180x180" href="/icons/ios-appicon-180-180.png">
```

**Files Created**:
- `public/icons/` (9 PNG files)

**Files Modified**:
- `public/manifest.json` (lines 9-81)
- `views/layouts/main.hbs` (lines 8-11)
- `public/service-worker.js` (updated cache to include all icons)

**Testing**:
- Lighthouse PWA audit: PASSED
- Chrome DevTools: "Add to Home Screen" available
- Android mobile: Successfully installable
- iOS: Shows install prompt

---

### BUG-005: Service Worker Cache Conflicts with Redirects
**Severity**: MEDIUM
**Status**: FIXED
**Found**: 2025-10-21
**Fixed**: 2025-10-21
**Related Task**: Service Worker Improvements

**Description**:
The service worker was caching HTTP 302 redirect responses, causing navigation issues. Users would be stuck in redirect loops when accessing protected routes while offline.

**Impact**:
- Poor offline navigation experience
- Unexpected redirect loops
- Cached authentication redirects
- Degraded PWA performance

**Root Cause**:
Fetch event handler was caching all responses without checking status codes:
```javascript
// BEFORE
const networkResponse = await fetch(event.request);
cache.put(event.request, networkResponse.clone());
return networkResponse;
```

**Solution**:
Added status code validation before caching:
```javascript
// AFTER (service-worker.js, lines 110-120)
const networkResponse = await fetch(event.request);

// Don't cache redirects (3xx status codes)
if (networkResponse.status >= 200 && networkResponse.status < 300) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(event.request, networkResponse.clone());
}

return networkResponse;
```

**Files Modified**:
- `public/service-worker.js` (lines 110-120)

**Testing**:
- Verified offline navigation works correctly
- No redirect loops when offline
- Protected routes properly handled
- Cache only contains valid responses (status 200-299)

---

## Bug Statistics

### By Severity
- CRITICAL: 1 (100% fixed)
- HIGH: 2 (100% fixed)
- MEDIUM: 2 (100% fixed)
- LOW: 0

### By Status
- FIXED: 5
- ACTIVE: 0
- TOTAL: 5

### By Component
- Service Worker: 2 bugs
- Routing: 2 bugs
- PWA Configuration: 1 bug

### Resolution Rate
- 100% (5/5 bugs fixed)

---

## Bug Reporting Template

When reporting a new bug, use this template:

```markdown
### BUG-XXX: [Brief Title]
**Severity**: [CRITICAL | HIGH | MEDIUM | LOW]
**Status**: [ACTIVE | FIXED | WONTFIX]
**Found**: YYYY-MM-DD
**Fixed**: YYYY-MM-DD (if applicable)
**Related Task**: [Task name or ID]

**Description**:
[Detailed description of the bug]

**Impact**:
- [Impact point 1]
- [Impact point 2]

**Root Cause**:
[Technical explanation with code if applicable]

**Solution**:
[How it was fixed, with code examples]

**Files Modified**:
- `path/to/file.js` (lines X-Y)

**Testing**:
[How the fix was verified]
```

---

## Notes
- All bugs discovered during notification system implementation have been resolved
- No known active bugs at this time
- Continue monitoring for issues during production deployment
- All fixes have been tested on PC and Android mobile devices
