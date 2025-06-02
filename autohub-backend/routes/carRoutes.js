const express = require('express');
const router = express.Router();
const {
  getAllCars,
  createCar,
  updateCar,
  deleteCar,
} = require('../controllers/carController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');

// Herkesin erişebileceği route'lar
router.get('/', getAllCars);

// Sadece adminlerin erişebileceği route'lar
router.post('/', protect, isAdmin, createCar);
router.put('/:carId', protect, isAdmin, updateCar);
router.delete('/:carId', protect, isAdmin, deleteCar);

module.exports = router;

