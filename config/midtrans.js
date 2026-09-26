/**
 * Konfigurasi & Helper Midtrans Payment Gateway
 * Restoran Dapur Ina Aina
 */
const midtransClient = require('midtrans-client');
require('dotenv').config();

function getSnapInstance() {
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    const serverKey = process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-test-dapurina2026';
    const clientKey = process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-test-dapurina2026';

    try {
        return new midtransClient.Snap({
            isProduction,
            serverKey,
            clientKey
        });
    } catch (err) {
        console.warn('⚠️ Warning: Inisialisasi Midtrans Snap gagal:', err.message);
        return null;
    }
}

/**
 * Buat Transaksi Snap Midtrans
 * @param {Object} params
 * @param {Object} params.order Data pesanan (id_pesanan, total_harga, no_pesanan)
 * @param {Array} params.items Array item produk yang dipesan
 * @param {Object} params.customer Data pelanggan (nama, no_telepon, nomor_meja)
 * @returns {Promise<{token: string, redirect_url: string, is_mock: boolean}>}
 */
async function createSnapTransaction({ order, items = [], customer = {} }) {
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    const snap = getSnapInstance();

    const grossAmount = Math.max(1000, Math.round(parseFloat(order.total_harga || order.total || 0)));
    const uniqueOrderId = `INA-${order.id_pesanan}-${Date.now().toString().slice(-6)}`;
    const custName = (customer.nama || customer.nama_pelanggan || 'Pelanggan').substring(0, 50);
    const custPhone = (customer.no_telepon && customer.no_telepon !== '-') ? customer.no_telepon : '081234567890';

    const itemDetails = (items && items.length > 0)
        ? items.map(item => ({
            id: String(item.id_produk || 'PROD').substring(0, 50),
            price: Math.round(parseFloat(item.harga_satuan || item.harga || 0)),
            quantity: parseInt(item.jumlah, 10) || 1,
            name: (item.nama_produk || 'Menu Dapur Ina').substring(0, 50)
        }))
        : [{
            id: `ORD-${order.id_pesanan}`,
            price: grossAmount,
            quantity: 1,
            name: `Pesanan #${order.no_pesanan || order.id_pesanan}`
        }];

    // Hitung ulang total item_details agar presisi sama dengan gross_amount
    const totalItemsAmount = itemDetails.reduce((sum, it) => sum + (it.price * it.quantity), 0);
    if (totalItemsAmount !== grossAmount) {
        itemDetails.length = 0;
        itemDetails.push({
            id: `ORD-${order.id_pesanan}`,
            price: grossAmount,
            quantity: 1,
            name: `Total Pesanan #${order.no_pesanan || order.id_pesanan}`
        });
    }

    const parameter = {
        transaction_details: {
            order_id: uniqueOrderId,
            gross_amount: grossAmount
        },
        customer_details: {
            first_name: custName,
            phone: custPhone,
            notes: customer.nomor_meja || 'Meja'
        },
        item_details: itemDetails,
        callbacks: {
            finish: `/pesanan/${order.id_pesanan}?payment=success`
        }
    };

    // Jika menggunakan key dummy/placeholder atau offline, gunakan mock token terstruktur
    const isPlaceholderKey = serverKey.includes('test-dapurina') || serverKey.includes('your-server-key') || !serverKey;

    if (!isPlaceholderKey && snap) {
        try {
            console.log(`[Midtrans] Mengirim request transaksi Snap ke Midtrans (${isProduction ? 'PRODUCTION' : 'SANDBOX'})...`);
            const transaction = await snap.createTransaction(parameter);
            console.log(`[Midtrans] ✅ Token Snap berhasil didapatkan: ${transaction.token}`);
            return {
                token: transaction.token,
                redirect_url: transaction.redirect_url,
                order_id: uniqueOrderId,
                is_mock: false
            };
        } catch (apiErr) {
            console.warn('⚠️ Midtrans API error:', apiErr.message, '- Beralih ke mode simulator.');
        }
    }

    // Fallback Mock Token untuk demo tanpa hambatan
    const mockToken = `snap_token_mock_${order.id_pesanan}_${Date.now()}`;
    return {
        token: mockToken,
        redirect_url: `#midtrans_mock_${uniqueOrderId}`,
        order_id: uniqueOrderId,
        is_mock: true
    };
}

module.exports = {
    getSnapInstance,
    createSnapTransaction
};
