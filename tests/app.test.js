process.env.NODE_ENV = 'test';
process.env.USE_MEMORY_DB = 'true';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1h';

const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../src/app');
const { connectDB, stopMemoryDB } = require('../src/config/db');
const User = require('../src/models/User');
const Transaction = require('../src/models/Transaction');

const registerUser = async (payload = {}) => {
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      name: payload.name || 'Test User',
      email: payload.email || 'test@example.com',
      password: payload.password || 'secret123',
    });

  return response;
};

const loginUser = async (email, password) => {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password });

  return response;
};

beforeAll(async () => {
  await connectDB();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Transaction.deleteMany({});
});

afterAll(async () => {
  await stopMemoryDB();
});

describe('Expense Tracker API', () => {
  it('registers a user', async () => {
    const response = await registerUser({
      name: 'Alice Tester',
      email: 'alice@example.com',
      password: 'secret123',
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe('alice@example.com');
  });

  it('rejects duplicate email registration', async () => {
    await registerUser({
      name: 'Alice Tester',
      email: 'duplicate@example.com',
      password: 'secret123',
    });

    const response = await registerUser({
      name: 'Alice Again',
      email: 'duplicate@example.com',
      password: 'newsecret456',
    });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
  });

  it('hashes passwords and rejects invalid login', async () => {
    await registerUser({
      name: 'Hash User',
      email: 'hash@example.com',
      password: 'secret123',
    });

    const user = await User.findOne({ email: 'hash@example.com' });
    expect(user.password).not.toBe('secret123');
    expect(user.password).not.toBe('');

    const invalidLogin = await loginUser('hash@example.com', 'wrongpass');
    expect(invalidLogin.status).toBe(401);
    expect(invalidLogin.body.success).toBe(false);
  });

  it('logs in with correct credentials and returns a JWT', async () => {
    await registerUser({
      name: 'Login User',
      email: 'login@example.com',
      password: 'secret123',
    });

    const response = await loginUser('login@example.com', 'secret123');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeTruthy();
    expect(response.body.data.user.email).toBe('login@example.com');
  });

  it('rejects access to protected routes without a valid token', async () => {
    const response = await request(app).get('/api/dashboard');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it('creates a valid expense transaction', async () => {
    const registerResponse = await registerUser({
      name: 'Expense User',
      email: 'expense@example.com',
      password: 'secret123',
    });

    const loginResponse = await loginUser('expense@example.com', 'secret123');
    const token = loginResponse.body.data.token;

    const response = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'expense',
        amount: 25.5,
        category: 'Food',
        date: '2026-08-15',
        description: 'Lunch',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.type).toBe('expense');
    expect(response.body.data.category).toBe('Food');
  });

  it('creates a valid income transaction', async () => {
    const registerResponse = await registerUser({
      name: 'Income User',
      email: 'income@example.com',
      password: 'secret123',
    });

    const loginResponse = await loginUser('income@example.com', 'secret123');
    const token = loginResponse.body.data.token;

    const response = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'income',
        amount: 1250,
        category: 'Salary',
        date: '2026-08-15',
        description: 'Paycheck',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.type).toBe('income');
    expect(response.body.data.category).toBe('Salary');
  });

  it('rejects category values that do not match the selected transaction type', async () => {
    const registerResponse = await registerUser({
      name: 'Type Category User',
      email: 'type-category@example.com',
      password: 'secret123',
    });

    const loginResponse = await loginUser('type-category@example.com', 'secret123');
    const token = loginResponse.body.data.token;

    const response = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'income',
        amount: 1250,
        category: 'Food',
        date: '2026-08-15',
        description: 'Invalid income category',
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.errors[0].message).toMatch(/category|type/i);
  });

  it('validates transaction input and rejects invalid types and amounts', async () => {
    const registerResponse = await registerUser({
      name: 'Validation User',
      email: 'validation@example.com',
      password: 'secret123',
    });

    const loginResponse = await loginUser('validation@example.com', 'secret123');
    const token = loginResponse.body.data.token;

    const response = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'invalid',
        amount: 0,
        category: 'Food',
        date: '2026-08-15',
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('reads, filters, paginates, updates, and deletes transactions', async () => {
    const registerResponse = await registerUser({
      name: 'List User',
      email: 'list@example.com',
      password: 'secret123',
    });

    const loginResponse = await loginUser('list@example.com', 'secret123');
    const token = loginResponse.body.data.token;

    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'expense',
        amount: 25.5,
        category: 'Food',
        date: '2026-08-15',
        description: 'Lunch',
      });

    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'income',
        amount: 200,
        category: 'Salary',
        date: '2026-08-20',
        description: 'Paycheck',
      });

    const listResponse = await request(app)
      .get('/api/transactions?month=2026-08&type=expense&category=Food&page=1&limit=10')
      .set('Authorization', `Bearer ${token}`);

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.success).toBe(true);
    expect(listResponse.body.data.pagination.currentPage).toBe(1);
    expect(Array.isArray(listResponse.body.data.transactions)).toBe(true);

    const transactionId = listResponse.body.data.transactions[0]._id;

    const updateResponse = await request(app)
      .put(`/api/transactions/${transactionId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 40, description: 'Dinner' });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.amount).toBe(40);

    const dashboardResponse = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(dashboardResponse.status).toBe(200);
    expect(dashboardResponse.body.success).toBe(true);
    expect(dashboardResponse.body.data.totalIncome).toBeGreaterThanOrEqual(0);
    expect(dashboardResponse.body.data.totalExpenses).toBeGreaterThanOrEqual(0);
    expect(dashboardResponse.body.data.totalBalance).toBeDefined();
    expect(Array.isArray(dashboardResponse.body.data.recentTransactions)).toBe(true);

    const deleteResponse = await request(app)
      .delete(`/api/transactions/${transactionId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteResponse.status).toBe(200);
    expect(deleteResponse.body.success).toBe(true);
  });

  it('prevents unauthorized access to other users transactions', async () => {
    const firstUser = await registerUser({
      name: 'First User',
      email: 'first@example.com',
      password: 'secret123',
    });

    const secondUser = await registerUser({
      name: 'Second User',
      email: 'second@example.com',
      password: 'secret123',
    });

    const firstToken = (await loginUser('first@example.com', 'secret123')).body.data.token;
    const secondToken = (await loginUser('second@example.com', 'secret123')).body.data.token;

    const otherTransaction = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${firstToken}`)
      .send({
        type: 'income',
        amount: 500,
        category: 'Salary',
        date: '2026-08-20',
        description: 'Paycheck',
      });

    const response = await request(app)
      .get(`/api/transactions/${otherTransaction.body.data._id}`)
      .set('Authorization', `Bearer ${secondToken}`);

    expect(response.status).toBe(404);
  });

  it('returns category list and swagger docs endpoint', async () => {
    const registerResponse = await registerUser({
      name: 'Category User',
      email: 'categories@example.com',
      password: 'secret123',
    });

    const loginResponse = await loginUser('categories@example.com', 'secret123');
    const token = loginResponse.body.data.token;

    const categoriesResponse = await request(app)
      .get('/api/categories')
      .set('Authorization', `Bearer ${token}`);

    expect(categoriesResponse.status).toBe(200);
    expect(categoriesResponse.body.success).toBe(true);
    expect(categoriesResponse.body.data.categories).toHaveProperty('income');
    expect(categoriesResponse.body.data.categories).toHaveProperty('expense');
    expect(Array.isArray(categoriesResponse.body.data.categories.income)).toBe(true);
    expect(Array.isArray(categoriesResponse.body.data.categories.expense)).toBe(true);

    const docsResponse = await request(app).get('/api-docs/');
    expect(docsResponse.status).toBe(200);
  });
});
