require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const PORT = 3000; // Change if needed
const HUBSPOT_API_KEY = process.env.HUBSPOT_API_KEY; // Store your API key in .env

app.post('/webhook', async (req, res) => {
    try {
        const { name, email, metadata } = req.body;

        // Check if required fields are present
        if (!name || !email) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        console.log('Received form data:', req.body);

        // Ensure metadata.submittedAt is a valid ISO string
        let submittedAtISO;
        if (metadata.submittedAt && !isNaN(new Date(metadata.submittedAt).getTime())) {
            // If it's a valid date string, use it as it is
            submittedAtISO = new Date(metadata.submittedAt).toISOString();
        } else {
            // If it's not a valid date, you might need to handle that case or throw an error
            return res.status(400).json({ error: 'Invalid submittedAt date' });
        }

        // Extract userAgent from metadata (ensure it's available)
        const userAgent = metadata.userAgent || '';  // Default to empty string if not available

        // Send data to HubSpot
        const hubspotResponse = await axios.post(
            'https://api.hubapi.com/crm/v3/objects/contacts',
            {
                properties: {
                    firstname: name,
                    email: email,
                    submitted_at: submittedAtISO,  // Send ISO string
                    user_agent: userAgent         // Send userAgent to HubSpot
                }
            },
            {
                headers: {
                    Authorization: `Bearer ${HUBSPOT_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('HubSpot response:', hubspotResponse.data);
        
        // Respond with success
        res.json({ message: 'Data sent to HubSpot', hubspotResponse: hubspotResponse.data });
    } catch (error) {
        // Improved error logging
        console.error('Error sending to HubSpot:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to send data to HubSpot' });
    }
});

app.listen(PORT, () => {
    console.log(`Webhook listening on port ${PORT}`);
});
