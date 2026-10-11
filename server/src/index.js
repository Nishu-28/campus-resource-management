require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { authenticate } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const resourceRoutes = require('./routes/resources');
const bookingRoutes = require('./routes/bookings');
const approvalRoutes = require('./routes/approvals');
const notificationRoutes = require('./routes/notifications');
const maintenanceRoutes = require('./routes/maintenance');
const waitlistRoutes = require('./routes/waitlist');
const usageLogRoutes = require('./routes/usageLogs');
const userRoutes = require('./routes/users');
const buildingRoutes = require('./routes/buildings');
const departmentRoutes = require('./routes/departments');
const auditLogRoutes = require('./routes/auditLogs');
const roleRoutes = require('./routes/roles');
const timeSlotRoutes = require('./routes/timeSlots');
const academicTermRoutes = require('./routes/academicTerms');
const holidayRoutes = require('./routes/holidays');
const resourcePolicyRoutes = require('./routes/resourcePolicies');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', authenticate, dashboardRoutes);
app.use('/api/resources', authenticate, resourceRoutes);
app.use('/api/bookings', authenticate, bookingRoutes);
app.use('/api/approvals', authenticate, approvalRoutes);
app.use('/api/notifications', authenticate, notificationRoutes);
app.use('/api/maintenance', authenticate, maintenanceRoutes);
app.use('/api/waitlist', authenticate, waitlistRoutes);
app.use('/api/usage-logs', authenticate, usageLogRoutes);
app.use('/api/users', authenticate, userRoutes);
app.use('/api/buildings', authenticate, buildingRoutes);
app.use('/api/departments', authenticate, departmentRoutes);
app.use('/api/audit-logs', authenticate, auditLogRoutes);
app.use('/api/roles', authenticate, roleRoutes);
app.use('/api/time-slots', authenticate, timeSlotRoutes);
app.use('/api/academic-terms', authenticate, academicTermRoutes);
app.use('/api/holidays', authenticate, holidayRoutes);
app.use('/api/resource-policies', authenticate, resourcePolicyRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
