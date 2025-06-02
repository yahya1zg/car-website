// controllers/carController.js
const db = require('../config/db').pool;

// @desc    Tüm arabaları listele
// @route   GET /api/cars
// @access  Public
const getAllCars = async (req, res, next) => {
  try {
    const [cars] = await db.query('SELECT id, brand, model, year, price, image_url, created_at FROM cars ORDER BY created_at DESC');
    res.status(200).json(cars);
  } catch (error) {
    next(error);
  }
};

// @desc    Yeni araba ekle (Sadece Admin)
// @route   POST /api/cars
// @access  Private/Admin
const createCar = async (req, res, next) => {
  const { brand, model, year, price, image_url } = req.body;
  const added_by_user_id = req.user.id; // Admin middleware'inden gelen kullanıcı ID'si

  if (!brand || !model || !year || price === undefined) {
    return res.status(400).json({ message: 'Lütfen marka, model, yıl ve fiyat bilgilerini girin.' });
  }
  if (isNaN(parseFloat(price)) || !isFinite(price) || price < 0) {
    return res.status(400).json({ message: 'Fiyat geçerli bir sayı olmalıdır ve 0 dan küçük olamaz.' });
  }
  if (isNaN(parseInt(year)) || year < 1886 || year > new Date().getFullYear() + 2) { // Basit bir yıl kontrolü
     return res.status(400).json({ message: 'Geçerli bir üretim yılı girin.' });
  }


  try {
    const [result] = await db.query(
      'INSERT INTO cars (brand, model, year, price, image_url, added_by_user_id) VALUES (?, ?, ?, ?, ?, ?)',
      [brand, model, parseInt(year), parseFloat(price), image_url || null, added_by_user_id]
    );

    if (result.affectedRows === 1) {
      const [newCar] = await db.query('SELECT * FROM cars WHERE id = ?', [result.insertId]);
      res.status(201).json({ message: 'Araba başarıyla eklendi.', car: newCar[0] });
    } else {
      throw new Error('Araba eklenirken bir sorun oluştu.');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Araba bilgilerini güncelle (Sadece Admin)
// @route   PUT /api/cars/:carId
// @access  Private/Admin
const updateCar = async (req, res, next) => {
  const { carId } = req.params;
  const { brand, model, year, price, image_url } = req.body;

  if (!brand || !model || !year || price === undefined) {
    return res.status(400).json({ message: 'Lütfen marka, model, yıl ve fiyat bilgilerini girin.' });
  }
  if (isNaN(parseFloat(price)) || !isFinite(price) || price < 0) {
    return res.status(400).json({ message: 'Fiyat geçerli bir sayı olmalıdır ve 0 dan küçük olamaz.' });
  }
   if (isNaN(parseInt(year)) || year < 1886 || year > new Date().getFullYear() + 2) {
     return res.status(400).json({ message: 'Geçerli bir üretim yılı girin.' });
  }

  try {
    const [carExists] = await db.query('SELECT id FROM cars WHERE id = ?', [carId]);
    if (carExists.length === 0) {
        return res.status(404).json({ message: 'Güncellenecek araba bulunamadı.' });
    }

    const [result] = await db.query(
      'UPDATE cars SET brand = ?, model = ?, year = ?, price = ?, image_url = ? WHERE id = ?',
      [brand, model, parseInt(year), parseFloat(price), image_url || null, carId]
    );

    if (result.affectedRows === 1) {
      const [updatedCar] = await db.query('SELECT * FROM cars WHERE id = ?', [carId]);
      res.status(200).json({ message: 'Araba başarıyla güncellendi.', car: updatedCar[0] });
    } else {
      // Eğer affectedRows 0 ise ve araba varsa, muhtemelen gönderilen veriler mevcut verilerle aynıdır.
      // Bu durumu hata olarak değil, "değişiklik yapılmadı" olarak ele alabilirsiniz.
      // Ancak frontend'in beklentisine göre bir hata mesajı da döndürülebilir.
      const [existingCar] = await db.query('SELECT * FROM cars WHERE id = ?', [carId]);
      if (existingCar.length > 0) {
        return res.status(200).json({ message: 'Araba bilgileri zaten güncel.', car: existingCar[0] });
      }
      throw new Error('Araba güncellenirken bir sorun oluştu veya araba bulunamadı.');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Arabayı sil (Sadece Admin)
// @route   DELETE /api/cars/:carId
// @access  Private/Admin
const deleteCar = async (req, res, next) => {
  const { carId } = req.params;

  try {
    // Arabayı silmeden önce ilişkili favori ve satın alma kayıtlarını silmek gerekebilir (CASCADE ON DELETE yoksa)
    // VEYA bu kayıtları null yapmak. Bu örnekte direkt arabayı siliyoruz.
    // Veritabanı şemanızda ON DELETE CASCADE ayarlandıysa, bu adımlar gereksizdir.
    // await db.query('DELETE FROM favorites WHERE car_id = ?', [carId]);
    // await db.query('DELETE FROM purchases WHERE car_id = ?', [carId]);

    const [result] = await db.query('DELETE FROM cars WHERE id = ?', [carId]);

    if (result.affectedRows === 1) {
      res.status(200).json({ message: 'Araba başarıyla silindi.' });
    } else {
      res.status(404).json({ message: 'Silinecek araba bulunamadı.' });
    }
  } catch (error) {
    // Eğer foreign key kısıtlamaları varsa ve CASCADE ayarlanmamışsa,
    // bu silme işlemi hata verebilir. Hata mesajını kontrol edebilirsiniz.
    if (error.code === 'ER_ROW_IS_REFERENCED_2') { // MySQL foreign key constraint error code
        return res.status(400).json({ message: 'Bu araba favorilerde veya satın almalarda kayıtlı olduğu için silinemiyor. Önce ilgili kayıtları silin.' });
    }
    next(error);
  }
};

module.exports = {
  getAllCars,
  createCar,
  updateCar,
  deleteCar,
};
