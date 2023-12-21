require('dotenv').config();
const WEBHOOK_SIGNING_SECRET = process.env.WEBHOOK_SIGNING_SECRET;
const WIDGET_SCRIPT = '<script src="https://localhost:3000/v1/widget/64da241ac46a718f2ef099b9.js"></script>'

const crypto = require('crypto');
const express = require('express');
const bodyParser = require('body-parser');
const hostname = '127.0.0.1';
const port = 3333;
const accounts = [{ email: 'peter@thx.network', identity: '', balance: 0 }]
 
// Init THXAPIClient
const thx = new THXAPIClient({
    clientId: process.env.THX_CLIENT_ID,
    clientSecret: process.env.THX_CLIENT_SECRET
})

// Helper to verify payload signature
function constructEvent(payload, signature, secret) {
	const hmac = crypto.createHmac('sha256', secret);
	hmac.update(payload);
    const calculatedSignature = hmac.digest('base64');
	if (signature !== calculatedSignature) throw new Error('Failed signature verification')
    return JSON.parse(payload);
}

// Helper to create HTML response
function html(content) {
    return `
      <!DOCTYPE html>
      <html>
        <head><title>Example: Outbound Webhooks</title></head>
        <body>
          ${content}
          ${WIDGET_SCRIPT}
        </body>
      </html>
    `;
} 

const app = express();
app.use(bodyParser.json());

// Mock a sign in and store the virtual wallet code
app.get('/signin', async(req, res) => {
    if (!accounts[0].identity) {
        accounts[0].identity = await thx.identity.create(); 
    }
    res.status(200).send(html(`Wallet Code: ${accounts[0].identity}`));
});

// Mock account details view
app.get('/account', async(req, res) => {
    res.status(200).send(html(JSON.stringify(accounts[0])));
});

// Mock virtual wallet connect button
app.get('/connect', (req, res) => {
    const walletConnectLink = `<a target="_blank" href="http://127.0.0.1:3333/connect?thx_widget_path=/w/${accounts[0].identity}">Connect Identity</a>`
    res.status(200).send(html(walletConnectLink));
});

// The registered endpoint which is invoked after a custom reward purchase
app.post('/testhook', (req, res) => {
    let event;
    try {
        // Veries and parses the payload using the WEBHOOK_SIGNING_SECRET which you can get in Developer -> Webhooks
        event = constructEvent(req.body.payload, req.body.signature, WEBHOOK_SIGNING_SECRET);
    } catch (error) {
        console.error(error);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event type
    switch(event.type) {
        case 'reward_custom.paid': {

            // Simulates account query
            console.log('Match account');
            const accountId = accounts.findIndex((a)=> event.identities.includes(a.identity));
            if (!accounts[accountId]) break;
            console.log(accounts[accountId]);
    
            // Simulates Solar Crystal transfer
            console.log('Transfer Solar Crystals');
            accounts[accountId].balance += 5000;
            console.log(accounts[accountId]);
            break
        }
        default :{
            console.log(`Unhandled event type ${event.type}`)
        }
    }
    
    res.send();
});

app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
