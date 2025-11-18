document.addEventListener('DOMContentLoaded', async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
        console.log('Service Worker and Push API are supported');

        try {
            const registration = await navigator.serviceWorker.ready;
            console.log('Service Worker is ready:', registration);

            // Check for existing subscription
            const existingSubscription = await registration.pushManager.getSubscription();
            if (existingSubscription) {
                console.log('Existing push subscription found:', existingSubscription);
                // You might want to send this existing subscription to your backend
                // to ensure it's still valid and associated with the user.
                // sendSubscriptionToBackend(existingSubscription);
            } else {
                console.log('No existing push subscription found.');
                // Prompt user to enable notifications (e.g., via a button click)
                // For now, we'll just try to subscribe if permission is granted.
            }

            // Request notification permission if not already granted
            if (Notification.permission === 'default') {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    console.log('Notification permission granted.');
                    await subscribeUserToPush(registration);
                } else {
                    console.warn('Notification permission denied.');
                }
            } else if (Notification.permission === 'granted') {
                console.log('Notification permission already granted.');
                await subscribeUserToPush(registration);
            } else {
                console.warn('Notification permission blocked or denied.');
            }

        } catch (error) {
            console.error('Error during service worker registration or push setup:', error);
        }
    } else {
        console.warn('Push notifications are not supported in this browser.');
    }
});

async function subscribeUserToPush(registration) {
    const applicationServerKey = 'BErUUdx3ycEXpQh-BQVFUIUcknlK8TtWJtJF1VAqFvzV7H00tDloMnASIiucCayJlLFCRraYe3TYNAibBWZlTUI'; // YOUR_PUBLIC_VAPID_KEY

    try {
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(applicationServerKey)
        });

        console.log('User is subscribed:', subscription);
        await sendSubscriptionToBackend(subscription);

    } catch (error) {
        console.error('Failed to subscribe the user:', error);
    }
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

async function sendSubscriptionToBackend(subscription) {
    try {
        const response = await fetch('/notificacoes/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(subscription)
        });

        if (response.ok) {
            console.log('Subscription sent to backend successfully.');
        } else {
            console.error('Failed to send subscription to backend:', response.statusText);
        }
    } catch (error) {
        console.error('Error sending subscription to backend:', error);
    }
}
