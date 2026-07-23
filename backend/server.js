const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// In-memory data store for testing
// structure: { 'contacts': { id: { ...data } }, 'visits': { id: { ...data } } }
const dataStore = {};

// POST /api/sync
// Receives an array of sync items.
// Each item should have:
// { id, operation: 'create'|'update'|'delete', storeName: 'contacts'|'visits', data: {...}, timestamp: ISOString }
app.post('/api/sync', (req, res) => {
  const syncItems = req.body;
  if (!Array.isArray(syncItems)) {
    return res.status(400).json({ error: 'Payload must be an array' });
  }

  const results = {
    success: [],
    errors: []
  };

  syncItems.forEach(item => {
    try {
      const { id, operation, storeName, data, timestamp } = item;

      if (!id || !operation || !storeName) {
        throw new Error('Missing required fields: id, operation, or storeName');
      }

      if (!dataStore[storeName]) {
        dataStore[storeName] = {};
      }

      const store = dataStore[storeName];
      const existingRecord = store[id];
      const incomingTime = timestamp ? new Date(timestamp).getTime() : 0;
      const existingTime = existingRecord && existingRecord.timestamp ? new Date(existingRecord.timestamp).getTime() : 0;

      if (operation === 'create') {
        if (existingRecord) {
           // Handle case where client tries to create an existing record.
           // Maybe it's a retry of a successful sync. Just update if newer.
           if (incomingTime >= existingTime) {
              store[id] = { ...data, id, timestamp };
           }
        } else {
           store[id] = { ...data, id, timestamp };
        }
      } else if (operation === 'update') {
        if (existingRecord) {
          if (incomingTime >= existingTime) {
            store[id] = { ...existingRecord, ...data, id, timestamp };
          } else {
            // Offline edge case: Reject stale update
            console.log(`Ignoring stale update for ${storeName}/${id}`);
          }
        } else {
          // If update for non-existent record, create it
          store[id] = { ...data, id, timestamp };
        }
      } else if (operation === 'delete') {
         if (existingRecord) {
            if (incomingTime >= existingTime) {
                delete store[id];
            } else {
                 console.log(`Ignoring stale delete for ${storeName}/${id}`);
            }
         }
      } else {
         throw new Error(`Unknown operation: ${operation}`);
      }

      results.success.push({ id, status: 'synced' });
    } catch (error) {
      results.errors.push({ id: item.id || 'unknown', error: error.message });
    }
  });

  if (results.errors.length > 0) {
    return res.status(207).json(results);
  }

  return res.status(200).json(results);
});

// Helper route to reset datastore (useful for tests)
app.post('/api/reset', (req, res) => {
    Object.keys(dataStore).forEach(key => delete dataStore[key]);
    res.status(200).send('Reset');
});

app.get('/api/data/:storeName', (req, res) => {
    const store = dataStore[req.params.storeName] || {};
    res.json(Object.values(store));
});

module.exports = app;
