// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  getUserFavorites,
  toggleFavorite,
  getUserPurchases,
  purchaseCar,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware'); // Tüm kullanıcı route'ları için kimlik doğrulama gerekli

// Bu route'lara erişim için kullanıcının giriş yapmış olması (geçerli bir token'a sahip olması) gerekir.
router.use(protect); // Bu satırdan sonraki tüm route'lar için 'protect' middleware'i uygulanır.

router.get('/profile', getUserProfile);
router.get('/favorites', getUserFavorites);
router.post('/favorites/:carId', toggleFavorite); // Hem ekleme hem kaldırma için POST
router.get('/purchases', getUserPurchases);
router.post('/purchases/:carId', purchaseCar);

module.exports = router;
