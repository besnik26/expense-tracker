const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Gift', 'Bonus', 'Investment', 'Other'];
const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health'];
const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];
const CATEGORIES = {
  income: INCOME_CATEGORIES,
  expense: EXPENSE_CATEGORIES,
};

module.exports = {
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  ALL_CATEGORIES,
  CATEGORIES,
};
