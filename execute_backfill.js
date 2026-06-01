const https = require('https');

const url = 'https://finance.rauell.systems/api/webhooks/mpesa-sms?secret=cLS4oOhHsVYmA8wiv1tG3PWZReyu06zK&backfill=1';

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('--- Webhook Backfill Result ---');
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Raw data:', data);
    }
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
