/**
 * Webinar API service
 */
import api from './api';

export const webinarService = {
  /**
   * Create a new webinar with CSV uploads
   */
  async createWebinar(formData) {
    const response = await api.post('/v1/webinars/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Get webinar details
   */
  async getWebinar(webinarId) {
    const response = await api.get(`/v1/webinars/${webinarId}`);
    return response.data;
  },

  /**
   * Get attendees for a webinar
   */
  async getAttendees(webinarId, tier = null) {
    const params = tier ? { tier } : {};
    const response = await api.get(`/v1/webinars/${webinarId}/attendees`, { params });
    return response.data;
  },

  /**
   * Generate emails for webinar attendees
   */
  async generateEmails(webinarId) {
    const response = await api.post(`/v1/webinars/${webinarId}/generate-emails`);
    return response.data;
  },

  /**
   * Get generated emails
   */
  async getEmails(webinarId, tier = null) {
    const params = tier ? { tier } : {};
    const response = await api.get(`/v1/webinars/${webinarId}/emails`, { params });
    return response.data;
  },

  /**
   * Export emails to CSV
   */
  async exportEmails(webinarId) {
    const response = await api.get(`/v1/webinars/${webinarId}/export`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

