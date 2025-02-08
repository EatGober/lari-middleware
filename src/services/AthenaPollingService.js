const axios = require('axios');
const { getAthenaToken } = require('../AuthUtils');

class AthenaPollingService {
  constructor(config) {
    if (!config.clientId || !config.clientSecret || !config.backendUrl) {
      throw new Error('Missing required configuration: clientId, clientSecret, and backendUrl are required');
    }

    this.practiceId = '195900';
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.backendUrl = config.backendUrl;
    this.pollInterval = config.pollInterval || 60000;
    this.lastEventId = null;
    this.isPolling = false;
    this.intervalId = null;
    this.token = null;
    this.tokenExpiry = null;

    // Enhanced logging
    this.logPrefix = '[AthenaPolling]';
    this.pollCount = 0;
    this.lastPollTime = null;
    this.totalEventsProcessed = 0;

    this.logServiceStart();
  }

  logServiceStart() {
    console.log(`${this.logPrefix} Service Configuration:`);
    console.log('==========================================');
    console.log(`Practice ID: ${this.practiceId}`);
    console.log(`Client ID: ${this.clientId}`);
    console.log(`Client Secret: ${'*'.repeat(8)}`);
    console.log(`Backend URL: ${this.backendUrl}`);
    console.log(`Poll Interval: ${this.pollInterval}ms`);
    console.log('==========================================');
  }

  async getValidToken() {
    try {
      if (this.token && this.tokenExpiry && (this.tokenExpiry.getTime() - Date.now() > 300000)) {
        console.log(`${this.logPrefix} Using cached token (expires in ${Math.floor((this.tokenExpiry.getTime() - Date.now()) / 1000)}s)`);
        return this.token;
      }

      console.log(`${this.logPrefix} Refreshing token...`);
      this.token = await getAthenaToken({
        clientId: this.clientId,
        clientSecret: this.clientSecret
      });
      this.tokenExpiry = new Date(Date.now() + 3600000);
      console.log(`${this.logPrefix} Token refreshed successfully. Expires at ${this.tokenExpiry.toISOString()}`);
      return this.token;
    } catch (error) {
      console.error(`${this.logPrefix} Token refresh failed:`, error.message);
      throw error;
    }
  }

  async getSubscriptions() {
    const token = await this.getValidToken();
    try {
      const response = await axios({
        method: 'GET',
        url: `https://api.preview.platform.athenahealth.com/v1/${this.practiceId}/appointments/changed/subscription`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      console.log(`${this.logPrefix} Retrieved subscriptions:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`${this.logPrefix} Failed to get subscriptions:`, error.message);
      throw error;
    }
  }

  async subscribeToChanges(eventName = null) {
    const token = await this.getValidToken();
    try {
      const data = eventName ? { eventname: eventName } : {};
      const response = await axios({
        method: 'POST',
        url: `https://api.preview.platform.athenahealth.com/v1/${this.practiceId}/appointments/changed/subscription`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: data
      });
      console.log(`${this.logPrefix} Created new subscription:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`${this.logPrefix} Failed to create subscription:`, error.message);
      throw error;
    }
  }

  async pollForChanges() {
    this.pollCount++;
    this.lastPollTime = new Date();

    console.log(`\n${this.logPrefix} Poll #${this.pollCount} started at ${this.lastPollTime.toISOString()}`);
    console.log(`${this.logPrefix} Last Event ID: ${this.lastEventId || 'None'}`);

    try {
      const token = await this.getValidToken();
      const params = this.lastEventId ? { lastEventId: this.lastEventId } : {};

      const response = await axios({
        method: 'GET',
        url: `https://api.preview.platform.athenahealth.com/v1/${this.practiceId}/appointments/changed`,
        params: params,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      console.log(`${this.logPrefix} Full response data:`, JSON.stringify(response.data, null, 2));

      const changes = response.data.appointments || [];
      const totalCount = response.data.totalcount || 0;

      console.log(`${this.logPrefix} Individual appointments:`);
      changes.forEach((appointment, index) => {
        console.log(`\nAppointment ${index + 1}:`, JSON.stringify(appointment, null, 2));
      });

      if (changes && changes.length > 0) {
        await this.handleEvents(changes);

        if (changes[changes.length - 1].eventid) {
          this.lastEventId = changes[changes.length - 1].eventid;
          console.log(`${this.logPrefix} Updated last event ID to: ${this.lastEventId}`);
        }

        this.totalEventsProcessed += changes.length;
      }

      console.log(`${this.logPrefix} Poll completed. Total events processed: ${this.totalEventsProcessed}`);
    } catch (error) {
      console.error(`${this.logPrefix} Poll #${this.pollCount} failed:`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
    }
  }

  async handleEvents(events) {
    if (!events || !Array.isArray(events)) {
      console.log(`${this.logPrefix} No events to process`);
      return;
    }

    console.log(`${this.logPrefix} Processing ${events.length} events`);

    for (const event of events) {
      console.log(`${this.logPrefix} Event received:`, {
        eventType: event.eventtype,
        appointmentId: event.appointmentid,
        timestamp: event.timestamp,
        eventId: event.eventid
      });

      // Specifically look for cancellation events
      if (event.eventtype === 'CancelAppointment') {
        console.log(`${this.logPrefix} Cancellation event detected:`, event);
        this.totalEventsProcessed++;
      }
    }

    // After processing events, send them to backend
    await this.sendChangesToBackend(events);
  }
  async sendChangesToBackend(changes) {
    console.log(`${this.logPrefix} Sending ${changes.length} changes to backend at ${this.backendUrl}`);
    try {
      const response = await axios({
        method: 'PUT',
        url: this.backendUrl,
        headers: {
          'Content-Type': 'application/json'
        },
        data: changes
      });

      console.log(`${this.logPrefix} Backend update successful. Status: ${response.status}`);
    } catch (error) {
      console.error(`${this.logPrefix} Backend update failed:`, {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      });
      throw error;
    }
  }

  async start() {
    if (this.isPolling) {
      console.log(`${this.logPrefix} Polling service is already running`);
      return;
    }

    try {
      // Get initial token
      const token = await this.getValidToken();
      console.log(`${this.logPrefix} Got valid token:`, `Bearer ${token.substring(0, 20)}...`);

      // Check existing subscriptions
      console.log(`${this.logPrefix} Checking subscriptions...`);
      const currentSubs = await this.getSubscriptions();
      console.log(`${this.logPrefix} Current subscriptions:`, currentSubs);

      // Subscribe if no active subscription exists
      if (!currentSubs || !currentSubs.subscriptions || currentSubs.subscriptions.length === 0) {
        console.log(`${this.logPrefix} No active subscriptions found, creating new subscription...`);
        await this.subscribeToChanges();
      }

      // Start polling
      this.isPolling = true;
      this.intervalId = setInterval(() => this.pollForChanges(), this.pollInterval);
      console.log(`${this.logPrefix} Started polling service with interval ${this.pollInterval}ms`);
    } catch (error) {
      console.error(`${this.logPrefix} Failed to start polling service:`, error);
      throw error;
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isPolling = false;
      console.log(`${this.logPrefix} Stopped polling service`);
    }
  }

  getServiceStats() {
    return {
      pollCount: this.pollCount,
      lastPollTime: this.lastPollTime,
      totalEventsProcessed: this.totalEventsProcessed,
      isPolling: this.isPolling,
      lastEventId: this.lastEventId
    };
  }
}

module.exports = AthenaPollingService;
