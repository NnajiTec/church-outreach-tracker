const request = require('supertest');
const app = require('../backend/server');

describe('POST /api/sync', () => {
  beforeEach(async () => {
    // Reset the datastore before each test
    await request(app).post('/api/reset');
  });

  it('should return 400 if payload is not an array', async () => {
    const res = await request(app)
      .post('/api/sync')
      .send({ id: '1', operation: 'create' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Payload must be an array');
  });

  it('should successfully process a create operation', async () => {
    const payload = [
      {
        id: 'contact1',
        operation: 'create',
        storeName: 'contacts',
        data: { name: 'John Doe', phone: '123456' },
        timestamp: new Date().toISOString()
      }
    ];

    const res = await request(app).post('/api/sync').send(payload);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toHaveLength(1);
    expect(res.body.success[0].id).toBe('contact1');
    expect(res.body.errors).toHaveLength(0);

    // Verify it's in the data store
    const dataRes = await request(app).get('/api/data/contacts');
    expect(dataRes.body).toHaveLength(1);
    expect(dataRes.body[0].name).toBe('John Doe');
  });

  it('should successfully process an update operation', async () => {
    // Setup initial data
    const initialTime = new Date('2024-01-01T10:00:00Z').toISOString();
    await request(app).post('/api/sync').send([
      {
        id: 'contact2',
        operation: 'create',
        storeName: 'contacts',
        data: { name: 'Jane Doe', status: 'new' },
        timestamp: initialTime
      }
    ]);

    // Perform update
    const updateTime = new Date('2024-01-01T11:00:00Z').toISOString();
    const updatePayload = [
      {
        id: 'contact2',
        operation: 'update',
        storeName: 'contacts',
        data: { status: 'visited' },
        timestamp: updateTime
      }
    ];

    const res = await request(app).post('/api/sync').send(updatePayload);
    expect(res.statusCode).toBe(200);

    // Verify update
    const dataRes = await request(app).get('/api/data/contacts');
    expect(dataRes.body[0].status).toBe('visited');
    expect(dataRes.body[0].name).toBe('Jane Doe'); // should preserve existing fields
  });

  it('should successfully process a delete operation', async () => {
    // Setup initial data
    const initialTime = new Date('2024-01-01T10:00:00Z').toISOString();
    await request(app).post('/api/sync').send([
      {
        id: 'contact3',
        operation: 'create',
        storeName: 'contacts',
        data: { name: 'Delete Me' },
        timestamp: initialTime
      }
    ]);

    // Perform delete
    const deleteTime = new Date('2024-01-01T11:00:00Z').toISOString();
    const deletePayload = [
      {
        id: 'contact3',
        operation: 'delete',
        storeName: 'contacts',
        timestamp: deleteTime
      }
    ];

    const res = await request(app).post('/api/sync').send(deletePayload);
    expect(res.statusCode).toBe(200);

    // Verify deletion
    const dataRes = await request(app).get('/api/data/contacts');
    expect(dataRes.body).toHaveLength(0);
  });

  it('should handle offline edge cases: reject stale updates', async () => {
    // 1. Initial creation (newer timestamp)
    const newTime = new Date('2024-01-02T10:00:00Z').toISOString();
    await request(app).post('/api/sync').send([
      {
        id: 'contact4',
        operation: 'create',
        storeName: 'contacts',
        data: { name: 'Latest Name' },
        timestamp: newTime
      }
    ]);

    // 2. Offline update comes in late (older timestamp)
    const oldTime = new Date('2024-01-01T10:00:00Z').toISOString();
    const stalePayload = [
      {
        id: 'contact4',
        operation: 'update',
        storeName: 'contacts',
        data: { name: 'Stale Name' },
        timestamp: oldTime
      }
    ];

    const res = await request(app).post('/api/sync').send(stalePayload);
    expect(res.statusCode).toBe(200); // the sync operation itself processed successfully
    expect(res.body.success).toHaveLength(1);

    // Verify it rejected the stale update
    const dataRes = await request(app).get('/api/data/contacts');
    expect(dataRes.body[0].name).toBe('Latest Name');
  });

  it('should return 207 Multi-Status for partial successes', async () => {
    const payload = [
      {
        id: 'contact5',
        operation: 'create',
        storeName: 'contacts',
        data: { name: 'Valid Contact' },
        timestamp: new Date().toISOString()
      },
      {
        id: 'invalid-contact',
        operation: 'create', // Missing storeName, should error
        data: { name: 'Invalid Contact' }
      }
    ];

    const res = await request(app).post('/api/sync').send(payload);

    expect(res.statusCode).toBe(207);
    expect(res.body.success).toHaveLength(1);
    expect(res.body.success[0].id).toBe('contact5');

    expect(res.body.errors).toHaveLength(1);
    expect(res.body.errors[0].id).toBe('invalid-contact');
    expect(res.body.errors[0].error).toMatch(/Missing required fields/);
  });
});
