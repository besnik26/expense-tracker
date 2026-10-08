const app = require('./src/app');
const {connectDB} = require('./src/config/db');
const { PORT } = require('./src/config/dotenv');

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
