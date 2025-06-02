// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const { getAllUsers, deleteUser } = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');

// Bu route'lara erişim için kullanıcının giriş yapmış ve admin olması gerekir.
router.use(protect); // Önce kimlik doğrula
router.use(isAdmin); // Sonra admin mi kontrol et

router.get('/users', getAllUsers);
router.delete('/users/:userId', deleteUser);

module.exports = router;
