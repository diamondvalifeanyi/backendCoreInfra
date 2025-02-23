import express from 'express';
import {
  createCardController,
  getCardDetailsController,
  // getCardDetailsEmail,
  getDashboardData,
  createProfileController,
  getProfileByBinController
} from '../controllers/cardController.js';

const router = express.Router();

// Route to create a new card
router.post('/cards', createCardController);
router.post('/profile', createProfileController);

// Route to get card details by batch_id
router.get('/cards/:batch_id', getCardDetailsController);
// router.get('/cards/view', getCardDetailsEmail);
router.get('/dashboard/:batch_id', getDashboardData);
router.get('/profile/:bin', getProfileByBinController);

export default router;