// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const db = require('../config/db').pool; // Veritabanı bağlantı havuzunu al

const protect = async (req, res, next) => {
  let token;

  // Token'ı 'Authorization' başlığından 'Bearer TOKEN_STRING' formatında al
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Token'ı doğrula
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Token'dan alınan kullanıcı ID'si ile veritabanından kullanıcıyı çek (şifre hariç)
      // Bu, kullanıcının hala var olup olmadığını ve token'ın geçerli bir kullanıcıya ait olup olmadığını kontrol eder.
      const [rows] = await db.query('SELECT id, username, email, is_admin, created_at FROM users WHERE id = ?', [decoded.id]);
      
      if (rows.length === 0) {
        return res.status(401).json({ message: 'Yetkisiz erişim: Kullanıcı bulunamadı.' });
      }

      req.user = rows[0]; // Kullanıcı bilgilerini request objesine ekle
      next(); // Sonraki middleware veya route handler'a geç
    } catch (error) {
      console.error('Token doğrulama hatası:', error.message);
      // Token geçersizse (örn: süresi dolmuş, yanlış secret)
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Yetkisiz erişim: Oturum süresi dolmuş. Lütfen tekrar giriş yapın.' });
      }
      return res.status(401).json({ message: 'Yetkisiz erişim: Geçersiz token.' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Yetkisiz erişim: Token bulunamadı.' });
  }
};

module.exports = { protect };
