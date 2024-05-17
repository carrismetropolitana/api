/* * */

require('dotenv').config();
const { PCGI_AUTH_URL, PCGI_CLIENT_ID, PCGI_CLIENT_SECRET, PCGI_BASE_URL } = process.env;

/* * */

class PCGIAPI {
  //

  constructor() {
    this.access_token = '';
    this.expires_at = new Date();
    this.authenticating = false;
  }

  /* * *
   * REQUEST
   * This function makes GET requests to PCGI API and agregates all the steps required for authentication.
   */

  async request(service, options = {}) {
    //

    //
    // Check if the token is still valid

    const isTokenExpired = this.expires_at < new Date();

    //
    // Request a new authentication token if is is expired

    if (isTokenExpired) {
      await this.authenticate();
    }

    console.log("******************************");
    console.log("******************************");
    console.log("******************************");
    console.log('this.access_token', this.access_token);
    console.log("******************************");
    console.log("******************************");
    console.log("******************************");

    //
    // Perform the request to PCGI API

    const response = await fetch(`${PCGI_BASE_URL}/${service}`, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': options.contentType || 'application/json',
        Authorization: `Bearer ${this.access_token}`,
      },
      body: options.body || undefined,
    });

    //
    // Return the response to the caller

    return await response.json();

    //
  }

  /* * *
   * AUTHENTICATE
   * This function requests new authentication tokens to IDP.
   */

  async authenticate() {
    //

    //
    // If another authentication request is already in progress, wait for it to complete

    if (this.authenticating) return await this.waitForAuthentication();

    //
    // Perform the authentication request

    try {
      //
      console.log('Starting PCGIAPI authentication...');

      //
      // Setup the flag to prevent double authentication

      this.authenticating = true;

      //
      // Initiate a new request to the token endpoint

      const response = await fetch(PCGI_AUTH_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: PCGI_CLIENT_ID,
          client_secret: PCGI_CLIENT_SECRET,
          grant_type: 'client_credentials',
        }),
      });

      //
      // Parse response

      const responseData = await response.json();

      //
      // Save authorization values

      this.access_token = responseData.access_token;

      //
      // Save expire times

      const now = new Date();
      this.expires_at = new Date(now.getTime() + responseData.expires_in * 1000);

      console.log('PCGIAPI Authentication successful');

      //
    } catch (err) {
      console.log('PCGIAPI Authentication failed', err);
    } finally {
      this.authenticating = false;
    }

    //
  }

  /* * *
   * WAIT FOR AUTHENTICATION
   * Implements a mechanism that waits until authentication is complete
   */

  async waitForAuthentication() {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (!this.authenticating) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
  }

  //
}

/* * */

module.exports = new PCGIAPI();
