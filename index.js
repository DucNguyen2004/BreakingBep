const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

const app = express();
const port = 3000; // You can change the port number as per your preference

// Body-parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Endpoint to receive webhook events from Messenger API
app.post('/webhook', (req, res) => {
    const body = req.body;

    if (body.object === 'page') {
        body.entry.forEach((entry) => {
            const webhookEvent = entry.messaging[0];
            console.log(webhookEvent);
            // Process the webhook event here

            // Send a 200 response to acknowledge receipt of the event
            res.status(200).send('EVENT_RECEIVED');
        });
    } else {
        res.sendStatus(404);
    }
});

// Endpoint for webhook verification
app.get('/webhook', (req, res) => {
    const VERIFY_TOKEN = 'EAACcgEcX4ZCcBABOXOlfKQPR91fFvP0oKKXPwuleuARlYvKG44efyI5pzuFifD9calAwZCsgaxDE325NciFyKBjNZC3S8zUAEYlD296KNXCWgDjYx9Ty38aXkFPWNLwJxrmxlC12lB3HEVNB5m3bHtx56PNaBVI6NE3B6156aFBYSbeog8s'; // Replace with your own verify token
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token === VERIFY_TOKEN) {
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
