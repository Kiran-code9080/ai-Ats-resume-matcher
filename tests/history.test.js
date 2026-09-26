/**
 * @file history.test.js
 * Integration tests for match history pagination
 */
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app.js';

// Generate a unique email for every test run
const testEmail = `jest_history_test_${Date.now()}@example.com`;
const testPassword = '12345678';

const agent = request.agent(app);

describe('📜 Match History Pagination', () => {
  beforeAll(async () => {
    // Connect to DB if not already connected
    if (mongoose.connection.readyState === 0) {
      if (!process.env.MONGO_URI) throw new Error('Missing MONGO_URI in .env');
      await mongoose.connect(process.env.MONGO_URI);
    }

    // Register user using agent (so session is set)
    const regRes = await agent
      .post('/register')
      .send({ name: 'Jest Test', email: testEmail, password: testPassword });
    console.log('Register status:', regRes.statusCode);
    console.log('Register text:', regRes.text);

    // No need to log in again if registration logs in the user
  });

  afterAll(async () => {
    // Clean up user after test
    if (mongoose.connection.db) {
      await mongoose.connection.db.collection('users').deleteOne({ email: testEmail });
      await mongoose.connection.close();
    }
  });

  test('should return first page of history', async () => {
    const res = await agent.get('/history?page=1');
    console.log('History status:', res.statusCode);
    console.log('History text:', res.text);
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Your Match History');
  });
});