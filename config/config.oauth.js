/**
 * Azure OAuth Configuration for Microsoft Graph API
 *
 * Credentials:
 * - OUTLOOK_TENANT_ID: Azure Entra ID tenant ID
 * - OUTLOOK_CLIENT_ID: App registration client ID
 * - OUTLOOK_CLIENT_SECRET: App registration client secret
 *
 * Scopes: https://graph.microsoft.com/Mail.Send
 * Grant type: client_credentials (no user interaction, service-to-service)
 * Token lifetime: 1 hour (cached and refreshed on demand)
 */

require('dotenv').config();

module.exports = {
  azure: {
    tenantId: process.env.OUTLOOK_TENANT_ID,
    clientId: process.env.OUTLOOK_CLIENT_ID,
    clientSecret: process.env.OUTLOOK_CLIENT_SECRET,
    tokenEndpoint: `https://login.microsoftonline.com/${process.env.OUTLOOK_TENANT_ID}/oauth2/v2.0/token`,
    scope: 'https://graph.microsoft.com/.default'
  },

  graphApi: {
    baseUrl: 'https://graph.microsoft.com/v1.0',
    sendMailEndpoint: '/users/oliver@vtwo.co/sendMail',
    timeout: 15000
  },

  cache: {
    tokenFile: './outreach/oauth-token.json',
    ttlMs: 3600000 // 1 hour
  }
};
