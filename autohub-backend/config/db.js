const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config(); // .env dosyasındaki değişkenleri yükler

// MySQL bağlantı havuzu oluşturma
// Bağlantı havuzu, her istek için yeni bağlantı oluşturmak yerine
// mevcut bağlantıları yeniden kullanarak performansı artırır.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10, // Aynı anda açılabilecek maksimum bağlantı sayısı
  queueLimit: 0 // Bağlantı limiti dolduğunda bekleyecek istek kuyruğu limiti (0 = sınırsız)
});

// Bağlantıyı test etmek için (opsiyonel, sunucu başlangıcında çağrılabilir)
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL Veritabanına başarıyla bağlanıldı. Bağlantı ID:', connection.threadId);
    connection.release(); // Bağlantıyı havuza geri bırak
  } catch (error) {
    console.error('MySQL veritabanına bağlanırken hata oluştu:', error);
    // Uygulamanın çökmesini önlemek için hata durumunda çıkış yapabilir veya
    // yeniden deneme mekanizması kurabilirsiniz.
    process.exit(1); // Hata durumunda uygulamayı sonlandır
  }
}

// Modül olarak bağlantı havuzunu dışa aktar
module.exports = {
  pool,
  testConnection
};
