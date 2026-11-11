const Transaction = require("../models/Transaction");

const now = new Date();
const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
const TIMEZONE = "Europe/Belgrade";

const buildMonthlyTotalsPipeline = (userId, includeNetSavings = false) => {
  const pipeline = [
    {
      $match: {
        userId,
        date: {
          $gte: sixMonthsAgo,
          $lt: now,
        },
      },
    },
    {
      $group: {
        _id: {
          $dateTrunc: {
            date: "$date",
            unit: "month",
            timezone: TIMEZONE,
          },
        },
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
  ];

  if (includeNetSavings) {
    pipeline.push({
      $project: {
        _id: 1,
        netSavings: {
          $subtract: ["$totalIncome", "$totalExpenses"],
        },
      },
    });
  }

  pipeline.push({ $sort: { _id: 1 } });

  return pipeline;
};

const buildMonthList = (referenceDate = now, useUTC = false) => {
  const year = useUTC ? referenceDate.getUTCFullYear() : referenceDate.getFullYear();
  const monthIndex = useUTC ? referenceDate.getUTCMonth() : referenceDate.getMonth();

  return Array.from({ length: 6 }, (_, index) => {
    const offset = 5 - index;
    const date = useUTC
      ? new Date(Date.UTC(year, monthIndex - offset, 1))
      : new Date(year, monthIndex - offset, 1);

    return date;
  });
};

const getMonthKey = (date) => {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year").value;
  const month = parts.find((part) => part.type === "month").value;

  return `${year}-${month}`;
};

const getAnalytics = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [totals, monthlyResults, expenseBreakdown, savingTrend] = await Promise.all([
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
      Transaction.aggregate(buildMonthlyTotalsPipeline(userId)),
      Transaction.aggregate([
        {
          $match: {
            userId,
            type: "expense",
            date: {
              $gte: sixMonthsAgo,
              $lt: now,
            },
          },
        },
        {
          $group: {
            _id: "$category",
            totalSpent: { $sum: "$amount" },
          },
        },
        {
          $sort: {
            totalSpent: -1,
          },
        },
      ]),
      Transaction.aggregate(buildMonthlyTotalsPipeline(userId, true)),
    ]);

    const summary = totals[0] || { totalIncome: 0, totalExpenses: 0 };
    const months = buildMonthList();

    const monthlyAnalytics = months.map((month) => {
      const result = monthlyResults.find(
        (item) =>
          item._id.getFullYear() === month.getFullYear() &&
          item._id.getMonth() === month.getMonth()
      );

      return {
        month: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`,
        totalIncome: result ? result.totalIncome : 0,
        totalExpenses: result ? result.totalExpenses : 0,
      };
    });

    const grandTotal = expenseBreakdown.reduce(
      (total, value) => total + value.totalSpent,
      0
    );

    const expenseBreakdownAnalytics = expenseBreakdown.map((value) => {
      const percentage = grandTotal === 0 ? 0 : (value.totalSpent / grandTotal) * 100;

      return {
        ...value,
        percentage,
      };
    });

    const currentParts = getMonthKey(now).split("-");
    const year = Number(currentParts[0]);
    const savingMonth = Number(currentParts[1]) - 1;
    const savingMonths = buildMonthList(new Date(Date.UTC(year, savingMonth, 1)), true).map((month) =>
      getMonthKey(month)
    );

    const resultsMap = new Map(
      savingTrend.map((item) => [getMonthKey(item._id), item.netSavings])
    );

    const savingTrendAnalytics = savingMonths.map((month) => ({
      month,
      netSavings: resultsMap.get(month) ?? 0,
    }));

    return res.status(200).json({
      success: true,
      data: {
        totalIncome: summary.totalIncome || 0,
        totalExpenses: summary.totalExpenses || 0,
        totalBalance: (summary.totalIncome || 0) - (summary.totalExpenses || 0),
        monthlyAnalytics,
        expenseBreakdownAnalytics,
        savingTrendAnalytics,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAnalytics };
