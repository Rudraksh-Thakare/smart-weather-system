/* sw.js - Service Worker for Background Push Notifications */

self.addEventListener('push', function (event) {
    if (event.data) {
        try {
            const data = event.data.json();

            const options = {
                body: data.body || "New Smart Weather alert in your area.",
                icon: 'https://openweathermap.org/img/wn/11d@4x.png', // Default storm icon
                badge: 'https://openweathermap.org/img/wn/11d.png',
                vibrate: [200, 100, 200, 100, 200],
                data: {
                    dateOfArrival: Date.now(),
                    primaryKey: '2'
                },
                actions: [
                    { action: 'explore', title: 'View Dashboard' },
                    { action: 'close', title: 'Close Alert' }
                ]
            };

            // Map custom icons based on severity/type received
            if (data.type === 'rain') options.icon = 'https://openweathermap.org/img/wn/09d@4x.png';
            if (data.type === 'heat') options.icon = 'https://openweathermap.org/img/wn/01d@4x.png';
            if (data.type === 'cold') options.icon = 'https://openweathermap.org/img/wn/13d@4x.png';

            event.waitUntil(
                self.registration.showNotification(data.title || "Smart Weather Alert", options)
            );
        } catch (e) {
            // Fallback if data isn't JSON
            event.waitUntil(
                self.registration.showNotification("Smart Weather Update", {
                    body: event.data.text()
                })
            );
        }
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    if (event.action !== 'close') {
        event.waitUntil(
            clients.openWindow('http://localhost/smart weather/alerts.html')
        );
    }
});
