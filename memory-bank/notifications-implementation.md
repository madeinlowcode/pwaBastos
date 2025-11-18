# Push Notification System - Complete Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Components](#components)
4. [Database Schema](#database-schema)
5. [API Reference](#api-reference)
6. [Service Worker](#service-worker)
7. [Testing](#testing)
8. [Deployment](#deployment)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The PWA Medical Appointment Scheduling application implements a complete push notification system that enables real-time communication with users even when the application is closed. This system provides:

- **Real-time push notifications** via Web Push API
- **Persistent notification inbox** for message history
- **Multi-device support** (multiple subscriptions per user)
- **Automatic appointment confirmations** on appointment creation
- **VAPID authentication** for secure delivery
- **Offline support** via service worker caching

### Key Features
- ✅ Push notifications with custom medical cross branding
- ✅ Notification inbox with read/unread status
- ✅ Mark as read/unread functionality
- ✅ Automatic notification on appointment creation
- ✅ Public testing routes for development
- ✅ Multi-device subscription management
- ✅ Automatic cleanup of expired subscriptions

---

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│   User Device   │
│  (Browser PWA)  │
└────────┬────────┘
         │ 1. Subscribe
         │
         ▼
┌─────────────────────────────────────────┐
│         Express.js Server               │
│  ┌───────────────────────────────────┐  │
│  │  Notification Controller          │  │
│  │  - subscribeToPush()              │  │
│  │  - renderNotificationsPage()      │  │
│  │  - markAsRead/Unread()            │  │
│  └──────────┬────────────────────────┘  │
│             │                            │
│             ▼                            │
│  ┌───────────────────────────────────┐  │
│  │  Notification Service             │  │
│  │  - sendPushNotification()         │  │
│  │  - Store in DB                    │  │
│  │  - Send via Web Push              │  │
│  └──────────┬────────────────────────┘  │
│             │                            │
└─────────────┼────────────────────────────┘
              │
              ▼
     ┌─────────────────┐
     │   PostgreSQL    │
     │   (Supabase)    │
     │  - notifications│
     │  - subscriptions│
     └─────────────────┘
              │
              │ 3. Retrieve subscriptions
              │
              ▼
     ┌─────────────────┐
     │  Web Push API   │
     │  (VAPID Auth)   │
     └────────┬────────┘
              │
              │ 4. Deliver notification
              ▼
     ┌─────────────────┐
     │ Service Worker  │
     │  Push Handler   │
     └────────┬────────┘
              │
              │ 5. Display notification
              ▼
     ┌─────────────────┐
     │ Notification UI │
     │  (System Tray)  │
     └─────────────────┘
```

### Data Flow

1. **Subscription Flow**:
   - User grants notification permission
   - Browser generates subscription object
   - Frontend sends subscription to backend
   - Backend stores in `push_subscriptions` table

2. **Notification Sending Flow**:
   - Event triggers notification (e.g., appointment created)
   - `sendPushNotification(userId, title, message)` called
   - Notification stored in `notifications` table
   - User subscriptions retrieved from database
   - Push sent to each subscription via Web Push API
   - Expired subscriptions automatically removed (410 status)

3. **Notification Display Flow**:
   - Service worker receives push event
   - Notification displayed with custom icon and vibration
   - Click handler redirects to `/notificacoes`
   - User can mark as read/unread in inbox

---

## Components

### 1. Notification Service (`services/notificationService.js`)

**Purpose**: Core business logic for sending push notifications.

**Key Functions**:

#### `sendPushNotification(userId, title, message)`
Sends push notification to all devices subscribed by a specific user.

```javascript
const { sendPushNotification } = require('../services/notificationService');

// Send notification to user ID 42
await sendPushNotification(
    42,
    'Lembrete de Consulta',
    'Sua consulta é amanhã às 14:30'
);
```

**Implementation Details** (lines 14-74):
```javascript
async function sendPushNotification(userId, title, message) {
    try {
        // 1. Store notification in database for inbox
        const notificationResult = await pool.query(
            `INSERT INTO notifications (user_id, title, message, sent_at, lido)
             VALUES ($1, $2, $3, NOW(), FALSE)
             RETURNING id`,
            [userId, title, message]
        );

        // 2. Retrieve all user subscriptions
        const subscriptionsResult = await pool.query(
            'SELECT * FROM push_subscriptions WHERE user_id = $1',
            [userId]
        );

        const subscriptions = subscriptionsResult.rows;

        // 3. Send to each subscription
        const pushPromises = subscriptions.map(async (sub) => {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            };

            const payload = JSON.stringify({
                title: title,
                body: message,
                icon: '/icons/android-launchericon-192-192.png',
                badge: '/icons/android-launchericon-96-96.png',
                data: { url: '/notificacoes' }
            });

            try {
                await webpush.sendNotification(pushSubscription, payload);
            } catch (error) {
                // Remove expired subscriptions (410 Gone)
                if (error.statusCode === 410) {
                    await pool.query(
                        'DELETE FROM push_subscriptions WHERE id = $1',
                        [sub.id]
                    );
                }
                throw error;
            }
        });

        await Promise.all(pushPromises);
        return true;
    } catch (error) {
        console.error('Error sending push notification:', error);
        return false;
    }
}
```

**Features**:
- Stores notification in database first (persistent inbox)
- Supports multiple devices per user
- Automatic cleanup of expired subscriptions
- Custom icons for branding
- Error handling and logging

---

### 2. Notification Controller (`controllers/notificationController.js`)

**Purpose**: HTTP request handlers for notification-related routes.

**Key Functions**:

#### `renderNotificationsPage(req, res)` (lines 7-36)
Renders the notification inbox page with all user notifications.

```javascript
exports.renderNotificationsPage = async (req, res) => {
    const userId = req.session.userId;

    try {
        // Fetch all notifications for user
        const result = await pool.query(
            `SELECT * FROM notifications
             WHERE user_id = $1
             ORDER BY sent_at DESC`,
            [userId]
        );

        // Count unread notifications
        const unreadResult = await pool.query(
            'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND lido = FALSE',
            [userId]
        );

        res.render('notificacoes', {
            notifications: result.rows,
            unreadCount: parseInt(unreadResult.rows[0].count),
            publicVapidKey: process.env.PUBLIC_VAPID_KEY
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).send('Erro ao carregar notificações');
    }
};
```

#### `subscribeToPush(req, res)` (lines 38-63)
Registers a new push subscription for the user.

```javascript
exports.subscribeToPush = async (req, res) => {
    const { subscription } = req.body;
    const userId = req.session.userId;

    try {
        // Check if subscription already exists
        const existingResult = await pool.query(
            'SELECT id FROM push_subscriptions WHERE endpoint = $1',
            [subscription.endpoint]
        );

        if (existingResult.rows.length === 0) {
            // Insert new subscription
            await pool.query(
                `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
                 VALUES ($1, $2, $3, $4)`,
                [userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth]
            );
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error subscribing to push:', error);
        res.status(500).json({ success: false });
    }
};
```

#### `markNotificationAsRead(req, res)` (lines 65-84)
Marks a single notification as read.

#### `markAllNotificationsAsRead(req, res)` (lines 86-102)
Marks all user notifications as read.

#### `markNotificationAsUnread(req, res)` (lines 104-125)
Marks a notification as unread (allows users to flag important messages).

#### `sendTestNotification(req, res)` (lines 127-156)
Sends a test notification. Works with or without authentication.

---

### 3. Service Worker (`public/service-worker.js`)

**Purpose**: Handles push events and displays notifications in the browser.

**Cache Configuration** (lines 1-30):
```javascript
const CACHE_NAME = 'pwa-consultas-v4';
const urlsToCache = [
    '/',
    '/css/style.css',
    '/js/app.js',
    '/manifest.json',
    '/icons/android-launchericon-192-192.png',
    '/icons/android-launchericon-512-512.png',
    // ... all other icons
];
```

**Push Event Handler** (lines 85-105):
```javascript
self.addEventListener('push', function(event) {
    const data = event.data.json();

    const options = {
        body: data.body,
        icon: '/icons/android-launchericon-192-192.png',
        badge: '/icons/android-launchericon-96-96.png',
        vibrate: [200, 100, 200],
        data: {
            url: data.data.url || '/notificacoes'
        },
        actions: [
            { action: 'open', title: 'Ver' },
            { action: 'close', title: 'Fechar' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});
```

**Notification Click Handler** (lines 107-126):
```javascript
self.addEventListener('notificationclick', function(event) {
    event.notification.close();

    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.openWindow(event.notification.data.url)
        );
    }
});
```

**Features**:
- Custom medical cross icons
- Vibration pattern for alerts
- Click handler redirects to inbox
- Action buttons (Ver, Fechar)
- Cache v4 with selective caching strategy

---

### 4. Route Definitions

#### Protected Routes (`routes/notificationRoutes.js`)
Requires authentication via `isAuthenticated` middleware.

```javascript
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

router.get('/', notificationController.renderNotificationsPage);
router.post('/subscribe', notificationController.subscribeToPush);
router.post('/marcar-lida', notificationController.markNotificationAsRead);
router.post('/marcar-todas-lidas', notificationController.markAllNotificationsAsRead);
router.post('/marcar-nao-lida', notificationController.markNotificationAsUnread);

module.exports = router;
```

**Mounted in server.js** (line 50):
```javascript
app.use('/notificacoes', isAuthenticated, notificationRoutes);
```

#### Public Routes (`routes/testRoutes.js`)
No authentication required. Used for testing.

```javascript
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const pool = require('../config/db');

// Send test notification to all subscribed users
router.get('/test-push', notificationController.sendTestNotification);

// Show subscription statistics
router.get('/test-info', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT COUNT(*) as total FROM push_subscriptions'
        );

        res.send(`
            <html>
                <head><title>Test Info</title></head>
                <body style="font-family: Arial; padding: 20px;">
                    <h1>Push Notification Test Info</h1>
                    <p><strong>Total Subscriptions:</strong> ${result.rows[0].total}</p>
                    <p><a href="/test-push">Send Test Notification</a></p>
                </body>
            </html>
        `);
    } catch (error) {
        console.error('Error fetching info:', error);
        res.status(500).send('Error fetching info');
    }
});

module.exports = router;
```

**Mounted in server.js** (line 45):
```javascript
app.use('/', testRoutes); // BEFORE protected routes
```

---

## Database Schema

### Table: `notifications`

Stores notification history for user inbox.

```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lido BOOLEAN DEFAULT FALSE,
    tipo VARCHAR(50),
    urgencia VARCHAR(20)
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_lido ON notifications(lido);
```

**Columns**:
- `id`: Primary key
- `user_id`: Foreign key to users table
- `title`: Notification title (max 255 chars)
- `message`: Notification body text
- `sent_at`: Timestamp when notification was sent
- `lido`: Boolean flag (TRUE = read, FALSE = unread)
- `tipo`: Optional notification type (e.g., "consulta", "lembrete")
- `urgencia`: Optional urgency level (e.g., "alta", "normal")

**Indexes**:
- `user_id`: Fast lookup of user notifications
- `lido`: Fast counting of unread notifications

---

### Table: `push_subscriptions`

Stores Web Push subscription objects for each device.

```sql
CREATE TABLE push_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_subscriptions_user_id ON push_subscriptions(user_id);
CREATE UNIQUE INDEX idx_subscriptions_endpoint ON push_subscriptions(endpoint);
```

**Columns**:
- `id`: Primary key
- `user_id`: Foreign key to users table
- `endpoint`: Push service endpoint URL (unique per device)
- `p256dh`: Public key for encryption (base64)
- `auth`: Authentication secret (base64)
- `created_at`: When subscription was created
- `updated_at`: Last update timestamp

**Indexes**:
- `user_id`: Fast lookup of all user devices
- `endpoint`: Prevent duplicate subscriptions (UNIQUE)

**Multi-Device Support**:
- One user can have multiple subscriptions (multiple devices)
- Each device gets its own `endpoint`
- Sending notification to user sends to ALL their devices

---

## API Reference

### POST `/notificacoes/subscribe`
**Authentication**: Required
**Purpose**: Register push notification subscription

**Request Body**:
```json
{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
      "p256dh": "BG3H...",
      "auth": "kL2x..."
    }
  }
}
```

**Response**:
```json
{
  "success": true
}
```

**Example**:
```javascript
// Frontend code
const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
});

await fetch('/notificacoes/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription })
});
```

---

### GET `/notificacoes`
**Authentication**: Required
**Purpose**: Render notification inbox page

**Response**: HTML page with notification list

**Features**:
- Shows all user notifications (newest first)
- Displays unread count in header
- Mark as read/unread buttons
- "Mark all as read" option

---

### POST `/notificacoes/marcar-lida`
**Authentication**: Required
**Purpose**: Mark single notification as read

**Request Body**:
```json
{
  "notificationId": 123
}
```

**Response**:
```json
{
  "success": true
}
```

---

### POST `/notificacoes/marcar-todas-lidas`
**Authentication**: Required
**Purpose**: Mark all user notifications as read

**Response**:
```json
{
  "success": true
}
```

---

### POST `/notificacoes/marcar-nao-lida`
**Authentication**: Required
**Purpose**: Mark notification as unread

**Request Body**:
```json
{
  "notificationId": 123
}
```

**Response**:
```json
{
  "success": true
}
```

---

### GET `/test-push` (Public Route)
**Authentication**: None
**Purpose**: Send test notification to all subscribed users

**Response**: HTML page with success message

**Usage**:
```
https://your-domain.com/test-push
```

---

### GET `/test-info` (Public Route)
**Authentication**: None
**Purpose**: Show subscription statistics

**Response**: HTML page with subscription count

---

## Integration Examples

### Send Notification on Appointment Creation

**Location**: `controllers/appointmentController.js` (lines 65-72)

```javascript
exports.addAppointment = async (req, res) => {
    const { doctorName, specialty, appointmentDate, appointmentTime, location } = req.body;
    const userId = req.session.userId;

    try {
        // 1. Insert appointment into database
        await pool.query(
            `INSERT INTO appointments (user_id, doctor_name, specialty, appointment_date, appointment_time, location, status)
             VALUES ($1, $2, $3, $4, $5, $6, 'confirmada')`,
            [userId, doctorName, specialty, appointmentDate, appointmentTime, location]
        );

        // 2. Format date for Portuguese locale
        const formattedDate = new Date(appointmentDate).toLocaleDateString('pt-BR');

        // 3. Create personalized notification message
        const customMessage = `Sua consulta com ${doctorName} (${specialty}) foi agendada para ${formattedDate} às ${appointmentTime}.`;

        // 4. Send push notification
        await sendPushNotification(
            userId,
            'Nova Consulta Agendada!',
            customMessage
        );

        res.redirect('/consultas');
    } catch (error) {
        console.error('Error adding appointment:', error);
        res.status(500).send('Erro ao adicionar consulta');
    }
};
```

**Result**: User receives instant notification when appointment is created.

---

### Custom Notification Trigger

Create custom notification from anywhere in the application:

```javascript
const { sendPushNotification } = require('../services/notificationService');

// Example: Send reminder 24 hours before appointment
async function sendAppointmentReminder(userId, appointmentDetails) {
    const message = `Lembrete: Sua consulta com ${appointmentDetails.doctor} é amanhã às ${appointmentDetails.time}. Local: ${appointmentDetails.location}`;

    await sendPushNotification(
        userId,
        'Lembrete de Consulta',
        message
    );
}
```

---

## PWA Installation System

### Custom Install Prompt (`public/js/install-prompt.js`)

**Purpose**: Show custom installation banner when PWA is installable.

**Features**:
- Intercepts `beforeinstallprompt` event
- Shows purple gradient banner at bottom of screen
- 7-day cooldown after user dismisses
- Success feedback after installation
- Responsive design

**Implementation**:
```javascript
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    // Check if user dismissed recently (7-day cooldown)
    const lastDismissed = localStorage.getItem('installPromptDismissed');
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    if (!lastDismissed || parseInt(lastDismissed) < sevenDaysAgo) {
        showInstallPrompt();
    }
});

function showInstallPrompt() {
    const banner = document.createElement('div');
    banner.className = 'install-banner';
    banner.innerHTML = `
        <div class="install-content">
            <img src="/icons/android-launchericon-96-96.png" alt="App Icon">
            <div>
                <strong>Instalar App</strong>
                <p>Adicione à tela inicial para acesso rápido</p>
            </div>
            <div class="install-actions">
                <button id="install-dismiss">Depois</button>
                <button id="install-accept">Instalar</button>
            </div>
        </div>
    `;

    document.body.appendChild(banner);

    document.getElementById('install-accept').addEventListener('click', async () => {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            showSuccessMessage();
        }

        banner.remove();
        deferredPrompt = null;
    });

    document.getElementById('install-dismiss').addEventListener('click', () => {
        localStorage.setItem('installPromptDismissed', Date.now().toString());
        banner.remove();
    });
}
```

**CSS Styling**:
```css
.install-banner {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px;
    box-shadow: 0 -4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    animation: slideUp 0.3s ease-out;
}
```

**Integration**: Added to `views/layouts/main.hbs` (line 27):
```html
<script src="/js/install-prompt.js"></script>
```

---

## Testing

### Local Testing

1. **Start development server**:
```bash
npm run dev
```

2. **Open browser** to `http://localhost:3000`

3. **Grant notification permission** when prompted

4. **Create test notification**:
   - Log in to application
   - Create a new appointment
   - Notification should appear immediately

### Public Testing (via ngrok)

1. **Start ngrok tunnel**:
```bash
ngrok http 3000
```

2. **Update environment**:
```env
# .env
PUBLIC_URL=https://your-subdomain.ngrok-free.dev
```

3. **Access test routes**:
   - Info: `https://your-subdomain.ngrok-free.dev/test-info`
   - Send test: `https://your-subdomain.ngrok-free.dev/test-push`

4. **Test on mobile device**:
   - Open ngrok URL on mobile browser
   - Grant notification permission
   - Visit `/test-push` to send notification
   - Check notification appears in system tray

### Testing Checklist

- [ ] Notification permission granted
- [ ] Service worker registered successfully
- [ ] Push subscription created in database
- [ ] Test notification received on PC
- [ ] Test notification received on mobile
- [ ] Notification icon displays medical cross (not star)
- [ ] Click on notification opens `/notificacoes`
- [ ] Notification appears in inbox
- [ ] Mark as read/unread works
- [ ] Mark all as read works
- [ ] Multiple devices receive notifications
- [ ] PWA installable (shows install prompt)
- [ ] Offline functionality works

---

## Deployment

### Environment Variables

Required in `.env` file:

```env
# Server
PORT=3000
SESSION_SECRET=your-strong-random-string-here

# Database (Supabase)
DB_HOST=db.your-project.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-database-password

# Web Push (VAPID)
PUBLIC_VAPID_KEY=BErUUdx3ycEXpQh-BQVFUIUcknlK8TtWJtJF1VAqFvzV7H00tDloMnASIiucCayJlLFCRraYe3TYNAibBWZlTUI
PRIVATE_VAPID_KEY=your-private-vapid-key
VAPID_MAILTO=mailto:your-email@example.com
```

### Generating VAPID Keys

```bash
node generate-vapid-keys.js
```

**Output**:
```
Public Key: BErUUdx3y...
Private Key: (keep secret)
```

**Add to `.env`** and never commit private key to git.

### Database Migrations

Run SQL migrations to create required tables:

```sql
-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    lido BOOLEAN DEFAULT FALSE,
    tipo VARCHAR(50),
    urgencia VARCHAR(20)
);

-- Create push_subscriptions table
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_lido ON notifications(lido);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON push_subscriptions(user_id);
```

### Production Checklist

- [ ] HTTPS enabled (required for service workers)
- [ ] Environment variables set on production server
- [ ] Database migrations run
- [ ] VAPID keys generated and stored securely
- [ ] Session secret is strong random string
- [ ] Cookie `secure: true` in production
- [ ] Service worker cache version updated
- [ ] All icons present in `/public/icons/`
- [ ] Manifest.json served with correct MIME type
- [ ] CORS configured if using separate API domain

---

## Troubleshooting

### Issue: Notifications not appearing

**Possible Causes**:
1. Notification permission denied
2. Service worker not registered
3. Subscription not stored in database
4. VAPID keys incorrect

**Solution**:
```javascript
// Check permission status
console.log('Permission:', Notification.permission);

// Check service worker
navigator.serviceWorker.getRegistration().then(reg => {
    console.log('SW registered:', !!reg);
});

// Check subscription
navigator.serviceWorker.ready.then(reg => {
    reg.pushManager.getSubscription().then(sub => {
        console.log('Subscription:', sub);
    });
});
```

---

### Issue: 410 Gone errors in logs

**Cause**: Subscription expired (user uninstalled PWA or cleared data)

**Solution**: Automatic cleanup already implemented:
```javascript
// services/notificationService.js (line 55-60)
if (error.statusCode === 410) {
    await pool.query(
        'DELETE FROM push_subscriptions WHERE id = $1',
        [sub.id]
    );
}
```

---

### Issue: Icons showing as generic/blank

**Cause**: Incorrect icon paths or missing files

**Solution**:
1. Verify files exist in `/public/icons/`
2. Check paths in service worker and notification service
3. Ensure icons are cached in service worker

```javascript
// Correct paths (service-worker.js)
icon: '/icons/android-launchericon-192-192.png'
badge: '/icons/android-launchericon-96-96.png'
```

---

### Issue: Service worker not updating

**Cause**: Old cache version persists

**Solution**:
1. Increment cache version in `service-worker.js`:
```javascript
const CACHE_NAME = 'pwa-consultas-v5'; // Increment version
```

2. Hard refresh browser (Ctrl+Shift+R)

3. Unregister old service worker in DevTools:
   - Application tab → Service Workers → Unregister

---

### Issue: Test routes return 404

**Cause**: Route ordering in `server.js`

**Solution**: Ensure testRoutes mounted BEFORE protected routes:
```javascript
// server.js
app.use('/', testRoutes); // Must be BEFORE
app.use('/notificacoes', isAuthenticated, notificationRoutes);
```

---

### Issue: Notifications sent to wrong user

**Cause**: User ID not properly retrieved

**Solution**: Always use `req.session.userId`:
```javascript
const userId = req.session.userId;
await sendPushNotification(userId, title, message);
```

---

## Performance Considerations

### Notification Batching

For bulk notifications, consider batching:

```javascript
async function sendBulkNotifications(notifications) {
    const batchSize = 100;

    for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = notifications.slice(i, i + batchSize);
        await Promise.all(batch.map(n =>
            sendPushNotification(n.userId, n.title, n.message)
        ));

        // Small delay between batches to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}
```

### Database Optimization

Index frequently queried columns:
```sql
CREATE INDEX idx_notifications_sent_at ON notifications(sent_at DESC);
CREATE INDEX idx_notifications_user_lido ON notifications(user_id, lido);
```

### Cache Strategy

Service worker uses selective caching:
- **Navigation**: Network-first (always fresh)
- **Static assets**: Cache-first (fast load)
- **API calls**: Network-only (fresh data)
- **Redirects**: Never cached (prevents loops)

---

## Security Considerations

### VAPID Key Management
- **Never commit** private VAPID key to git
- Store in environment variables only
- Backup keys securely (losing them invalidates all subscriptions)
- Rotate keys periodically (requires resubscribing all users)

### Subscription Validation
- Always check `user_id` matches session before subscribing
- Validate subscription object format before storing
- Use UNIQUE constraint on `endpoint` to prevent duplicates

### Content Security
- Sanitize notification messages (prevent XSS)
- Validate user input before sending notifications
- Limit notification frequency to prevent spam

---

## Future Enhancements

### Planned Features
- [ ] Notification categories (consulta, lembrete, urgente)
- [ ] Scheduled notifications (send at specific time)
- [ ] Notification preferences (opt-in/opt-out by type)
- [ ] Rich notifications with images and actions
- [ ] Notification sound customization
- [ ] Daily digest (batch notifications)
- [ ] Notification analytics (delivery rate, click-through)

### Scalability
- Implement job queue (Bull/RabbitMQ) for async sending
- Add Redis caching for subscription lookups
- Implement horizontal scaling with shared session store
- Add monitoring and alerting (Sentry, DataDog)

---

## Additional Resources

### Official Documentation
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [VAPID Specification](https://tools.ietf.org/html/rfc8292)
- [web-push Node.js Library](https://github.com/web-push-libs/web-push)

### Tools
- [VAPID Key Generator](https://vapidkeys.com/)
- [Web Push Testing Tool](https://web-push-codelab.glitch.me/)
- [Lighthouse PWA Audit](https://developers.google.com/web/tools/lighthouse)

---

**Last Updated**: 2025-10-21
**Version**: 1.0
**Status**: Production Ready
