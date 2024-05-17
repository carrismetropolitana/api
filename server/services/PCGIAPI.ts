/* * */

import { jwtDecode } from 'jwt-decode';

/* * */

interface PCGIAPIRequestOptions {
  method: string;
  contentType: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any;
}

/* * */

class PCGIAPI {
	//

	access_token: string;

	expires_at: number;

	authenticating: boolean;

	/* * *
   * REQUEST
   * This function makes GET requests to PCGI API and agregates all the steps required for authentication.
   */

	async request(service: string, options: PCGIAPIRequestOptions) {
		//

		//
		// Check if the token is still valid

		const isTokenExpired = this.expires_at < (Date.now() / 1000);

		//
		// Request a new authentication token if is is expired

		if (isTokenExpired) {
			await this.authenticate();
		}

		//
		// Perform the request to PCGI API

		const response = await fetch(`${process.env.PCGI_BASE_URL}/${service}`, {
			method: options?.method || 'GET',
			headers: {
				'Content-Type': options?.contentType || 'application/json',
				Authorization: `Bearer ${this.access_token}`,
			},
			body: options?.body || undefined,
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
			console.log('* * * * * * * * * * * * * * * * * *');
			console.log('> Starting PCGIAPI authentication...');

			//
			// Setup the flag to prevent double authentication

			this.authenticating = true;

			//
			// Initiate a new request to the token endpoint

			const response = await fetch(process.env.PCGI_AUTH_URL, {
				method: 'POST',
				headers: { 'content-type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({
					client_id: process.env.PCGI_CLIENT_ID,
					client_secret: process.env.PCGI_CLIENT_SECRET,
					grant_type: 'client_credentials',
				}),
			});

			//
			// Parse response

			const responseData = await response.json();

			//
			// Decode the JWT token

			const decodedToken = jwtDecode(responseData.access_token);

			//
			// Save token values

			this.access_token = responseData.access_token;

			this.expires_at = decodedToken.exp;

			//

			console.log('PCGIAPI Authentication successful');

			//
		} catch (err) {
			console.log('! PCGIAPI Authentication failed', err);
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
		return new Promise<void>((resolve) => {
			const interval = setInterval(() => {
				console.log('****** Waiting for PCGIAPI authentication...');
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

export default new PCGIAPI;