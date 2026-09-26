/**
 * Controller Laporan Penjualan (Mingguan & Bulanan)
 */
const Laporan = require('../models/Laporan');

class LaporanController {
    static async index(req, res) {
        try {
            const { jenis_periode = 'mingguan', start_date, end_date } = req.query;

            const laporan = await Laporan.getLaporan({
                jenisPeriode: jenis_periode,
                startDate: start_date,
                endDate: end_date
            });

            res.render('laporan/index', {
                title: 'Laporan Penjualan - Dapur Ina Aina',
                laporan,
                jenisPeriode: jenis_periode,
                startDate: start_date || '',
                endDate: end_date || ''
            });
        } catch (err) {
            req.session.flash_error = 'Gagal memuat laporan: ' + err.message;
            res.redirect('/dashboard');
        }
    }

    static async cetak(req, res) {
        try {
            const { jenis_periode = 'mingguan', start_date, end_date } = req.query;

            const laporan = await Laporan.getLaporan({
                jenisPeriode: jenis_periode,
                startDate: start_date,
                endDate: end_date
            });

            res.render('laporan/cetak', {
                title: `Cetak Laporan Penjualan (${laporan.tanggal_mulai} s.d ${laporan.tanggal_akhir})`,
                laporan,
                admin: req.session.user || null
            });
        } catch (err) {
            req.session.flash_error = 'Gagal mencetak laporan: ' + err.message;
            res.redirect('/laporan');
        }
    }

    static async downloadPdf(req, res) {
        let browser;
        try {
            const { jenis_periode = 'mingguan', start_date, end_date } = req.query;

            const laporan = await Laporan.getLaporan({
                jenisPeriode: jenis_periode,
                startDate: start_date,
                endDate: end_date
            });

            // Render template cetak.ejs ke string HTML secara langsung
            const html = await new Promise((resolve, reject) => {
                req.app.render('laporan/cetak', {
                    title: `Laporan Penjualan Dapur Ina (${laporan.tanggal_mulai} s.d ${laporan.tanggal_akhir})`,
                    laporan,
                    admin: req.session.user || null,
                    formatRupiah: res.locals.formatRupiah || ((n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID')),
                    formatDate: res.locals.formatDate || ((d) => d)
                }, (err, renderedHtml) => {
                    if (err) return reject(err);
                    resolve(renderedHtml);
                });
            });

            const puppeteer = require('puppeteer');
            browser = await puppeteer.launch({
                headless: 'new',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-gpu'
                ]
            });

            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'load' });

            // Generate PDF buffer — landscape A4 tanpa header/footer bawaan browser
            const pdfBuffer = await page.pdf({
                format: 'A4',
                landscape: true,
                printBackground: true,
                margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
                displayHeaderFooter: false
            });

            await browser.close();
            browser = null;

            // Nama file dinamis
            const filename = `Laporan_Penjualan_DapurIna_${laporan.tanggal_mulai}_sd_${laporan.tanggal_akhir}.pdf`;

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Length', pdfBuffer.length);
            return res.end(pdfBuffer);

        } catch (err) {
            if (browser) { try { await browser.close(); } catch(_) {} }
            console.error('❌ Gagal generate PDF:', err.message);
            const { jenis_periode = 'mingguan', start_date = '', end_date = '' } = req.query;
            return res.redirect(`/cetak_laporan?jenis_periode=${jenis_periode}&start_date=${start_date}&end_date=${end_date}`);
        }
    }

}

module.exports = LaporanController;

