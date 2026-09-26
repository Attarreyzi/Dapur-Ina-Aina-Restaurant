/**
 * Middleware Autentikasi Admin
 */
function requireAuth(req, res, next) {
    if (!req.session || !req.session.admin) {
        if (req.session) {
            req.session.returnTo = req.originalUrl;
            req.session.flash_error = 'silahkan login terlebih dahulu untuk mengakses menu manajemen admin.';
        }
        return res.redirect('/login');
    }
    next();
}

function redirectIfAuthenticated(req, res, next) {
    if (req.session && req.session.admin) {
        return res.redirect('/dashboard');
    }
    next();
}

module.exports = {
    requireAuth,
    redirectIfAuthenticated
};
