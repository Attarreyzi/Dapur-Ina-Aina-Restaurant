/**
 * Model Kategori Helper (Clean E-Commerce Standard)
 */
class Kategori {
    static LIST = [
        { id: 1, nama: 'Makanan Utama', slug: 'makanan-utama' },
        { id: 2, nama: 'Appetizer', slug: 'appetizer' },
        { id: 3, nama: 'Minuman', slug: 'minuman' }
    ];

    static getAll() {
        return this.LIST;
    }

    static getNamaById(id) {
        const item = this.LIST.find(k => k.id === parseInt(id, 10));
        return item ? item.nama : 'Makanan Utama';
    }

    static getIdByNama(nama) {
        const item = this.LIST.find(k => k.nama.toLowerCase() === (nama || '').toLowerCase());
        return item ? item.id : 1;
    }
}

module.exports = Kategori;
