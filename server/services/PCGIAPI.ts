/* * */

import { jwtDecode } from 'jwt-decode';

/* * */

interface PCGIAPIRequestOptions {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	body: any
	contentType: string
	method: string
}

/* * */

class PCGIAPI {
	//

	access_token: string;

	authenticating: boolean;

	expires_at: number;

	/* * *
   * REQUEST
   * This function makes GET requests to PCGI API and agregates all the steps required for authentication.
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
				body: new URLSearchParams({
					client_id: process.env.PCGI_CLIENT_ID,
					client_secret: process.env.PCGI_CLIENT_SECRET,
					grant_type: 'client_credentials',
				}),
				headers: { 'content-type': 'application/x-www-form-urlencoded' },
				method: 'POST',
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
		}
		catch (err) {
			console.log('! PCGIAPI Authentication failed', err);
		}
		finally {
			this.authenticating = false;
		}

		//
	}

	/* * *
   * AUTHENTICATE
   * This function requests new authentication tokens to IDP.
   */

	async request(service: string, options?: PCGIAPIRequestOptions) {
		//

		//
		// Check if the token is still valid

		const isTokenExpired = this.expires_at < (Date.now() / 1000);

		//
		// Request a new authentication token if it is expired or non-existent

		if (isTokenExpired || !this.access_token) {
			await this.authenticate();
		}

		//
		// Perform the request to PCGI API

		const response = await fetch(`${process.env.PCGI_BASE_URL}/${service}`, {
			body: options?.body || undefined,
			headers: {
				'Authorization': `Bearer ${this.access_token}`,
				'Content-Type': options?.contentType || 'application/json',
			},
			method: options?.method || 'GET',
		});

		//
		// Return the response to the caller

		try {
			return await response.json();
		}
		catch (error) {
			console.log('ERROR: Failed to parse PCGIAPI Response:', error);
			console.log('Retrying authentication...');
			this.reset();
			throw new Error('PCGIAPI temporarily unavailable. Please try your query again.');
		}

		//
	}

	/* * *
   * WAIT FOR AUTHENTICATION
   * Implements a mechanism that waits until authentication is complete
   */

	async reset() {
		this.authenticating = false;
		this.access_token = '';
		this.expires_at = 0;
	}

	/* * *
   * RESET AUTHENTICATION
   * Clears all tokens to force a new authentication
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

export default new PCGIAPI();
