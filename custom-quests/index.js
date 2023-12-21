require('dotenv').config();
// Require/import @thxnetwork/sdk
const { THXAPIClient } = require('@thxnetwork/sdk');
const express = require('express');

const WIDGET_SCRIPT = '<script src="https://api.thx.network/v1/widget/6286444ba9838bc5ed9fe117.js"></script>'
const hostname = '127.0.0.1';
const port = 3000;
const accounts = [{ email: 'peter@thx.network',  identity: '', level: 0 }]

// Helper to create HTML response
function html(content) {
    return `
      <!DOCTYPE html>
      <html>
        <head><title>Example: Identity & Events</title></head>
        <body>
            ${WIDGET_SCRIPT}
            ${content}
        </body>
      </html>
    `;
} 

// Init THXAPIClient
const thx = new THXAPIClient({
    clientId: process.env.THX_CLIENT_ID,
    clientSecret: process.env.THX_CLIENT_SECRET
})
const app = express();

// Mock a sign in and store the virtual wallet code
app.get('/signin', async(req, res) => {
    if (!accounts[0].identity) {
        // An identity is created for the account if no identity is set
        accounts[0].identity = await thx.identity.create();
    }
    res.send(html(`Identity: ${accounts[0].identity}`));
});

app.get('/account', async(req, res) => {
    res.send(html(JSON.stringify(accounts[0])));
});

app.get('/level_up', async(req, res) => {
    // Account earns a level
    accounts[0].level++
        
    // Publish level_up event for this identity
    thx.events.create({ event: 'level_up', identity: accounts[0].identity });

    res.send(html(`You reached level ${accounts[0].level}🥳`));
});

// Mock virtual wallet connect button
app.get('/public', (req, res) => {
    const body = `
        <button onclick="window.THXWidget.setIdentity(\"${accounts[0].identity}\")">Connect (Seamless)</button><br />
        <button onclick="window.THXWidget.connect(\"${accounts[0].identity}\")">Connect (Manual)</button>
    `
    res.send(html(body));
});

app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});