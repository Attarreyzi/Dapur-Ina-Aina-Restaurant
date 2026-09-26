/**
 * Helper Middleware untuk View EJS
 */
function setupLocals(req, res, next) {
    // Current user / admin session
    res.locals.admin = req.session ? req.session.admin : null;
    res.locals.currentPath = req.path;

    // Flash Messages
    res.locals.flash_success = req.session ? req.session.flash_success : null;
    res.locals.flash_error = req.session ? req.session.flash_error : null;

    if (req.session) {
        req.session.flash_success = null;
        req.session.flash_error = null;
    }

    // Format Rupiah Helper
    res.locals.formatRupiah = (number) => {
        const num = parseFloat(number) || 0;
        return 'Rp ' + num.toLocaleString('id-ID');
    };

    // Format Tanggal Helper
    res.locals.formatDate = (dateString, withTime = true) => {
        if (!dateString) return '-';
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return String(dateString);

        const options = {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            timeZone: 'Asia/Jakarta'
        };

        if (withTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }

        return d.toLocaleDateString('id-ID', options);
    };

    // Midtrans Configuration for Frontend
    res.locals.midtransClientKey = process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-test-dapurina2026';
    res.locals.midtransSnapUrl = process.env.MIDTRANS_IS_PRODUCTION === 'true'
        ? 'https://app.midtrans.com/snap/snap.js'
        : 'https://app.sandbox.midtrans.com/snap/snap.js';

    next();
}

module.exports = setupLocals;
