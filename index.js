require('dotenv').config();

const axios = require('axios');
const http = require('http');
const hostname = '127.0.0.1';
const port = 3000;
const accounts = [
    { 
        email: 'peter@thx.network', 
        walletCode: '',
        level: 0,
    }
]

async function createWalletCode(){
    try {
        const { data } = await axios.post(process.env.WEBHOOK_WALLET_ONBOARDING);
        return data.code;
    } catch (error) {
        console.error(error)
    }
}

async function createMilestoneRewardClaim(code){
    try {
        const { data } = await axios.post(process.env.WEBHOOK_MILESTONE_REWARD_1, { code });
        console.log(data);
        return data;
    } catch (error) {
        console.error(error)
    }
}

const server = http.createServer(async (req, res) => {
    message = '';

    switch(req.url) {
        case '/signin': {
            if (!accounts[0].walletCode) {
                // A wallet code is created for the account if none is available
                accounts[0].walletCode = await createWalletCode();        
            }
            message = `Wallet Code: ${accounts[0].walletCode}`;
            break
        }
        case '/account': {
            message = JSON.stringify(accounts[0]);
            break
        }
        case '/levelup': {
            // Account earns a level
            accounts[0].level++
            
            // Account earns a milestone reward claim
            await createMilestoneRewardClaim(accounts[0].walletCode);

            message = `You reached level ${accounts[0].level}`;
            break        
        }  
        case '/wallet': {
            message = `https://dashboard.thx.network/preview/6423f0ad7160195ff3011165?thx_widget_path=/w/${accounts[0].walletCode}`;
            break
        } 
    }       

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end(message);
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});