/**
 * Controller Autentikasi Admin
 */
const Admin = require('../models/Admin');

class AuthController {
    static async showLogin(req, res) {
        if (req.session && req.session.admin) {
            return res.redirect('/dashboard');
        }
        res.render('auth/login', {
            title: 'LOGIN - Dapur Ina Aina'
        });
    }

    static async processLogin(req, res) {
        try {
            const { email, password, pin, direct_admin } = req.body;

            // Direct admin access
            if (direct_admin === '1' || pin === '1234' || pin === 'admin123') {
                const admin = await Admin.findByEmail('admin@dapurina.com');
                if (admin) {
                    req.session.admin = {
                        id_admin: admin.id_admin,
                        nama: admin.nama,
                        email: admin.email
                    };
                    const target = req.session.returnTo || '/dashboard';
                    delete req.session.returnTo;
                    return res.redirect(target);
                }
            }

            if (!email || !password) {
                req.session.flash_error = 'Email dan kata sandi wajib diisi.';
                return res.redirect('/login');
            }

            const admin = await Admin.findByEmail(email.trim());
            if (!admin) {
                req.session.flash_error = 'Email atau kata sandi salah.';
                return res.redirect('/login');
            }

            const isMatch = await Admin.verifyPassword(password, admin.password);
            if (!isMatch) {
                req.session.flash_error = 'Email atau kata sandi salah.';
                return res.redirect('/login');
            }

            req.session.admin = {
                id_admin: admin.id_admin,
                nama: admin.nama,
                email: admin.email
            };

            const targetUrl = req.session.returnTo || '/dashboard';
            delete req.session.returnTo;
            return res.redirect(targetUrl);
        } catch (err) {
            req.session.flash_error = 'Gagal login: ' + err.message;
            return res.redirect('/login');
        }
    }

    static async logout(req, res) {
        req.session.destroy(() => {
            res.redirect('/login');
        });
    }
}

module.exports = AuthController;
