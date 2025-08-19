const express = require("express");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");
const validUrl = require("valid-url");

const app = express();
app.use(bodyParser.json());

// In-memory store for short URLs
const shortUrls = new Map();

// POST: Create a new shortened URL
app.post("/shorturls", (req, res) => {
    const { url, validity, shortcode } = req.body;

    // Validate URL
    if (!url || !validUrl.isUri(url)) {
        return res.status(400).json({ error: "Invalid or missing URL" });
    }

    // Validate and generate shortcode
    let code = shortcode || uuidv4().slice(0, 6);
    if (shortcode && !/^[a-zA-Z0-9_-]{4,20}$/.test(shortcode)) {
        return res.status(400).json({ error: "Invalid shortcode format" });
    }
    if (shortUrls.has(code)) {
        return res.status(409).json({ error: "Shortcode already in use" });
    }

    // Calculate expiry (default: 30 minutes)
    const durationMs = (validity || 30) * 60 * 1000;
    const expiryDate = new Date(Date.now() + durationMs);
    const createdAt = new Date();

    // Store the shortened URL data
    shortUrls.set(code, {
        url,
        createdAt,
        expiryDate,
        clickCount: 0,
        clicks: []
    });

    return res.status(201).json({
        shortlink: `http://localhost:3000/${code}`,
        expiry: expiryDate.toISOString()
    });
});

// GET: Redirect to original URL
app.get("/:code", (req, res) => {
    const code = req.params.code;
    const record = shortUrls.get(code);

    if (!record) {
        return res.status(404).json({ error: "Short URL not found" });
    }

    if (!record.expiryDate || Date.now() > record.expiryDate.getTime()) {
        return res.status(410).json({ error: "Short URL expired" });
    }

    // Log click
    record.clickCount++;
    record.clicks.push({
        timestamp: new Date().toISOString(),
        source: req.ip,
        referrer: req.get("Referer") || "Direct",
        userAgent: req.get("User-Agent")
    });

    return res.redirect(record.url);
});

// GET: Retrieve statistics for a shortened URL
app.get("/shorturls/:shortcode", (req, res) => {
    const code = req.params.shortcode;
    const record = shortUrls.get(code);

    if (!record) {
        return res.status(404).json({ error: "Short URL not found" });
    }

    return res.json({
        shortcode: code,
        originalUrl: record.url,
        createdAt: record.createdAt.toISOString(),
        expiry: record.expiryDate.toISOString(),
        clickCount: record.clickCount,
        clicks: record.clicks
    });
});

// GET: List all active short URLs
app.get("/shorturls", (req, res) => {
    const result = [];
    for (const [code, data] of shortUrls.entries()) {
        result.push({
            shortcode: code,
            originalUrl: data.url,
            expiry: data.expiryDate.toISOString(),
            clickCount: data.clickCount
        });
    }
    res.json(result);
});

// DELETE: Delete a short URL
app.delete("/shorturls/:shortcode", (req, res) => {
    const code = req.params.shortcode;

    if (!shortUrls.has(code)) {
        return res.status(404).json({ error: "Short URL not found" });
    }

    shortUrls.delete(code);
    return res.status(204).send();
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`URL Shortener running at http://localhost:${PORT}`);
});
