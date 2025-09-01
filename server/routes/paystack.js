const express = require('express');
const router = express.Router();
const https = require('https');
const crypto = require('crypto');
const { auth } = require('../middleware/auth');
const Order = require('../models/Order'); // ✅ Add the Order model
const Booking = require('../models/Booking'); // Using the unified Booking model
const sendCustomEmail = require('../utils/sendCustomEmail');

const PAYSTACK_API_BASE = 'api.paystack.co';

// Initialize Paystack transaction
router.post('/initialize', auth, async (req, res) => {
    // 'type' is now passed from the frontend
    const { amount, email, orderId, type } = req.body;

    if (!amount || !email || !orderId || !type) {
        return res.status(400).json({ message: 'Missing required fields: amount, email, orderId, type' });
    }

    const amountInKobo = Math.round(amount * 100);

    const params = JSON.stringify({
        email,
        amount: amountInKobo,
        metadata: {
            order_id: orderId,
            type: type // 'product' or 'course'
        },
        callback_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/order-success`
    });

    const options = {
        hostname: PAYSTACK_API_BASE,
        port: 443,
        path: '/transaction/initialize',
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json'
        }
    };

    const clientReq = https.request(options, apiRes => {
        let data = '';
        apiRes.on('data', chunk => data += chunk);
        apiRes.on('end', () => {
            const paystackResponse = JSON.parse(data);
            if (paystackResponse.status) {
                res.status(200).json({
                    message: 'Transaction initialized',
                    authorization_url: paystackResponse.data.authorization_url,
                    access_code: paystackResponse.data.access_code,
                    reference: paystackResponse.data.reference
                });
            } else {
                console.error('Paystack init error:', paystackResponse.message);
                res.status(400).json({ message: paystackResponse.message || 'Paystack initialization failed' });
            }
        });
    }).on('error', error => {
        console.error('Error initializing Paystack:', error);
        res.status(500).json({ message: 'Error communicating with Paystack' });
    });

    clientReq.write(params);
    clientReq.end();
});

// Verify Paystack payment
router.get('/verify/:reference', auth, async (req, res) => {
    const reference = req.params.reference;

    const options = {
        hostname: PAYSTACK_API_BASE,
        port: 443,
        path: `/transaction/verify/${reference}`,
        method: 'GET',
        headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
    };

    const clientReq = https.request(options, apiRes => {
        let data = '';
        apiRes.on('data', chunk => data += chunk);
        apiRes.on('end', async () => {
            const paystackResponse = JSON.parse(data);
            if (paystackResponse.status && paystackResponse.data.status === 'success') {
                // ✅ 1. Get metadata from the Paystack response
                const { order_id, type } = paystackResponse.data.metadata;

                try {
                    let record;
                    // ✅ 2. Find the document in the correct collection based on 'type'
                    if (type === 'product') {
                        record = await Order.findById(order_id);
                        if (record) {
                            record.status = 'Processing'; // Set status for a product order
                        }
                    } else { // type === 'course'
                        record = await Booking.findById(order_id);
                        if (record) {
                            record.status = 'Paid'; // Set status for a course booking
                        }
                    }

                    if (!record) {
                        return res.status(404).json({ message: 'Booking or Order not found' });
                    }

                    // ✅ 3. Update and save the record
                    record.paystackReference = reference;
                    record.paystackData = paystackResponse.data;
                    await record.save();

                    // ✅ 4. Send email only for courses
                    if (type === 'course') {
                        const courseNames = record.items.map(item => item.name).join(', ');
                        
                        const emailHtml = `
                          <p>Dear ${record.fullName},</p>
                          <p>We are glad to have you on board to study <strong>${courseNames}</strong>.</p>
                          <p>We will be communicating with you via email to let you know your <strong>start and end date</strong> for the course(s) you have picked. Also, a link to our online training platform will be shared at that time.</p>
                          <p>Please stay alert for further updates in your inbox.</p>
                          <p>Sincerely,<br>JBM TECH Team</p>
                        `;

                        await sendCustomEmail(
                            record.email,
                            'Welcome to JBM TECH – Your Course Booking Confirmation',
                            emailHtml
                        );
                    }
                    
                    // ✅ 5. Respond with a unified key, like 'record'
                    return res.status(200).json({ message: 'Payment verified successfully', record });

                } catch (error) {
                    console.error('Database update error after Paystack verification:', error);
                    res.status(500).json({ message: 'Payment verified, but failed to update record.' });
                }
            } else {
                res.status(400).json({ message: paystackResponse.data.gateway_response || 'Payment not successful.' });
            }
        });
    }).on('error', error => {
        console.error('Error verifying Paystack transaction:', error);
        res.status(500).json({ message: 'Error communicating with Paystack for verification.' });
    });

    clientReq.end();
});

module.exports = router;