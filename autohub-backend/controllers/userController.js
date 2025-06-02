// controllers/userController.js
const db = require('../config/db').pool;

// @desc    Mevcut kullanıcının profil bilgilerini getir
// @route   GET /api/user/profile
// @access  Private
const getUserProfile = async (req, res, next) => {
  // req.user, protect middleware'i tarafından eklenir
  try {
    // Kullanıcıyı ID ile tekrar çekmek yerine req.user'ı doğrudan kullanabiliriz.
    // Ancak, en güncel bilgiyi almak için veritabanından çekmek daha güvenli olabilir.
    const [users] = await db.query('SELECT id, username, email, is_admin, created_at FROM users WHERE id = ?', [req.user.id]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }
    res.status(200).json(users[0]);
  } catch (error) {
    next(error);
  }
};

// @desc    Kullanıcının favori arabalarını listele (sadece ID'ler)
// @route   GET /api/user/favorites
// @access  Private
const getUserFavorites = async (req, res, next) => {
  const userId = req.user.id;
  try {
    const [favorites] = await db.query('SELECT car_id FROM favorites WHERE user_id = ?', [userId]);
    const favoriteCarIds = favorites.map(fav => fav.car_id);
    res.status(200).json(favoriteCarIds);
  } catch (error) {
    next(error);
  }
};

// @desc    Bir arabayı favorilere ekle/kaldır
// @route   POST /api/user/favorites/:carId
// @access  Private
const toggleFavorite = async (req, res, next) => {
  const userId = req.user.id;
  const { carId } = req.params;

  try {
    // Arabanın var olup olmadığını kontrol et
    const [carExists] = await db.query('SELECT id FROM cars WHERE id = ?', [carId]);
    if (carExists.length === 0) {
        return res.status(404).json({ message: 'Favorilere eklenecek/kaldırılacak araba bulunamadı.' });
    }

    const [existingFavorite] = await db.query(
      'SELECT id FROM favorites WHERE user_id = ? AND car_id = ?',
      [userId, carId]
    );

    if (existingFavorite.length > 0) {
      // Favori zaten var, kaldır
      await db.query('DELETE FROM favorites WHERE user_id = ? AND car_id = ?', [userId, carId]);
      res.status(200).json({ message: 'Araba favorilerden kaldırıldı.', favorited: false });
    } else {
      // Favori yok, ekle
      await db.query('INSERT INTO favorites (user_id, car_id) VALUES (?, ?)', [userId, carId]);
      res.status(200).json({ message: 'Araba favorilere eklendi.', favorited: true });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Kullanıcının satın aldığı arabaları listele
// @route   GET /api/user/purchases
// @access  Private
const getUserPurchases = async (req, res, next) => {
  const userId = req.user.id;
  try {
    // Satın alınan arabaların detaylarını da çekmek için JOIN kullanılabilir
    // Bu örnekte frontend'in beklediği gibi sadece purchase bilgilerini döndürüyoruz.
    // Frontend, car_id'yi kullanarak araba detaylarını ayrıca çekebilir veya
    // burada JOIN ile tüm bilgileri tek seferde gönderebiliriz.
    // Frontend script.js'deki displayPurchases fonksiyonu car_id ile cars listesinden detayları alıyor.
    const [purchases] = await db.query(
      'SELECT id, car_id, user_id, purchase_price, purchased_at FROM purchases WHERE user_id = ? ORDER BY purchased_at DESC',
      [userId]
    );
    res.status(200).json(purchases);
  } catch (error) {
    next(error);
  }
};

// @desc    Bir arabayı satın al
// @route   POST /api/user/purchases/:carId
// @access  Private
const purchaseCar = async (req, res, next) => {
  const userId = req.user.id;
  const { carId } = req.params;

  try {
    // Arabanın var olup olmadığını ve fiyatını kontrol et
    const [cars] = await db.query('SELECT id, price FROM cars WHERE id = ?', [carId]);
    if (cars.length === 0) {
      return res.status(404).json({ message: 'Satın alınacak araba bulunamadı.' });
    }
    const car = cars[0];

    // Kullanıcının bu arabayı daha önce satın alıp almadığını kontrol et (opsiyonel, iş kuralına bağlı)
    // const [alreadyPurchased] = await db.query('SELECT id FROM purchases WHERE user_id = ? AND car_id = ?', [userId, carId]);
    // if (alreadyPurchased.length > 0) {
    //   return res.status(400).json({ message: 'Bu arabayı zaten satın almışsınız.' });
    // }

    // Satın alma işlemini kaydet
    const purchasePrice = car.price; // Satın alma anındaki fiyatı kaydet
    const [result] = await db.query(
      'INSERT INTO purchases (user_id, car_id, purchase_price) VALUES (?, ?, ?)',
      [userId, carId, purchasePrice]
    );

    if (result.affectedRows === 1) {
      const [newPurchase] = await db.query('SELECT * FROM purchases WHERE id = ?', [result.insertId]);
      res.status(201).json({ message: 'Araba başarıyla satın alındı.', purchase: newPurchase[0] });
    } else {
      throw new Error('Satın alma işlemi sırasında bir sorun oluştu.');
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserProfile,
  getUserFavorites,
  toggleFavorite,
  getUserPurchases,
  purchaseCar,
};
