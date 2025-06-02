// middleware/adminMiddleware.js

const isAdmin = (req, res, next) => {
  // Bu middleware 'protect' middleware'inden sonra çalışmalıdır,
  // çünkü req.user objesinin var olmasını bekler.
  if (req.user && req.user.is_admin) {
    next(); // Kullanıcı admin ise sonraki adıma geç
  } else {
    res.status(403).json({ message: 'Yetkisiz erişim: Bu işlem için yönetici yetkisi gereklidir.' });
  }
};

module.exports = { isAdmin };
