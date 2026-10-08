const Transaction = require('../models/Transaction');

const buildFilter = (req) => {
  const filter = { userId: req.user._id };

  if (req.query.month) {
    const [year, month] = req.query.month.split('-').map(Number);
    if (year && month) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 1);
      filter.date = { $gte: start, $lt: end };
    }
  }

  if (req.query.category) {
    filter.category = req.query.category;
  }

  if (req.query.type) {
    filter.type = req.query.type;
  }

  return filter;
};

const createTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.create({
      ...req.body,
      userId: req.user._id,
    });

    return res.status(201).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

const getTransactions = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = buildFilter(req);

    const [transactions, totalItems] = await Promise.all([
      Transaction.find(filter)
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: page,
          limit,
          totalItems,
          totalPages,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

const getTransactionById = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

const updateTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    Object.assign(transaction, req.body);
    await transaction.save();

    return res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    next(error);
  }
};

const deleteTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
      data: { id: req.params.id },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
};
