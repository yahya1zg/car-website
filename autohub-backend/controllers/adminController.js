// controllers/adminController.js
const db = require('../config/db').pool;

// @desc    Tüm kullanıcıları listele (Sadece Admin)
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res, next) => {
  try {
    // Şifre hariç kullanıcı bilgilerini seç
    const [users] = await db.query('SELECT id, username, email, is_admin, created_at FROM users ORDER BY created_at DESC');
    res.status(200).json(users);
  } catch (error) {
    next(error);
  }
};

// @desc    Bir kullanıcıyı sil (Sadece Admin)
// @route   DELETE /api/admin/users/:userId
// @access  Private/Admin
const deleteUser = async (req, res, next) => {
  const { userId } = req.params;
  const adminUserId = req.user.id; // İşlemi yapan adminin ID'si

  // Adminin kendisini silmesini engelle
  if (parseInt(userId) === adminUserId) {
    return res.status(400).json({ message: 'Yöneticiler kendilerini silemez.' });
  }

  try {
    // Silinecek kullanıcının admin olup olmadığını kontrol et
    const [userToDelete] = await db.query('SELECT id, is_admin FROM users WHERE id = ?', [userId]);
    if (userToDelete.length === 0) {
      return res.status(404).json({ message: 'Silinecek kullanıcı bulunamadı.' });
    }
    // Başka bir admini silmeyi engelle (opsiyonel, iş kuralına bağlı)
    // Bu örnekte, adminler diğer adminleri silemez.
    if (userToDelete[0].is_admin) {
        return res.status(403).json({ message: 'Yöneticiler başka yöneticileri silemez.' });
    }

    // Kullanıcıyı silmeden önce ilişkili kayıtları (favoriler, satın almalar) silmek veya
    // bu kayıtlardaki user_id'yi null yapmak gerekebilir.
    // Veritabanı şemanızda ON DELETE CASCADE veya ON DELETE SET NULL ayarlandıysa, bu adımlar gereksizdir.
    // Bu örnekte, bu ilişkili kayıtları silmiyoruz, bu da foreign key hatasına yol açabilir.
    // await db.query('DELETE FROM favorites WHERE user_id = ?', [userId]);
    // await db.query('DELETE FROM purchases WHERE user_id = ?', [userId]);
    // Eğer kullanıcının eklediği arabalar varsa, onların durumu da düşünülmeli.

    const [result] = await db.query('DELETE FROM users WHERE id = ?', [userId]);

    if (result.affectedRows === 1) {
      res.status(200).json({ message: 'Kullanıcı başarıyla silindi.' });
    } else {
      // Bu durumun oluşmaması gerekir, çünkü yukarıda kullanıcı varlığı kontrol edildi.
      res.status(404).json({ message: 'Silinecek kullanıcı bulunamadı veya silme işlemi başarısız oldu.' });
    }
  } catch (error) {
     // Eğer foreign key kısıtlamaları varsa ve CASCADE ayarlanmamışsa,
    // bu silme işlemi hata verebilir. Hata mesajını kontrol edebilirsiniz.
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(400).json({ message: 'Bu kullanıcıya ait favori, satın alma veya araba kayıtları bulunduğu için silinemiyor. Önce ilgili kayıtları silin veya transfer edin.' });
    }
    next(error);
  }
};

module.exports = {
  getAllUsers,
  deleteUser,
};
