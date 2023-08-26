// auth.js

/* * */
/* IMPORTS */
require('dotenv').config();
const { PCGI_AUTH_URL, PCGI_CLIENT_ID, PCGI_CLIENT_SECRET, PCGI_BASE_URL } = process.env;

class PCGIAPI {
  //

  constructor() {
    this.access_token = '';
    this.expires_at = new Date();
  }

  /* * *
   * REQUEST
   * This function makes GET requests to Carris API and agregates all the steps required for authentication.
   * The process starts by defining flags that serve as logical gates in the authentication flow.
   * On the first iteration of the while loop, perform the desired request and await for the response.
   * If the response code is 401 Unauthorized, then start the authentication flow. If there is some refresh token
   * in memory, then try with that. If not, then try with API key. In all these steps, set the corresponding flag
   * to ensure that on the next iteration of the while loop, the same method is not repeated and the flow gets stuck
   * in an infinite loop. This could be caused due to the way authentication in Carris API is implemented:
   * the system returns invalid tokens for an expired key.
   * This means that the only way to check if the tokens fetched from the current apiKey are valid is to perform the
   * request and look for the response status. Keeping this centralized in one single ‹request()› function
   * allows for a lot of code reuse. Also, if the response is not equal to 200 or 401, throw an error immediately.
   * If all is well, then return the raw data response to the parent caller.
   */

  async request(service, options = {}) {
    //

    // Renew token if no longer valid
    // const isTokenExpired = this.expires_at < new Date();
    // if (isTokenExpired) await this.authenticate();

    const response = await fetch(`${PCGI_BASE_URL}/${service}`, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.access_token}`,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    return await response.json();

    //
  }

  /* MARK: - SECTION 8: FETCH AUTH TOKEN FROM CARRIS API */
  /* This is the function where a valid ‹authToken› is requested to Carris Authentication endpoint. */
  /* Depending on the method of authentication ['apikey', 'refresh'], just perform the request and */
  /* save the result to the respective variables. */

  async authenticate() {
    try {
      //
      console.log('Starting PCGIAPI authentication...');

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

      // Parse response
      const responseData = await response.json();

      // Save authorization values
      this.access_token = responseData.access_token;

      // Save expire times
      const now = new Date();
      this.expires_at = new Date(now.getTime() + responseData.expires_in * 1000);

      console.log('PCGIAPI Authentication successful');
      //
    } catch (err) {
      console.log('PCGIAPI Authentication failed', err);
    }
  }

  //
}

module.exports = new PCGIAPI();
