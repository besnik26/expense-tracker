const { CATEGORIES } = require('../constants/categories');

const getCategories = (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      categories: CATEGORIES,
    },
  });
};

module.exports = { getCategories };
