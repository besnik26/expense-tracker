const Transaction = require("../models/Transaction");

const now = new Date();

const sixMonthsAgo = new Date(
  now.getFullYear(),
  now.getMonth() - 5,
  1
);



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
      Transaction.aggregate([
        {
          $match: {
          userId,
          date:{
            $gte:sixMonthsAgo,
            $lt: now
          }
        }},
        {
          $group:{
            _id: {
              $dateTrunc:{
                date:"$date",
                unit:"month",
                timezone: "Europe/Belgrade"
              }
            },
            totalIncome: {
              $sum: {
                $cond: [{$eq: ['$type', 'income']}, '$amount', 0]
              }
            },
            totalExpenses: {
              $sum:{
                $cond: [{$eq: ['$type', 'expense']}, '$amount', 0]
              }
            }   
          }
        },
        {
          $sort:{
            _id: 1
          }
        }

      ]),

      Transaction.aggregate([
        {
          $match:{
            userId,
            type:'expense',
            date:{
              $gte:sixMonthsAgo,
              $lt: now,
            }
          }
        },
        {
          $group:{
            _id:"$category",
            totalSpent:{$sum:'$amount'}
          }
        },
        {
          $sort:{
            totalSpent:-1
          }
        }
      ]),

      Transaction.aggregate([
        {
          $match:{
            userId,
            date:{
              $gte:sixMonthsAgo,
              $lt: now
            }
          }
        },
        {
          $group:{
            _id:{
              $dateTrunc:{
                date:"$date",
                unit:"month",
                timezone: "Europe/Belgrade"
              }
            },
            totalIncome: {
              $sum: {
                $cond: [{$eq: ['$type', 'income']}, '$amount', 0]
              }
            },
            totalExpenses: {
              $sum:{
                $cond: [{$eq: ['$type', 'expense']}, '$amount', 0]
              }
            }

          }
        },
        {
           $project: {
            _id: 1,
            netSavings: {
              $subtract: ["$totalIncome", "$totalExpenses"]
            }
          }
        },
        {
          $sort:{
            _id:1
          }
        }
        
      ])




    ]);

    const summary = totals[0] || { totalIncome: 0, totalExpenses: 0 };


    const months = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(date);
    }

    // Fill missing months
    const monthlyAnalytics = months.map((month) => {
      const result = monthlyResults.find(
        (item) =>
          item._id.getFullYear() === month.getFullYear() &&
          item._id.getMonth() === month.getMonth()
      );

      return {
        month: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`,
        totalIncome: result ? result.totalIncome : 0,
        totalExpenses: result ? result.totalExpenses : 0,
      };
    });


    //Expense Breakdown code
    const expenseAnalytics = () =>{
      const grandTotal = expenseBreakdown.reduce((transformedValue,value)=>{
         return transformedValue + value.totalSpent
      }, 0)

      const breakdownPercentage =  expenseBreakdown.map((value)=>{
        const percentage = grandTotal === 0 ? 0 : (value.totalSpent / grandTotal) * 100;


        return {
          ...value,
          percentage
        }
      })

      return breakdownPercentage;
    }


    const expenseBreakdownAnalytics = expenseAnalytics();


    //saving trend codee

    const getMonthKey = (date) => {
      const parts = new Intl.DateTimeFormat("en", {
        timeZone: "Europe/Belgrade",
        year: "numeric",
        month: "2-digit"
      }).formatToParts(date);

      const year = parts.find(p => p.type === "year").value;
      const month = parts.find(p => p.type === "month").value;

      return `${year}-${month}`;
    };

    const currentParts = getMonthKey(now).split("-");

    const year = Number(currentParts[0]);
    const savingMonth = Number(currentParts[1]) - 1;

    const savingMonths = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(Date.UTC(year, savingMonth - i, 1));

      savingMonths.push(getMonthKey(date));
    }


    const resultsMap = new Map(
      savingTrend.map(item => [
        getMonthKey(item._id),
        item.netSavings
      ])
    );

    const savingTrendAnalytics = savingMonths.map(month => ({
      month,
      netSavings: resultsMap.get(month) ?? 0
    }));

    return res.status(200).json({
      success: true,
      data: {
        totalIncome: summary.totalIncome || 0,
        totalExpenses: summary.totalExpenses || 0,
        totalBalance: (summary.totalIncome || 0) - (summary.totalExpenses || 0),
        monthlyAnalytics,
        expenseBreakdownAnalytics,
        savingTrendAnalytics
      },
    });
    
  } catch (error) {
    next(error);
  }
};

module.exports = { getAnalytics };
