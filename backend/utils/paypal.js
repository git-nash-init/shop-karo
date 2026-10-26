import dotenv from 'dotenv';
dotenv.config();

const { PAYPAL_CLIENT_ID, PAYPAL_APP_SECRET, PAYPAL_API_URL } = process.env;

/**
 * Fetches an access token from the PayPal API.
 */
async function getPayPalAccessToken() {
  const auth = Buffer.from(PAYPAL_CLIENT_ID + ':' + PAYPAL_APP_SECRET).toString(
    'base64'
  );

  const url = `${PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com'}/v1/oauth2/token`;

  const headers = {
    Accept: 'application/json',
    'Accept-Language': 'en_US',
    Authorization: `Basic ${auth}`,
  };

  const body = 'grant_type=client_credentials';
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body,
  });

  if (!response.ok) throw new Error('Failed to get PayPal access token');

  const paypalData = await response.json();
  return paypalData.access_token;
}

/**
 * Verifies a PayPal payment with PayPal API.
 */
export async function verifyPayPalPayment(paypalTransactionId) {
  // If sandbox / demo ID
  if (PAYPAL_CLIENT_ID === 'sb' || !PAYPAL_APP_SECRET) {
    return { verified: true, value: 0 };
  }

  const accessToken = await getPayPalAccessToken();
  const url = `${PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com'}/v2/checkout/orders/${paypalTransactionId}`;

  const paypalResponse = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!paypalResponse.ok) throw new Error('Failed to verify payment with PayPal');

  const paypalData = await paypalResponse.json();
  return {
    verified: paypalData.status === 'COMPLETED',
    value: paypalData.purchase_units[0].amount.value,
  };
}
