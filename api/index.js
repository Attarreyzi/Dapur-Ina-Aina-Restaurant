/**
 * Vercel Serverless Function Entrypoint
 */
let app;
try {
    app = require('../server');
} catch (err) {
    console.error('Fatal Serverless Startup Error:', err);
    const express = require('express');
    app = express();
    app.all('*', (req, res) => {
        res.status(500).send(`
            <div style="font-family: sans-serif; padding: 30px; line-height: 1.6;">
                <h2 style="color: #ef4444;">Serverless Startup Error</h2>
                <p>${err.message}</p>
                <pre style="background: #f1f5f9; padding: 15px; border-radius: 8px; overflow-x: auto;">${err.stack}</pre>
            </div>
        `);
    });
}

module.exports = app;
