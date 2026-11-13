
const Transaction = require("../models/Transaction");

const TIMEZONE = "Europe/Belgrade";

const getDateRange = (months) => {
  const now = new Date();

  const startDate = new Date(
    now.getFullYear(),
    now.getMonth() - (months - 1),
    1
  );

  return { now, startDate };
};

const buildMonthlyTotalsPipeline = (
  userId,
  startDate,
  endDate,
  includeNetSavings = false
) => {
  const pipeline = [
    {
      $match: {
        userId,
        date: {
          $gte: startDate,
          $lt: endDate,
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

const buildMonthList = (referenceDate = new Date(), months = 6, useUTC = false) => {
  const year = useUTC
    ? referenceDate.getUTCFullYear()
    : referenceDate.getFullYear();

  const monthIndex = useUTC
    ? referenceDate.getUTCMonth()
    : referenceDate.getMonth();

  return Array.from({ length: months }, (_, index) => {
    const offset = months - 1 - index;

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

    const allowedMonths = [3, 6, 12];
    const requestedMonths = Number(req.query.months);

    const months = allowedMonths.includes(requestedMonths)
      ? requestedMonths
      : 6;

    const { now, startDate } = getDateRange(months);

    const [totals, monthlyResults, expenseBreakdown, savingTrend] =
      await Promise.all([
        Transaction.aggregate([
          {
            $match: {
              userId,
              date: {
                $gte: startDate,
                $lt: now,
              },
            },
          },
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

        Transaction.aggregate(
          buildMonthlyTotalsPipeline(userId, startDate, now)
        ),

        Transaction.aggregate([
          {
            $match: {
              userId,
              type: "expense",
              date: {
                $gte: startDate,
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

        Transaction.aggregate(
          buildMonthlyTotalsPipeline(userId, startDate, now, true)
        ),
      ]);

    const summary = totals[0] || {
      totalIncome: 0,
      totalExpenses: 0,
    };

    const monthList = buildMonthList(now, months);

    const monthlyResultsMap = new Map(
      monthlyResults.map((item) => [
        getMonthKey(item._id),
        item,
      ])
    );

    const monthlyAnalytics = monthList.map((month) => {
      const monthKey = getMonthKey(month);
      const result = monthlyResultsMap.get(monthKey);

      return {
        month: monthKey,
        totalIncome: result?.totalIncome ?? 0,
        totalExpenses: result?.totalExpenses ?? 0,
      };
    });

    const grandTotal = expenseBreakdown.reduce(
      (total, value) => total + value.totalSpent,
      0
    );

    const expenseBreakdownAnalytics = expenseBreakdown.map((value) => {
      const percentage =
        grandTotal === 0 ? 0 : (value.totalSpent / grandTotal) * 100;

      return {
        ...value,
        percentage,
      };
    });

    const resultsMap = new Map(
      savingTrend.map((item) => [
        getMonthKey(item._id),
        item.netSavings,
      ])
    );

    const savingTrendAnalytics = monthList.map((month) => {
      const monthKey = getMonthKey(month);

      return {
        month: monthKey,
        netSavings: resultsMap.get(monthKey) ?? 0,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        totalIncome: summary.totalIncome || 0,
        totalExpenses: summary.totalExpenses || 0,
        totalBalance:
          (summary.totalIncome || 0) - (summary.totalExpenses || 0),
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
