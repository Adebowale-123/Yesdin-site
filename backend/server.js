require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const nodemailer = require('nodemailer');
const { insertContact, getAllContacts, getContactById, updateStatus } = require('./database');

const app  = express();
const PORT = process.env.PORT || 5000;

/* ── CORS ── allow the deployed frontend and localhost ── */
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost',
    'http://127.0.0.1',
    /^http:\/\/localhost:\d+$/,
    /^http:\/\/127\.0\.0\.1:\d+$/,
    /^file:\/\//,  // local file:// during development
].filter(Boolean);

app.use(cors({
    origin: (origin, cb) => {
        if (!origin) return cb(null, true); // allow non-browser requests (curl, Postman)
        const allowed = allowedOrigins.some(o =>
            o instanceof RegExp ? o.test(origin) : o === origin
        );
        cb(allowed ? null : new Error('CORS policy: origin not allowed'), allowed);
    },
    methods: ['GET', 'POST', 'PATCH'],
    allowedHeaders: ['Content-Type', 'x-api-key'],
}));

app.use(express.json());

/* ── Nodemailer transporter ── */
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendAdminNotification = (contact) => {
    const html = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#0B4619;padding:24px 30px;border-radius:8px 8px 0 0;">
            <h2 style="color:#fff;margin:0;">📬 New Contact Submission</h2>
          </div>
          <div style="background:#f4f7f5;padding:28px 30px;border-radius:0 0 8px 8px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:8px 0;color:#555;width:130px;font-weight:600;">Name</td><td style="padding:8px 0;">${contact.name}</td></tr>
              <tr><td style="padding:8px 0;color:#555;font-weight:600;">Email</td><td style="padding:8px 0;"><a href="mailto:${contact.email}">${contact.email}</a></td></tr>
              <tr><td style="padding:8px 0;color:#555;font-weight:600;">Phone</td><td style="padding:8px 0;">${contact.phone || '—'}</td></tr>
              <tr><td style="padding:8px 0;color:#555;font-weight:600;">Company</td><td style="padding:8px 0;">${contact.company || '—'}</td></tr>
              <tr><td style="padding:8px 0;color:#555;font-weight:600;">Service</td><td style="padding:8px 0;">${contact.service || '—'}</td></tr>
              <tr><td style="padding:8px 0;color:#555;font-weight:600;">Subject</td><td style="padding:8px 0;"><strong>${contact.subject}</strong></td></tr>
            </table>
            <div style="margin-top:16px;background:#fff;padding:16px;border-radius:6px;border-left:4px solid #0B4619;">
              <p style="margin:0;color:#333;white-space:pre-wrap;">${contact.message}</p>
            </div>
            <p style="margin-top:20px;color:#888;font-size:0.85rem;">Submitted via yesdin.ng contact form</p>
          </div>
        </div>`;

    return transporter.sendMail({
        from:    `"Yesdin Website" <${process.env.EMAIL_USER}>`,
        to:      process.env.ADMIN_EMAIL,
        subject: `[Yesdin Contact] ${contact.subject}`,
        html,
    });
};

const sendAutoReply = (contact) => {
    const html = `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#0B4619;padding:24px 30px;border-radius:8px 8px 0 0;">
            <h2 style="color:#fff;margin:0;">Thank you for reaching out!</h2>
          </div>
          <div style="background:#f4f7f5;padding:28px 30px;border-radius:0 0 8px 8px;">
            <p>Hi <strong>${contact.name}</strong>,</p>
            <p>We have received your message about <em>"${contact.subject}"</em> and our team will respond within <strong>24 business hours</strong>.</p>
            <p>In the meantime, feel free to explore our services at <a href="https://yesdin.ng">yesdin.ng</a>.</p>
            <p style="margin-top:24px;">Best regards,<br><strong>Yesdin Technologies Team</strong><br>
            <a href="mailto:admin@yesdin.ng">admin@yesdin.ng</a> | +234 906 020 3705</p>
          </div>
        </div>`;

    return transporter.sendMail({
        from:    `"Yesdin Technologies" <${process.env.EMAIL_USER}>`,
        to:      contact.email,
        subject: `We received your message — Yesdin Technologies`,
        html,
    });
};

/* ── Helper: require valid x-api-key header ── */
const requireApiKey = (req, res, next) => {
    const key = req.headers['x-api-key'];
    if (!key || key !== process.env.ADMIN_API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
};

/* ────────────────────────────────────────────────────────────────
   ROUTES
──────────────────────────────────────────────────────────────── */

/* GET /api/health */
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'Yesdin Backend', ts: new Date().toISOString() });
});

/* POST /api/contact — submit contact form */
app.post('/api/contact', async (req, res) => {
    const { name, email, phone, company, service, subject, message } = req.body;

    // Server-side validation
    if (!name || !name.trim())         return res.status(400).json({ error: 'Name is required.' });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
                                        return res.status(400).json({ error: 'A valid email is required.' });
    if (!subject || !subject.trim())   return res.status(400).json({ error: 'Subject is required.' });
    if (!message || !message.trim())   return res.status(400).json({ error: 'Message is required.' });

    const contact = {
        name:    name.trim(),
        email:   email.trim().toLowerCase(),
        phone:   (phone   || '').trim(),
        company: (company || '').trim(),
        service: (service || '').trim(),
        subject: subject.trim(),
        message: message.trim(),
    };

    try {
        insertContact(contact);

        // Send emails in parallel; don't fail the request if email fails
        Promise.allSettled([
            sendAdminNotification(contact),
            sendAutoReply(contact),
        ]).then(results => {
            results.forEach(r => {
                if (r.status === 'rejected') console.error('Email error:', r.reason?.message);
            });
        });

        return res.status(201).json({ success: true, message: 'Submission received. Thank you!' });
    } catch (err) {
        console.error('DB insert error:', err);
        return res.status(500).json({ error: 'Server error. Please try again later.' });
    }
});

/* GET /api/contacts — admin: list all submissions */
app.get('/api/contacts', requireApiKey, (_req, res) => {
    try {
        const contacts = getAllContacts();
        res.json({ count: contacts.length, contacts });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to retrieve contacts.' });
    }
});

/* PATCH /api/contacts/:id/status — admin: update submission status */
app.patch('/api/contacts/:id/status', requireApiKey, (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['new', 'read', 'replied', 'archived'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
    }
    try {
        const existing = getContactById(parseInt(id, 10));
        if (!existing) return res.status(404).json({ error: 'Contact not found.' });
        updateStatus(parseInt(id, 10), status);
        res.json({ success: true, id: parseInt(id, 10), status });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Update failed.' });
    }
});

/* ── Start server ── */
app.listen(PORT, () => {
    console.log(`✅  Yesdin backend running on http://localhost:${PORT}`);
    console.log(`   Health check → http://localhost:${PORT}/api/health`);
});
