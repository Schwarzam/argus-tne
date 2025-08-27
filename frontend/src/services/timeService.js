import axios from 'axios';

class TimeService {
    constructor() {
        this.serverTimeOffset = 0;
        this.lastSyncTime = 0;
        this.syncInterval = 5 * 60 * 1000; // 5 minutes
    }

    async syncWithServer() {
        try {
            const startTime = Date.now();
            const response = await axios.get('/api/appinfo/');
            const endTime = Date.now();
            
            // Get current time from server response or assume server time is close to now
            const serverTime = response.data.current_time ? 
                new Date(response.data.current_time).getTime() : 
                endTime; // Fallback to current time if not provided
            
            // Calculate round-trip time and adjust
            const networkDelay = (endTime - startTime) / 2;
            this.serverTimeOffset = serverTime + networkDelay - endTime;
            this.lastSyncTime = endTime;
            
            console.log('Time synced with server. Offset:', this.serverTimeOffset, 'ms');
        } catch (error) {
            console.error('Failed to sync time with server:', error);
            // Fallback: assume server time equals local time
            this.serverTimeOffset = 0;
        }
    }

    async getServerTime() {
        // Sync if needed
        const now = Date.now();
        if (now - this.lastSyncTime > this.syncInterval) {
            await this.syncWithServer();
        }

        return new Date(now + this.serverTimeOffset);
    }

    formatForDateTimeLocal(date) {
        // Format date for datetime-local input (YYYY-MM-DDTHH:MM)
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    formatForBackend(date) {
        // Format date for backend API (YYYY-MM-DDTHH:MM)
        return this.formatForDateTimeLocal(date);
    }

    async getServerTimeFormatted() {
        const serverTime = await this.getServerTime();
        return this.formatForDateTimeLocal(serverTime);
    }

    async getFutureTime(minutesFromNow = 10) {
        const serverTime = await this.getServerTime();
        serverTime.setMinutes(serverTime.getMinutes() + minutesFromNow);
        return serverTime;
    }

    async getFutureTimeFormatted(minutesFromNow = 10) {
        const futureTime = await this.getFutureTime(minutesFromNow);
        return this.formatForDateTimeLocal(futureTime);
    }
}

// Export singleton instance
const timeService = new TimeService();
export default timeService;