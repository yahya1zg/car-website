// server.js
require('dotenv').config(); // .env dosyasındaki değişkenleri en başta yükle
const express = require('express');
const cors = require('cors');
const db = require('./config/db'); // Veritabanı bağlantı havuzunu import et

// Route dosyalarını import et
const authRoutes = require('./routes/authRoutes');
const carRoutes = require('./routes/carRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware'ler
app.use(cors()); // Cross-Origin Resource Sharing'i etkinleştir
app.use(express.json()); // Gelen JSON payload'larını parse etmek için
app.use(express.urlencoded({ extended: true })); // URL-encoded payload'ları parse etmek için

// Veritabanı bağlantısını test et (uygulama başlangıcında)
db.testConnection().catch(err => {
    // Hata zaten db.js içinde loglanıyor ve process.exit() çağrılıyor.
    // Burada ek bir işlem yapmaya gerek yok, ancak isterseniz ek loglama yapabilirsiniz.
    console.error("Sunucu başlatılırken veritabanı bağlantı testi başarısız oldu.", err.message);
});

// Ana API Route'u (API'nin çalıştığını test etmek için)
app.get('/api', (req, res) => {
  res.status(200).json({ message: 'AutoHub API başarıyla çalışıyor!' });
});

// API Route'larını Kullan
app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

// Bulunamayan Route'lar için 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ message: `İstenen kaynak bulunamadı: ${req.originalUrl}` });
});

// Global Hata Yönetimi Middleware'i (Tüm route'lardan sonra gelmeli)
// Express, bir middleware fonksiyonunun 4 argümanı (err, req, res, next) varsa
// onu otomatik olarak bir hata işleyici olarak tanır.
app.use((err, req, res, next) => {
  console.error("Global Hata Yakalayıcı:", err); // Hatanın detaylarını sunucu konsoluna yazdır

  const statusCode = err.statusCode || 500; // Eğer hata objesinde statusCode varsa onu kullan, yoksa 500
  const message = err.message || 'Sunucuda beklenmedik bir hata oluştu.';

  res.status(statusCode).json({
    message: message,
    // Geliştirme ortamında hatanın stack trace'ini de gönderebilirsiniz
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Sunucuyu başlat
app.listen(PORT, () => {
  console.log(`AutoHub backend sunucusu http://localhost:${PORT} adresinde çalışıyor.`);
});
