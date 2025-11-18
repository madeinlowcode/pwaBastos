# Architectural Decision Records (ADRs)

## Overview
This document tracks all significant architectural decisions made during the development of the PWA Medical Appointment Scheduling application. Each decision includes context, alternatives considered, and justification.

## Active Decisions

### ADR-001: Use Local PNG Icons Instead of CDN for Notifications
**Status**: APPROVED
**Date**: 2025-10-21
**Context**: Notification System Implementation
**Impact**: MEDIUM

**Problem**:
Push notifications need consistent branding with custom medical cross icons. Initial implementation used CDN URLs which caused dependency on external services and brand inconsistency.

**Alternatives Considered**:
1. **CDN Icons (Flaticon, etc.)**
   - Pros: Easy to implement, no asset management
   - Cons: External dependency, generic icons, no branding, potential downtime

2. **SVG Icons**
   - Pros: Scalable, small file size
   - Cons: Limited browser support for SVG in notifications, compatibility issues

3. **Local PNG Files** (CHOSEN)
   - Pros: No external dependencies, custom branding, full control, works offline
   - Cons: Requires asset management, larger file sizes

**Decision**:
Use locally hosted PNG files for all notification icons and badges. Create complete icon set (9 sizes) for both Android and iOS devices.

**Technical Impact**:
- Created `public/icons/` directory with 9 PNG files
- Updated `service-worker.js` to use local paths
- Updated `services/notificationService.js` icon paths
- Added icons to service worker cache (v4)
- Total icon asset size: ~150KB (acceptable for PWA)

**Files Affected**:
- `public/icons/` (9 PNG files created)
- `public/service-worker.js` (lines 95-96, cache array)
- `services/notificationService.js` (lines 45-46)

**Validation**:
Tested on PC Chrome, Android Chrome. Icons display correctly in notification tray and maintain brand consistency.

---

### ADR-002: Separate Public and Protected Route Groups
**Status**: APPROVED
**Date**: 2025-10-21
**Context**: Testing Infrastructure
**Impact**: HIGH

**Problem**:
Test routes for push notifications needed to be publicly accessible for external testing (via ngrok), but were returning 302 redirects due to authentication middleware applied to all notification routes.

**Alternatives Considered**:
1. **Disable Auth Middleware Conditionally**
   - Pros: Keep routes in same file
   - Cons: Security risk, complex logic, hard to maintain

2. **Use Query Parameter to Bypass Auth**
   - Pros: Simple implementation
   - Cons: Major security vulnerability, not recommended

3. **Create Separate Public Router** (CHOSEN)
   - Pros: Clean separation, secure, maintainable, follows Express best practices
   - Cons: Additional file, more routing configuration

**Decision**:
Create separate `routes/testRoutes.js` file for public routes without authentication middleware. Mount this router in `server.js` BEFORE protected routes.

**Technical Impact**:
- Created new file: `routes/testRoutes.js`
- Routes `/test-push` and `/test-info` are publicly accessible
- Protected routes remain in `routes/notificationRoutes.js`
- Clear separation of public vs protected endpoints
- Proper route ordering in `server.js` (public first, then protected)

**Implementation**:
```javascript
// server.js (line 45)
const testRoutes = require('./routes/testRoutes');
app.use('/', testRoutes); // Public routes

// Later in file (line 50)
app.use('/notificacoes', isAuthenticated, notificationRoutes); // Protected
```

**Files Affected**:
- `routes/testRoutes.js` (new file)
- `server.js` (line 45)

**Validation**:
Successfully tested via ngrok URL without authentication. Protected routes still require login.

---

### ADR-003: Use PostgreSQL for Notification Persistence
**Status**: APPROVED
**Date**: 2025-10-21
**Context**: Notification System Architecture
**Impact**: HIGH

**Problem**:
Need persistent storage for notification history, read/unread status, and user subscriptions. Must support complex queries for filtering and user-specific data.

**Alternatives Considered**:
1. **In-Memory Storage (Array)**
   - Pros: Fast, simple
   - Cons: Data lost on restart, no persistence, not scalable

2. **MongoDB**
   - Pros: Flexible schema, good for notifications
   - Cons: Additional database, learning curve, overkill for structured data

3. **PostgreSQL via Supabase** (CHOSEN)
   - Pros: Already in use for users/appointments, ACID compliance, powerful queries, free tier
   - Cons: Relational model requires schema planning

**Decision**:
Extend existing PostgreSQL database with two new tables: `notifications` and `push_subscriptions`. Leverage existing Supabase connection.

**Database Schema**:
```sql
-- notifications table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lido BOOLEAN DEFAULT FALSE,
    tipo VARCHAR(50),
    urgencia VARCHAR(20)
);

-- push_subscriptions table
CREATE TABLE push_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Technical Impact**:
- Notification history persists across server restarts
- Supports multiple devices per user
- Efficient queries for unread count, filtering
- Proper foreign key relationships
- Automatic cleanup of expired subscriptions

**Files Affected**:
- Database schema (via migrations)
- `services/notificationService.js` (database queries)
- `controllers/notificationController.js` (CRUD operations)

**Validation**:
Tested with multiple users and devices. Data persists correctly, queries perform well.

---

### ADR-004: Implement VAPID Authentication for Web Push
**Status**: APPROVED
**Date**: 2025-10-21
**Context**: Push Notification Security
**Impact**: CRITICAL

**Problem**:
Web Push API requires authentication to prevent spam and verify sender identity. Must choose authentication method for production use.

**Alternatives Considered**:
1. **No Authentication**
   - Pros: Simple
   - Cons: Not allowed by modern browsers, security risk

2. **GCM/FCM (Google)**
   - Pros: Widely supported
   - Cons: Vendor lock-in, requires Google account, complex setup

3. **VAPID (Voluntary Application Server Identification)** (CHOSEN)
   - Pros: Standard protocol, vendor-agnostic, self-generated keys, works with all browsers
   - Cons: Requires key management

**Decision**:
Use VAPID authentication with self-generated public/private key pair. Store keys in environment variables.

**Implementation Details**:
- Generated VAPID keys using `node generate-vapid-keys.js`
- Public key: `BErUUdx3ycEXpQh-BQVFUIUcknlK8TtWJtJF1VAqFvzV7H00tDloMnASIiucCayJlLFCRraYe3TYNAibBWZlTUI`
- Private key stored in `.env` file
- Mailto: Configured in environment

```javascript
// services/notificationService.js (line 8-12)
webpush.setVapidDetails(
    `mailto:${process.env.VAPID_MAILTO}`,
    process.env.PUBLIC_VAPID_KEY,
    process.env.PRIVATE_VAPID_KEY
);
```

**Technical Impact**:
- Secure push notification delivery
- Works on Chrome, Firefox, Edge, Safari
- No third-party dependencies
- Keys must be backed up securely

**Files Affected**:
- `services/notificationService.js` (lines 8-12, 29-50)
- `.env` (VAPID keys)
- `generate-vapid-keys.js` (key generation script)

**Validation**:
Tested on PC and Android. Push notifications delivered successfully with VAPID authentication.

---

### ADR-005: Use Cache v4 Strategy with Selective Caching
**Status**: APPROVED
**Date**: 2025-10-21
**Context**: Service Worker Optimization
**Impact**: MEDIUM

**Problem**:
Service worker needs efficient caching strategy that avoids caching redirects while maintaining good offline experience. Previous versions had cache conflicts.

**Alternatives Considered**:
1. **Cache Everything**
   - Pros: Maximum offline availability
   - Cons: Caches redirects, authentication issues, large cache size

2. **Cache Nothing (Network Only)**
   - Pros: Always fresh data
   - Cons: No offline support, defeats PWA purpose

3. **Selective Caching by Status Code** (CHOSEN)
   - Pros: Only caches successful responses (200-299), avoids redirect loops, good offline UX
   - Cons: Requires status code checking logic

**Decision**:
Implement cache v4 with status code validation. Only cache responses with status 200-299. Use network-first for navigation, cache-first for static assets.

**Implementation**:
```javascript
// service-worker.js (lines 110-120)
const networkResponse = await fetch(event.request);

// Don't cache redirects (3xx status codes)
if (networkResponse.status >= 200 && networkResponse.status < 300) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(event.request, networkResponse.clone());
}

return networkResponse;
```

**Cache Strategy**:
- **Navigation requests**: Network-first (always try network, fallback to cache)
- **Static assets** (CSS, JS, images): Cache-first (fast load, update in background)
- **API calls**: Network-only (always fresh data)
- **Redirects**: Never cached (prevents loops)

**Technical Impact**:
- Improved offline navigation
- No redirect loops
- Smaller cache size
- Better performance
- Cache version bump to v4 (auto-cleanup of old caches)

**Files Affected**:
- `public/service-worker.js` (lines 5, 110-120)

**Validation**:
Tested offline mode, navigation works correctly. No redirect loops. Cache size acceptable.

---

### ADR-006: Integrate Notifications with Appointment Creation
**Status**: APPROVED
**Date**: 2025-10-21
**Context**: User Experience Enhancement
**Impact**: MEDIUM

**Problem**:
Users need immediate confirmation when they create an appointment. Email notifications are delayed and may go to spam.

**Alternatives Considered**:
1. **Email Only**
   - Pros: Familiar, works everywhere
   - Cons: Delayed, spam filters, no real-time feedback

2. **In-App Toast/Alert Only**
   - Pros: Immediate feedback
   - Cons: User might miss it, no persistent record

3. **Push Notification + Persistent Inbox** (CHOSEN)
   - Pros: Immediate delivery, persistent record, works even when app closed, increases engagement
   - Cons: Requires permission, more complex implementation

**Decision**:
Send push notification automatically when user creates an appointment. Store notification in database for inbox history. Notification includes doctor name, specialty, date, and time.

**Implementation**:
```javascript
// controllers/appointmentController.js (lines 65-72)
const customMessage = `Sua consulta com ${doctorName} (${specialty}) foi agendada para ${formattedDate} às ${appointmentTime}.`;

await sendPushNotification(
    userId,
    'Nova Consulta Agendada!',
    customMessage
);
```

**Technical Impact**:
- Better user engagement
- Immediate confirmation feedback
- Reduces missed appointments
- Increases perceived responsiveness
- Notification sent ONLY to user who created appointment

**User Flow**:
1. User creates appointment via form
2. Appointment saved to database
3. Push notification sent immediately
4. Notification appears in system tray
5. Notification stored in inbox for later reference

**Files Affected**:
- `controllers/appointmentController.js` (lines 65-72)
- `services/notificationService.js` (notification delivery)

**Validation**:
Tested appointment creation. Notification delivered within 1 second. Message format clear and informative.

---

### ADR-007: Use Session-Based Authentication Instead of JWT
**Status**: APPROVED
**Date**: 2025-10-21
**Context**: Authentication Architecture
**Impact**: HIGH

**Problem**:
Need secure authentication system for protecting routes and managing user state. Must choose between session-based and token-based authentication.

**Alternatives Considered**:
1. **JWT (JSON Web Tokens)**
   - Pros: Stateless, scalable, works well with APIs, mobile-friendly
   - Cons: Cannot invalidate tokens, larger payload, more complex refresh logic

2. **Session-Based with express-session** (CHOSEN)
   - Pros: Simple to implement, server-controlled, easy to invalidate, works well with SSR
   - Cons: Requires server memory/storage, less scalable horizontally

**Decision**:
Use session-based authentication with `express-session` middleware and PostgreSQL session store. Session data includes userId and email.

**Rationale**:
- Application uses server-side rendering (Handlebars)
- Single server deployment (not microservices)
- Need ability to invalidate sessions immediately
- Simpler implementation for PWA use case
- Better security for web-based application

**Implementation**:
```javascript
// server.js (lines 25-32)
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));
```

**Session Data Structure**:
```javascript
req.session = {
    userId: 123,
    email: "user@example.com"
}
```

**Technical Impact**:
- Session middleware applied to all routes
- `isAuthenticated` middleware checks session
- Protected routes redirect to login if no session
- Logout clears session immediately
- Session persists for 24 hours

**Files Affected**:
- `server.js` (lines 25-32, middleware setup)
- `routes/authRoutes.js` (login/logout)
- `routes/appointmentRoutes.js` (protected routes)
- `routes/notificationRoutes.js` (protected routes)

**Validation**:
Tested login/logout flow. Sessions persist correctly. Protected routes properly secured.

---

## Decision Statistics

### By Status
- APPROVED: 7
- SUPERSEDED: 0
- DEPRECATED: 0
- TOTAL: 7

### By Impact Level
- CRITICAL: 1 (VAPID authentication)
- HIGH: 3 (Routes, PostgreSQL, Sessions)
- MEDIUM: 3 (Icons, Cache, Appointment integration)

### By Category
- Security: 2 (VAPID, Sessions)
- Architecture: 3 (PostgreSQL, Routes, Sessions)
- Performance: 1 (Cache strategy)
- UX: 2 (Icons, Appointment notifications)

---

## ADR Template

When documenting a new architectural decision, use this template:

```markdown
### ADR-XXX: [Brief Title]
**Status**: [DRAFT | APPROVED | SUPERSEDED | DEPRECATED]
**Date**: YYYY-MM-DD
**Context**: [Related feature or task]
**Impact**: [CRITICAL | HIGH | MEDIUM | LOW]

**Problem**:
[Describe the problem requiring a decision]

**Alternatives Considered**:
1. **Option 1**
   - Pros: [advantages]
   - Cons: [disadvantages]

2. **Option 2** (CHOSEN)
   - Pros: [advantages]
   - Cons: [disadvantages]

**Decision**:
[Explain the chosen approach and why]

**Technical Impact**:
[Describe implementation details, code changes, dependencies]

**Files Affected**:
- `path/to/file.js` (lines X-Y)

**Validation**:
[How the decision was tested and validated]
```

---

## Notes
- All decisions made during notification system implementation have been documented
- Decisions remain active and should be followed in future development
- Any superseding decisions must reference the original ADR
- Review decisions quarterly to ensure they remain valid
