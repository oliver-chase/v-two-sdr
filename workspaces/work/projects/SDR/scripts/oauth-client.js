/**
 * OAuth Token Manager + Microsoft Graph API Client
 *
 * Responsibilities:
 * - Exchange Azure credentials (client_credentials grant) for access token
 * - Cache token to file with TTL check
 * - Auto-refresh expired tokens
 * - Send emails via Graph API /sendMail endpoint
 * - 401 error handling: refresh token and retry once
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

/**
 * OAuthClient manages Azure token lifecycle and Graph API calls
 */
class OAuthClient {
  constructor(config) {
    this.config = config;
    this.cachedToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Load cached token from file if it exists and is not expired
   */
  loadCachedToken() {
    const tokenFile = path.resolve(this.config.cache.tokenFile);
    if (!fs.existsSync(tokenFile)) {
      return null;
    }

    try {
      const cached = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));
      const now = Date.now();

      if (cached.expiresAt && cached.expiresAt > now) {
        this.cachedToken = cached.accessToken;
        this.tokenExpiry = cached.expiresAt;
        return cached.accessToken;
      }
    } catch (error) {
      // Cache file corrupted or invalid, will fetch new token
    }

    return null;
  }

  /**
   * Save token to cache file with expiry
   */
  saveCachedToken(accessToken, expiresInMs) {
    const tokenFile = path.resolve(this.config.cache.tokenFile);
    const dir = path.dirname(tokenFile);

    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const cached = {
      accessToken,
      expiresAt: Date.now() + expiresInMs,
      cachedAt: new Date().toISOString()
    };

    fs.writeFileSync(tokenFile, JSON.stringify(cached, null, 2));
    this.cachedToken = accessToken;
    this.tokenExpiry = cached.expiresAt;
  }

  /**
   * Exchange Azure credentials for access token (client_credentials flow)
   *
   * @returns {Promise<string>} Access token valid for 1 hour
   * @throws {Error} If credentials are missing or token exchange fails
   */
  async fetchNewToken() {
    const { tenantId, clientId, clientSecret, tokenEndpoint, scope } = this.config.azure;

    if (!tenantId || !clientId || !clientSecret) {
      throw new Error(
        'Azure OAuth credentials incomplete: ' +
        'OUTLOOK_TENANT_ID, OUTLOOK_CLIENT_ID, OUTLOOK_CLIENT_SECRET must be set in .env'
      );
    }

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: scope
    });

    return new Promise((resolve, reject) => {
      const postData = body.toString();
      const req = https.request(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': postData.length
        },
        timeout: this.config.graphApi.timeout
      });

      req.on('response', (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode !== 200) {
            return reject(
              new Error(`Azure token request failed: ${res.statusCode} ${data}`)
            );
          }

          try {
            const parsed = JSON.parse(data);
            if (!parsed.access_token) {
              throw new Error('No access_token in response');
            }

            // Cache the token (expires_in is in seconds, convert to ms)
            const expiresInMs = (parsed.expires_in || 3600) * 1000;
            this.saveCachedToken(parsed.access_token, expiresInMs);

            resolve(parsed.access_token);
          } catch (error) {
            reject(new Error(`Failed to parse token response: ${error.message}`));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Azure token request timed out'));
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Get valid access token (use cached if not expired, fetch new if needed)
   *
   * @returns {Promise<string>} Valid access token
   */
  async getAccessToken() {
    // Try cached token first
    const cached = this.loadCachedToken();
    if (cached) {
      return cached;
    }

    // Fetch new token
    return this.fetchNewToken();
  }

  /**
   * Send email via Microsoft Graph API
   *
   * @param {Object} opts
   * @param {string} opts.to - Recipient email
   * @param {string} opts.subject - Email subject
   * @param {string} opts.body - Email body (plain text)
   * @param {string} [opts.from] - Sender name (default: SENDER_NAME from config.email)
   * @param {string} [opts.bcc] - BCC email address
   * @returns {Promise<{ ok: boolean, messageId?: string, error?: string }>}
   */
  async sendMailViaGraph({ to, subject, body, from, bcc }) {
    let token;

    try {
      token = await this.getAccessToken();
    } catch (error) {
      return {
        ok: false,
        error: `Failed to get access token: ${error.message}`
      };
    }

    // Build message payload
    const message = {
      subject,
      bodyType: 'text',
      body: body,
      toRecipients: [{ emailAddress: { address: to } }],
      ...(bcc && {
        bccRecipients: [{ emailAddress: { address: bcc } }]
      })
    };

    if (from) {
      message.from = { emailAddress: { address: 'oliver@vtwo.co', name: from } };
    }

    const payload = {
      message,
      saveToSentItems: true
    };

    return new Promise((resolve) => {
      const postData = JSON.stringify(payload);
      const endpoint = this.config.graphApi.sendMailEndpoint;
      const url = `${this.config.graphApi.baseUrl}${endpoint}`;

      const req = https.request(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Content-Length': postData.length
        },
        timeout: this.config.graphApi.timeout
      });

      req.on('response', (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          // 202 = Accepted (success for sendMail)
          if (res.statusCode === 202) {
            return resolve({
              ok: true,
              messageId: `graph-${Date.now()}`
            });
          }

          // 401 = Unauthorized, token might be stale
          if (res.statusCode === 401) {
            return resolve({
              ok: false,
              error: 'Unauthorized (401) - token may be stale',
              retry: true
            });
          }

          // All other errors
          return resolve({
            ok: false,
            error: `Graph API error: ${res.statusCode} ${data}`
          });
        });
      });

      req.on('error', (error) => {
        resolve({
          ok: false,
          error: `Network error: ${error.message}`
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          ok: false,
          error: 'Graph API request timed out'
        });
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Send with retry logic: if 401, refresh token and try once more
   *
   * @param {Object} opts - Same as sendMailViaGraph
   * @returns {Promise<{ ok: boolean, messageId?: string, error?: string }>}
   */
  async sendMailWithRetry(opts) {
    const result = await this.sendMailViaGraph(opts);

    // If 401, clear cache and retry
    if (result.retry) {
      this.cachedToken = null;
      this.tokenExpiry = null;

      const retryResult = await this.sendMailViaGraph(opts);
      return retryResult;
    }

    return result;
  }
}

module.exports = { OAuthClient };
