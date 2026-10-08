/**
 * @swagger
 * /api/transactions:
 *   post:
 *     summary: Create a new transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, amount, category, date]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *               amount:
 *                 type: number
 *               category:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *           example:
 *             type: expense
 *             amount: 15.5
 *             category: Food
 *             date: 2026-08-30
 *             description: Lunch
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *       401:
 *         description: Unauthorized
 *   get:
 *     summary: Get transactions for the authenticated user
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: month
 *         schema:
 *           type: string
 *         example: 2026-08
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         example: Food
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         example: expense
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Transactions fetched successfully
 */
/**
 * @swagger
 * /api/transactions/{id}:
 *   get:
 *     summary: Get one transaction by ID
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         required: true
 *         name: id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction found
 *       404:
 *         description: Transaction not found
 *   put:
 *     summary: Update a transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         required: true
 *         name: id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction updated successfully
 *   delete:
 *     summary: Delete a transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         required: true
 *         name: id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction deleted successfully
 */

const express = require('express');
const { body } = require('express-validator');
const {
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  ALL_CATEGORIES,
} = require('../constants/categories');
const {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} = require('../controllers/transactionController');
const protect = require('../middleware/auth');
const validateRequest = require('../validators/validateRequest');

const router = express.Router();

const getAllowedCategoriesForType = (type) => {
  if (type === 'income') return INCOME_CATEGORIES;
  if (type === 'expense') return EXPENSE_CATEGORIES;
  return ALL_CATEGORIES;
};

router.use(protect);

router.post(
  '/',
  [
    body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
    body('category').custom((value, { req }) => {
      const type = req.body.type;
      const allowedCategories = getAllowedCategoriesForType(type);

      if (!allowedCategories.includes(value)) {
        throw new Error('The selected category is invalid for the selected transaction type');
      }

      return true;
    }),
    body('date').isISO8601().withMessage('Date must be a valid ISO date'),
    body('description').optional().isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),
  ],
  validateRequest,
  createTransaction
);

router.get('/', getTransactions);
router.get('/:id', getTransactionById);
router.put(
  '/:id',
  [
    body('type').optional().isIn(['income', 'expense']).withMessage('Type must be income or expense'),
    body('amount').optional().isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
    body('category').optional().custom((value, { req }) => {
      const type = req.body.type;
      const allowedCategories = getAllowedCategoriesForType(type || 'all');

      if (!allowedCategories.includes(value)) {
        throw new Error('The selected category is invalid for the selected transaction type');
      }

      return true;
    }),
    body('date').optional().isISO8601().withMessage('Date must be a valid ISO date'),
    body('description').optional().isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),
  ],
  validateRequest,
  updateTransaction
);
router.delete('/:id', deleteTransaction);

module.exports = router;
