/**
 * @file auth.test.js
 * Integration tests for authentication routes
 */
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';

// Generate a unique email for every test run
const testEmail = `jest_auth_test_${Date.now()}@example.com`;
const testPassword = '12345678'; // At least 8 characters
const testName = 'Jest Test';

describe('🔐 Auth Routes', () => {
  beforeAll(async () => {
    if (!process.env.MONGO_URI) throw new Error('Missing MONGO_URI in .env');
    await mongoose.connect(process.env.MONGO_URI);
  });

  afterAll(async () => {
    // Cleanup test user and close DB
    if (mongoose.connection.db) {
      await mongoose.connection.db.collection('users').deleteOne({ email: testEmail });
      await mongoose.connection.close();
    }
  });

  test('Register with valid data should create a new user', async () => {
    const res = await request(app)
      .post('/register')
      .send({ name: testName, email: testEmail, password: testPassword });

    expect(res.statusCode).toBeLessThan(400);
    // Accept redirect to /home as valid, as well as login/success/registered
    expect(
      /login|success|registered|redirecting to/i.test(res.text)
    ).toBe(true);
  });

  test('Duplicate email should return an error message', async () => {
    const res = await request(app)
      .post('/register')
      .send({ name: testName, email: testEmail, password: testPassword });

    console.log('Duplicate test status:', res.statusCode);
    console.log('Duplicate test text snippet:', res.text?.substring(0, 300));
    expect(res.text).toMatch(/email.*exists/i);
  });
});