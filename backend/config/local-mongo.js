/**
 * Mock MongoDB functionality for development without a real MongoDB connection
 * 
 * This is a simple in-memory data store that mimics basic MongoDB operations
 * for development and testing purposes when a real MongoDB connection is not available.
 */

// In-memory database collections
const db = {
  users: [],
  cases: [],
  documents: [],
  hearings: [],
  notifications: []
};

// Generate a simple ObjectId
const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Export mock methods
module.exports = {
  // Check if the mock is active
  isMockActive: true,
  
  // Create a document
  create: (collection, document) => {
    const newDoc = { ...document, _id: generateId(), createdAt: new Date() };
    db[collection].push(newDoc);
    return Promise.resolve(newDoc);
  },
  
  // Find documents
  find: (collection, query = {}) => {
    // Very simplistic query matching
    let results = db[collection];
    
    // Apply basic filtering if query has properties
    if (Object.keys(query).length > 0) {
      results = results.filter(doc => {
        return Object.keys(query).every(key => {
          if (typeof query[key] === 'object' && query[key] !== null) {
            // Handle special query operators like $in
            if (query[key].$in && Array.isArray(query[key].$in)) {
              return query[key].$in.includes(doc[key]);
            }
          }
          return doc[key] === query[key];
        });
      });
    }
    
    return Promise.resolve(results);
  },
  
  // Find one document
  findOne: (collection, query = {}) => {
    const results = db[collection].filter(doc => {
      return Object.keys(query).every(key => doc[key] === query[key]);
    });
    
    return Promise.resolve(results[0] || null);
  },
  
  // Find by ID
  findById: (collection, id) => {
    const doc = db[collection].find(doc => doc._id === id);
    return Promise.resolve(doc || null);
  },
  
  // Update a document
  update: (collection, id, updates) => {
    const index = db[collection].findIndex(doc => doc._id === id);
    if (index !== -1) {
      db[collection][index] = { ...db[collection][index], ...updates, updatedAt: new Date() };
      return Promise.resolve(db[collection][index]);
    }
    return Promise.resolve(null);
  },
  
  // Delete a document
  delete: (collection, id) => {
    const index = db[collection].findIndex(doc => doc._id === id);
    if (index !== -1) {
      const deleted = db[collection].splice(index, 1)[0];
      return Promise.resolve(deleted);
    }
    return Promise.resolve(null);
  },
  
  // Count documents
  count: (collection) => {
    return Promise.resolve(db[collection].length);
  }
}; 