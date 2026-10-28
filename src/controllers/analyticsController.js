const Transaction = require("../models/Transaction");

const getAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [totals] = await Promise.all([
      Transaction.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            totalIncome: {
              $sum: {
                $cond: [{ $eq: ["$type", "income"] }, "$amount", 0],
              },
            },
            totalExpenses: {
              $sum: {
                $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0],
              },
            },
          },
        },
      ]),
    ]);

    const summary = totals[0] || { totalIncome: 0, totalExpenses: 0 };

    return res.status(200).json({
      success: true,
      data: {
        totalIncome: summary.totalIncome || 0,
        totalExpenses: summary.totalExpenses || 0,
        totalBalance: (summary.totalIncome || 0) - (summary.totalExpenses || 0),
      },
    });
    
  } catch (error) {
    next(error);
  }
};

module.exports = { getAnalytics };
