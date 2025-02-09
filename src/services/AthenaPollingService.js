const axios = require('axios');
const { getAthenaToken } = require('../AuthUtils');

/**
 * Service to poll Athena API for appointment changes and sync them with the backend
 */
class AthenaPollingService {
  // Constants
  static ATHENA_API_BASE = 'https://api.preview.platform.athenahealth.com/v1';
  static DEFAULT_POLL_INTERVAL = 60000; // 1 minute
  static TOKEN_REFRESH_THRESHOLD = 300000; // 5 minutes
  static TOKEN_VALIDITY_PERIOD = 3600000; // 1 hour

  /**
   * Initialize the polling service
   * @param {Object} config Configuration object
   * @param {string} config.clientId Athena API client ID
   * @param {string} config.clientSecret Athena API client secret
   * @param {string} config.backendUrl Backend URL to sync changes to
   * @param {number} [config.pollInterval] Optional polling interval in ms
   */
  constructor(config) {
    // Validate required configuration
    if (!config.clientId || !config.clientSecret || !config.backendUrl) {
      throw new Error('Missing required configuration: clientId, clientSecret, and backendUrl are required');
    }

    // Core configuration
    this.practiceId = '195900';
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.backendUrl = config.backendUrl;
    this.pollInterval = config.pollInterval || AthenaPollingService.DEFAULT_POLL_INTERVAL;

    // State management
    this.lastEventId = null;
    this.isPolling = false;
    this.intervalId = null;
    this.token = null;
    this.tokenExpiry = null;

    // Metrics
    this.logPrefix = '[AthenaPolling]';
    this.pollCount = 0;
    this.lastPollTime = null;
    this.totalEventsProcessed = 0;

    this.logServiceConfiguration();
  }

  /**
   * Log the service configuration on startup
   */
  logServiceConfiguration() {
    console.log(`${this.logPrefix} Service Configuration:`);
    console.log('==========================================');
    console.log(`Practice ID: ${this.practiceId}`);
    console.log(`Client ID: ${this.clientId}`);
    console.log(`Client Secret: ${'*'.repeat(8)}`);
    console.log(`Backend URL: ${this.backendUrl}`);
    console.log(`Poll Interval: ${this.pollInterval}ms`);
    console.log('==========================================');
  }

  /**
   * Get a valid authentication token, refreshing if necessary
   * @returns {Promise<string>} Valid authentication token
   */
  async getValidToken() {
    try {
      // Check if current token is still valid
      if (this.token && this.tokenExpiry &&
        (this.tokenExpiry.getTime() - Date.now() > AthenaPollingService.TOKEN_REFRESH_THRESHOLD)) {
        console.log(`${this.logPrefix} Using cached token (expires in ${Math.floor((this.tokenExpiry.getTime() - Date.now()) / 1000)}s)`);
        return this.token;
      }

      // Refresh token
      console.log(`${this.logPrefix} Refreshing token...`);
      this.token = await getAthenaToken({
        clientId: this.clientId,
        clientSecret: this.clientSecret
      });
      this.tokenExpiry = new Date(Date.now() + AthenaPollingService.TOKEN_VALIDITY_PERIOD);
      console.log(`${this.logPrefix} Token refreshed successfully. Expires at ${this.tokenExpiry.toISOString()}`);
      return this.token;
    } catch (error) {
      console.error(`${this.logPrefix} Token refresh failed:`, error.message);
      throw error;
    }
  }

  /**
   * Get current subscription status
   * @returns {Promise<Object>} Current subscriptions
   */
  async getSubscriptions() {
    const token = await this.getValidToken();
    try {
      const response = await axios({
        method: 'GET',
        url: `${AthenaPollingService.ATHENA_API_BASE}/${this.practiceId}/appointments/changed/subscription`,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      console.log(`${this.logPrefix} Retrieved subscriptions:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`${this.logPrefix} Failed to get subscriptions:`, error.message);
      throw error;
    }
  }

  /**
   * Subscribe to appointment changes
   * @param {string} [eventName] Optional specific event to subscribe to
   * @returns {Promise<Object>} Subscription response
   */
  async subscribeToChanges(eventName = null) {
    const token = await this.getValidToken();
    try {
      const data = eventName ? {eventname: eventName} : {};
      const response = await axios({
        method: 'POST',
        url: `${AthenaPollingService.ATHENA_API_BASE}/${this.practiceId}/appointments/changed/subscription`,
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

  /**
   * Process a batch of appointment change events
   * @param {Array<Object>} events Array of appointment change events
   */
  /**
   * Convert date and time to ISO string
   * @param {string} date Date in format "MM/DD/YYYY"
   * @param {string} time Time in format "HH:MM"
   * @returns {string} ISO date string
   */
  convertToISOString(date, time) {
    const [month, day, year] = date.split('/');
    const [hours, minutes] = time.split(':');
    return new Date(year, month - 1, day, hours, minutes).toISOString();
  }

  /**
   * Process and transform appointment events
   * @param {Array<Object>} events Array of appointment events
   */
  async handleEvents(events) {
    if (!events?.length) {
      console.log(`${this.logPrefix} No events to process`);
      return;
    }

    console.log(`\n${this.logPrefix} ========== EVENT PROCESSING START ==========`);
    console.log(`${this.logPrefix} Processing ${events.length} events`);

    try {
      // Transform events to include ISO date string
      const transformedEvents = events.map(event => ({
        ...event,
        startTimeISO: this.convertToISOString(event.date, event.starttime)
      }));

      console.log(`${this.logPrefix} Transformed ${transformedEvents.length} events:`);
      transformedEvents.forEach((event, index) => {
        console.log(`${this.logPrefix} Event ${index + 1}:`, {
          appointmentId: event.appointmentid,
          status: event.appointmentstatus,
          type: event.appointmenttype,
          patientId: event.patientid || 'Not specified',
          startTimeISO: event.startTimeISO
        });
      });

      // Send to backend
      await this.sendChangesToBackend(transformedEvents);

      this.totalEventsProcessed += events.length;
      console.log(`${this.logPrefix} Total events processed: ${this.totalEventsProcessed}`);
      console.log(`${this.logPrefix} ========== EVENT PROCESSING END ==========\n`);

    } catch (error) {
      console.error(`${this.logPrefix} Error processing events:`, error);
      console.error(`${this.logPrefix} Stack trace:`, error.stack);
      console.log(`${this.logPrefix} ========== EVENT PROCESSING END (WITH ERROR) ==========\n`);
      throw error;
    }
  }

  /**
   * Send transformed appointments to backend
   * @param {Array<Object>} transformedAppointments Array of transformed appointment objects
   */
  async sendChangesToBackend(events) {
    console.log(`\n${this.logPrefix} ========== BACKEND UPDATE START ==========`);
    console.log(`${this.logPrefix} Sending ${events.length} events to backend`);
    console.log(`${this.logPrefix} Backend URL: ${this.backendUrl}`);

    // Log payload summary
    console.log(`${this.logPrefix} Payload summary:`);
    events.forEach((event, index) => {
      console.log(`${this.logPrefix} Event ${index + 1}:`, {
        appointmentId: event.appointmentid,
        status: event.appointmentstatus,
        startTimeISO: event.startTimeISO,
        patientId: event.patientid || 'Not specified',
      });
    });

    try {
      console.log(`${this.logPrefix} Sending PUT request...`);
      const response = await axios({
        method: 'PUT',
        url: this.backendUrl,
        headers: {
          'Content-Type': 'application/json',
          'Status': 'cancelled'

        },
        data: events[0]
      });

      console.log(`${this.logPrefix} Backend update successful`);
      console.log(`${this.logPrefix} Status: ${response.status} (${response.statusText})`);
      if (response.data) {
        console.log(`${this.logPrefix} Response:`, JSON.stringify(response.data, null, 2));
      }
      console.log(`${this.logPrefix} ========== BACKEND UPDATE END ==========\n`);
    } catch (error) {
      console.error(`${this.logPrefix} ========== BACKEND UPDATE ERROR ==========`);
      console.error(`${this.logPrefix} Backend update failed:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message
      });
      if (error.response?.data) {
        console.error(`${this.logPrefix} Error details:`, JSON.stringify(error.response.data, null, 2));
      }
      console.error(`${this.logPrefix} Stack trace:`, error.stack);
      console.error(`${this.logPrefix} ========== BACKEND UPDATE ERROR END ==========\n`);
      throw error;
    }
  }

  async pollForChanges() {
    this.pollCount++;
    this.lastPollTime = new Date();

    console.log(`\n${this.logPrefix} ========== POLL #${this.pollCount} START ==========`);
    console.log(`${this.logPrefix} Poll started at ${this.lastPollTime.toISOString()}`);
    console.log(`${this.logPrefix} Last Event ID: ${this.lastEventId || 'None'}`);

    try {
      const token = await this.getValidToken();
      const params = this.lastEventId ? {lastEventId: this.lastEventId} : {};

      // Get changed appointments
      const response = await axios({
        method: 'GET',
        url: `${AthenaPollingService.ATHENA_API_BASE}/${this.practiceId}/appointments/changed`,
        params: params,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      const appointments = response.data.appointments || [];
      console.log(`${this.logPrefix} Found ${appointments.length} changed appointments`);

      if (appointments.length > 0) {
        // Filter valid appointments
        const validAppointments = appointments.filter(appt =>
          appt.appointmentid &&
          ['x', 'o', 'f'].includes(appt.appointmentstatus)
        );

        console.log(`${this.logPrefix} Found ${validAppointments.length} valid appointments`);
        console.log(`${this.logPrefix} Appointment statuses:`, validAppointments.map(a => ({
          id: a.appointmentid,
          status: a.appointmentstatus,
          type: a.appointmenttype
        })));

        // Process appointments
        await this.handleEvents(validAppointments);

        // Update last event ID
        if (appointments[appointments.length - 1].eventid) {
          this.lastEventId = appointments[appointments.length - 1].eventid;
          console.log(`${this.logPrefix} Updated last event ID to: ${this.lastEventId}`);
        }
      }

      console.log(`${this.logPrefix} Poll #${this.pollCount} completed successfully`);
      console.log(`${this.logPrefix} ========== POLL #${this.pollCount} END ==========\n`);
    } catch (error) {
      console.error(`${this.logPrefix} Poll #${this.pollCount} failed:`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      console.error(`${this.logPrefix} Stack trace:`, error.stack);
      console.log(`${this.logPrefix} ========== POLL #${this.pollCount} END (WITH ERROR) ==========\n`);
    }
  }


  /**
   * Start the polling service
   */
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
      if (!currentSubs?.subscriptions?.length) {
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

  /**
   * Stop the polling service
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isPolling = false;
      console.log(`${this.logPrefix} Stopped polling service`);
    }
  }

}

module.exports = AthenaPollingService;
