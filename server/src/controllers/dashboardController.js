const prisma = require('../lib/prisma');

function formatDate(d) {
  if (!d) return null;
  const dt = new Date(d);
  return dt.toISOString().slice(0, 10);
}

function formatTime(t) {
  if (!t) return null;
  const dt = new Date(t);
  return dt.toISOString().slice(11, 16);
}

// Helper to convert BigInt values from raw queries to Number
function serializeBigInts(data) {
  return JSON.parse(JSON.stringify(data, (_, v) => typeof v === 'bigint' ? Number(v) : v));
}

exports.getStats = async (req, res) => {
  try {
    const user = req.user;
    const isAdmin = user.role_name === 'Admin';
    const isHOD = user.role_name === 'HOD';

    // Date boundaries for "today"
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Base booking filter for role-based scoping
    const bookingWhere = isAdmin ? {} : isHOD ? { user: { dept_id: user.dept_id } } : { user_id: user.user_id };

    // --- Core stats (existing) ---
    const [totalBookings, availableResources, pendingApprovals, activeUsers, recentBookings] =
      await Promise.all([
        prisma.booking.count({ where: bookingWhere }),
        prisma.resource.count({ where: { status: 'Available' } }),
        prisma.booking.count({ where: { ...bookingWhere, booking_status: 'Pending' } }),
        isAdmin ? prisma.user.count({ where: { is_active: true } }) : Promise.resolve(null),
        prisma.booking.findMany({
          take: 10,
          orderBy: { created_at: 'desc' },
          where: bookingWhere,
          include: {
            resource: { select: { resource_name: true } },
            user: { select: { name: true } },
          },
        }),
      ]);

    const formattedBookings = recentBookings.map((b) => ({
      booking_id: b.booking_id,
      resource_name: b.resource.resource_name,
      booked_by: b.user.name,
      booking_date: formatDate(b.booking_date),
      start_time: formatTime(b.start_time),
      end_time: formatTime(b.end_time),
      booking_status: b.booking_status,
    }));

    // --- a) Bookings by status ---
    const bookingsByStatusRaw = await prisma.booking.groupBy({
      by: ['booking_status'],
      _count: { booking_id: true },
      where: bookingWhere,
    });
    const bookingsByStatus = bookingsByStatusRaw.map((s) => ({
      status: s.booking_status,
      count: s._count.booking_id,
    }));

    // --- b) Top 5 most booked resources ---
    const topResourcesRaw = await prisma.booking.groupBy({
      by: ['resource_id'],
      _count: { booking_id: true },
      orderBy: { _count: { booking_id: 'desc' } },
      take: 5,
      where: bookingWhere,
    });
    const resourceIds = topResourcesRaw.map((r) => r.resource_id);
    const resourceNames = await prisma.resource.findMany({
      where: { resource_id: { in: resourceIds } },
      select: { resource_id: true, resource_name: true },
    });
    const nameMap = Object.fromEntries(resourceNames.map((r) => [r.resource_id, r.resource_name]));
    const topResources = topResourcesRaw.map((r) => ({
      resource_id: r.resource_id,
      resource_name: nameMap[r.resource_id] || 'Unknown',
      count: r._count.booking_id,
    }));

    // --- c) Department-wise booking stats (Admin/HOD only) ---
    let deptStats = [];
    if (isAdmin) {
      const raw = await prisma.$queryRaw`
        SELECT d.dept_name, COUNT(b.booking_id) as total_bookings,
          SUM(CASE WHEN b.booking_status = 'Approved' THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN b.booking_status = 'Pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN b.booking_status = 'Rejected' THEN 1 ELSE 0 END) as rejected
        FROM department d
        LEFT JOIN user u ON d.dept_id = u.dept_id
        LEFT JOIN booking b ON u.user_id = b.user_id
        GROUP BY d.dept_name
        ORDER BY total_bookings DESC
      `;
      deptStats = serializeBigInts(raw);
    } else if (isHOD) {
      const raw = await prisma.$queryRaw`
        SELECT d.dept_name, COUNT(b.booking_id) as total_bookings,
          SUM(CASE WHEN b.booking_status = 'Approved' THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN b.booking_status = 'Pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN b.booking_status = 'Rejected' THEN 1 ELSE 0 END) as rejected
        FROM department d
        LEFT JOIN user u ON d.dept_id = u.dept_id
        LEFT JOIN booking b ON u.user_id = b.user_id
        WHERE d.dept_id = ${user.dept_id}
        GROUP BY d.dept_name
      `;
      deptStats = serializeBigInts(raw);
    }

    // --- d) Today's bookings count ---
    const todayBookings = await prisma.booking.count({
      where: {
        ...bookingWhere,
        booking_date: { gte: today, lt: tomorrow },
        booking_status: 'Approved',
      },
    });

    // --- e) Maintenance summary ---
    const maintenanceStatsRaw = await prisma.maintenance_log.groupBy({
      by: ['status'],
      _count: { maintenance_id: true },
    });
    const maintenanceStats = maintenanceStatsRaw.map((m) => ({
      status: m.status,
      count: m._count.maintenance_id,
    }));

    // --- f) Upcoming bookings for today ---
    const upcomingTodayBookings = await prisma.booking.findMany({
      where: {
        ...bookingWhere,
        booking_date: { gte: today, lt: tomorrow },
        booking_status: 'Approved',
      },
      take: 10,
      orderBy: { start_time: 'asc' },
      include: {
        resource: { select: { resource_name: true } },
        user: { select: { name: true } },
      },
    });
    const upcomingToday = upcomingTodayBookings.map((b) => ({
      booking_id: b.booking_id,
      resource_name: b.resource.resource_name,
      booked_by: b.user.name,
      start_time: formatTime(b.start_time),
      end_time: formatTime(b.end_time),
      purpose: b.purpose,
    }));

    res.json({
      totalBookings,
      availableResources,
      pendingApprovals,
      activeUsers,
      recentBookings: formattedBookings,
      bookingsByStatus,
      topResources,
      deptStats,
      todayBookings,
      maintenanceStats,
      upcomingToday,
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard stats.' });
  }
};
