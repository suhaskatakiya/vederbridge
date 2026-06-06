import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
import rfqRoutes from './routes/rfqRoutes.js';
import quotationRoutes from './routes/quotationRoutes.js';
import poRoutes from './routes/poRoutes.js';
import vendorRoutes from './routes/vendorRoutes.js';
import activityRoutes from './routes/activityRoutes.js';

dotenv.config();

const app = express();

// Enable CORS for frontend application
app.use(cors({
  origin: '*', // Allow all origins for the hackathon
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json());

// Log incoming requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Phase 1 Auth Routes (directly at root)
app.use('/', authRoutes);

// Phase 2, 3, 4 API Routes
app.use('/api/rfqs', rfqRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/po', poRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/activity-logs', activityRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'UP', timestamp: new Date().toISOString() });
});

// Custom 404 page / route handler
app.use((req, res, next) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(` VendorBridge Backend listening on port ${PORT}`);
  console.log(` Health check: http://localhost:${PORT}/health`);
  console.log(`========================================`);
});
