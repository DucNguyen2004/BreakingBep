const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

const app = express();
const port = 3000; // You can change the port number as per your preference

// Body-parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const PAGE_VERIFY_TOKEN =
    'EAACcgEcX4ZCcBABOXOlfKQPR91fFvP0oKKXPwuleuARlYvKG44efyI5pzuFifD9calAwZCsgaxDE325NciFyKBjNZC3S8zUAEYlD296KNXCWgDjYx9Ty38aXkFPWNLwJxrmxlC12lB3HEVNB5m3bHtx56PNaBVI6NE3B6156aFBYSbeog8s';
const VERIFY_TOKEN = 'BREAKINGBEP:12345';

// Endpoint to receive webhook events from Messenger API
app.post('/webhook', (req, res) => {
    const body = req.body;

    if (body.object === 'page') {
        body.entry.forEach((entry) => {
            const webhookEvent = entry.messaging[0];
            console.log(webhookEvent);
            // Process the webhook event here
            // Iterate over each entry - there may be multiple if batched
            body.entry.forEach(function (entry) {
                // Get the webhook event. entry.messaging is an array, but
                // will only ever contain one event, so we get index 0
                let webhook_event = entry.messaging[0];
                console.log(webhook_event);
                // Get the sender PSID
                let sender_psid = webhook_event.sender.id;
                console.log('Sender PSID: ' + sender_psid);
                // Check if the event is a message or postback and
                // pass the event to the appropriate handler function
                if (webhook_event.message) {
                    handleMessage(sender_psid, webhook_event.message);
                } else if (webhook_event.postback) {
                    handlePostback(sender_psid, webhook_event.postback);
                }
            });
            // Send a 200 response to acknowledge receipt of the event
            res.status(200).send('EVENT_RECEIVED');
        });
    } else {
        res.sendStatus(404);
    }
});

// Endpoint for webhook verification
app.get('/webhook', (req, res) => {
    const VERIFY_TOKEN =
        'EAACcgEcX4ZCcBABOXOlfKQPR91fFvP0oKKXPwuleuARlYvKG44efyI5pzuFifD9calAwZCsgaxDE325NciFyKBjNZC3S8zUAEYlD296KNXCWgDjYx9Ty38aXkFPWNLwJxrmxlC12lB3HEVNB5m3bHtx56PNaBVI6NE3B6156aFBYSbeog8s'; // Replace with your own verify token
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token === VERIFY_TOKEN) {
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});
// Handles messages events
function handleMessage(sender_psid, received_message) {
    let response;

    // Check if the message contains text
    if (received_message.text) {
        // Create the payload for a basic text message
        response = {
            text: `You sent the message: "${received_message.text}". Now send me an image!`,
        };
    } else if (received_message.attachments) {
        // Get the URL of the message attachment
        let attachment_url = received_message.attachments[0].payload.url;
        response = {
            attachment: {
                type: 'template',
                payload: {
                    template_type: 'generic',
                    elements: [
                        {
                            title: 'Is this the right picture?',
                            subtitle: 'Tap a button to answer.',
                            image_url: attachment_url,
                            buttons: [
                                {
                                    type: 'postback',
                                    title: 'Yes!',
                                    payload: 'yes',
                                },
                                {
                                    type: 'postback',
                                    title: 'No!',
                                    payload: 'no',
                                },
                            ],
                        },
                    ],
                },
            },
        };
    }

    // Sends the response message
    callSendAPI(sender_psid, response);
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
    let response;

    // Get the payload for the postback
    let payload = received_postback.payload;

    // Set the response based on the postback payload
    if (payload === 'yes') {
        response = { text: 'Thanks!' };
    } else if (payload === 'no') {
        response = { text: 'Oops, try sending another image.' };
    }
    // Send the message to acknowledge the postback
    callSendAPI(sender_psid, response);
}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
    // Construct the message body
    let request_body = {
        recipient: {
            id: sender_psid,
        },
        message: response,
    };
    // Send the HTTP request to the Messenger Platform
    request(
        {
            uri: 'https://graph.facebook.com/v2.6/me/messages',
            qs: { access_token: PAGE_ACCESS_TOKEN },
            method: 'POST',
            json: request_body,
        },
        (err, res, body) => {
            if (!err) {
                console.log('message sent!');
            } else {
                console.error('Unable to send message:' + err);
            }
        }
    );
}
// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
