export const registerForPushNotificationsAsync = async () => {
    console.log('Push notifications not fully supported on web.');
    // potentially ask for Notification.requestPermission() here if desired
};

export const sendLocalNotification = async (title, body) => {
    if (window.Notification && Notification.permission === "granted") {
        new Notification(title, { body });
    } else if (window.Notification && Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification(title, { body });
            }
        });
    } else {
        console.log('Notification:', title, body);
        // alert(`${title}: ${body}`); // Optional: don't alert to avoid spam
    }
};
