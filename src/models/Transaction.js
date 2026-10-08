const mongoose = require('mongoose');
const { INCOME_CATEGORIES, EXPENSE_CATEGORIES, ALL_CATEGORIES } = require('../constants/categories');

const getValidCategoriesForType = (type) => {
  if (type === 'income') return INCOME_CATEGORIES;
  if (type === 'expense') return EXPENSE_CATEGORIES;
  return ALL_CATEGORIES;
};

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ['income', 'expense'],
        message: 'Type must be either income or expense',
      },
      required: [true, 'Transaction type is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      validate: {
        validator(value) {
          const type = this.type;
          if (!type) return ALL_CATEGORIES.includes(value);
          return getValidCategoriesForType(type).includes(value);
        },
        message: 'The selected category is invalid for the selected transaction type',
      },
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

transactionSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
