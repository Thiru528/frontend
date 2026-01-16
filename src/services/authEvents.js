export const authEvents = {
    listeners: [],
    onLogout(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(cb => cb !== callback);
        };
    },
    emitLogout() {
        this.listeners.forEach(cb => cb());
    }
};
