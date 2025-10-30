/**
 * FlowGenix App Blocker Service - Bridge between React UI and Python Backend
 * Provides seamless integration between the web interface and comprehensive app blocking
 */

class AppBlockerService {
    constructor() {
        this.baseUrl = 'http://localhost:8888';
        this.isConnected = false;
        this.statusCheckInterval = null;
        this.onStatusUpdate = null;
    }

    /**
     * Check if the app blocker service is running
     */
    async checkConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (response.ok) {
                this.isConnected = true;
                return true;
            }
        } catch (error) {
            console.log('App Blocker Service not available:', error.message);
            this.isConnected = false;
        }
        return false;
    }

    /**
     * Start comprehensive focus mode with app blocking
     */
    async startFocusMode(duration) {
        try {
            const response = await fetch(`${this.baseUrl}/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    duration: duration
                })
            });

            const result = await response.json();
            
            if (result.success) {
                // Start polling for status updates
                this.startStatusPolling();
                console.log('🛡️ Comprehensive app blocking activated!');
            }
            
            return result;
        } catch (error) {
            console.error('Failed to start app blocker:', error);
            return {
                success: false,
                message: `Service unavailable. Please ensure the app blocker is running. Error: ${error.message}`
            };
        }
    }

    /**
     * Stop focus mode and app blocking
     */
    async stopFocusMode() {
        try {
            const response = await fetch(`${this.baseUrl}/stop`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();
            
            if (result.success) {
                this.stopStatusPolling();
                console.log('🏁 App blocking stopped!');
            }
            
            return result;
        } catch (error) {
            console.error('Failed to stop app blocker:', error);
            return {
                success: false,
                message: `Error stopping service: ${error.message}`
            };
        }
    }

    /**
     * Get current blocking status
     */
    async getStatus() {
        try {
            const response = await fetch(`${this.baseUrl}/status`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const status = await response.json();
                
                // Notify listeners of status update
                if (this.onStatusUpdate) {
                    this.onStatusUpdate(status);
                }
                
                return status;
            }
        } catch (error) {
            console.error('Failed to get blocker status:', error);
        }
        
        return { active: false, error: 'Service unavailable' };
    }

    /**
     * Start polling for status updates
     */
    startStatusPolling() {
        if (this.statusCheckInterval) {
            clearInterval(this.statusCheckInterval);
        }

        this.statusCheckInterval = setInterval(async () => {
            const status = await this.getStatus();
            
            // If focus session has ended naturally, stop polling
            if (!status.active && status.final_blocked_count !== undefined) {
                this.stopStatusPolling();
            }
        }, 2000); // Check every 2 seconds
    }

    /**
     * Stop status polling
     */
    stopStatusPolling() {
        if (this.statusCheckInterval) {
            clearInterval(this.statusCheckInterval);
            this.statusCheckInterval = null;
        }
    }

    /**
     * Set callback for status updates
     */
    setStatusUpdateCallback(callback) {
        this.onStatusUpdate = callback;
    }

    /**
     * Check if comprehensive blocking is available
     */
    async isBlockingAvailable() {
        return await this.checkConnection();
    }

    /**
     * Get blocking statistics
     */
    async getBlockingStats() {
        const status = await this.getStatus();
        return {
            isActive: status.active || false,
            blockedCount: status.blocked_count || 0,
            totalBlockedApps: status.total_blocked_apps || 0,
            remainingTime: status.remaining_seconds || 0
        };
    }
}

// Create singleton instance
const appBlockerService = new AppBlockerService();

export default appBlockerService;
