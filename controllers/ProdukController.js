/**
 * Controller Manajemen Produk & Stok
 */
const Produk = require('../models/Produk');
const Kategori = require('../models/Kategori');

class ProdukController {
    static async index(req, res) {
        try {
            const kategoriFilter = req.query.kategori || null;
            const statusStokFilter = req.query.status_stok || null;
            const search = req.query.search || null;

            const produkList = await Produk.getAll({
                kategori: kategoriFilter,
                statusStok: statusStokFilter,
                search
            });

            const categories = Kategori.getAll();

            res.render('stok/index', {
                title: 'Manajemen Produk & Stok - Dapur Ina',
                produkList,
                categories,
                kategoriFilter,
                statusStokFilter,
                search
            });
        } catch (err) {
            req.session.flash_error = 'Gagal memuat daftar produk: ' + err.message;
            res.redirect('/dashboard');
        }
    }

    static async store(req, res) {
        try {
            const { nama_produk, id_kategori, harga, stok, deskripsi, gambar } = req.body;
            await Produk.create({
                nama_produk,
                id_kategori,
                harga,
                stok,
                deskripsi,
                gambar: gambar || 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=600&q=80',
                id_admin: req.session.admin ? req.session.admin.id_admin : 1
            });

            req.session.flash_success = `Produk "${nama_produk}" berhasil ditambahkan!`;
            res.redirect('/stok');
        } catch (err) {
            req.session.flash_error = 'Gagal menambah produk: ' + err.message;
            res.redirect('/stok');
        }
    }

    static async update(req, res) {
        try {
            const id = parseInt(req.body.id_produk, 10);
            const { nama_produk, id_kategori, harga, stok, deskripsi, gambar } = req.body;

            await Produk.update(id, {
                nama_produk,
                id_kategori,
                harga,
                stok,
                deskripsi,
                gambar
            });

            req.session.flash_success = `Data produk "${nama_produk}" berhasil diperbarui!`;
            res.redirect('/stok');
        } catch (err) {
            req.session.flash_error = 'Gagal memperbarui produk: ' + err.message;
            res.redirect('/stok');
        }
    }

    static async quickStock(req, res) {
        try {
            const { id_produk, new_stok } = req.body;
            const id = parseInt(id_produk, 10);
            const stock = parseInt(new_stok, 10);

            const updated = await Produk.updateStock(id, stock);
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.json({ success: true, data: updated });
            }

            req.session.flash_success = `Stok "${updated.nama_produk}" berhasil diupdate menjadi ${updated.stok}.`;
            res.redirect('/stok');
        } catch (err) {
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.status(400).json({ success: false, message: err.message });
            }
            req.session.flash_error = 'Gagal mengubah stok: ' + err.message;
            res.redirect('/stok');
        }
    }

    static async delete(req, res) {
        try {
            const id = parseInt(req.params.id || req.body.id_produk, 10);
            await Produk.delete(id);

            req.session.flash_success = 'Produk berhasil dihapus!';
            res.redirect('/stok');
        } catch (err) {
            req.session.flash_error = 'Gagal menghapus produk: ' + err.message;
            res.redirect('/stok');
        }
    }
}

module.exports = ProdukController;
