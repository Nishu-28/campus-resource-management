const prisma = require('../lib/prisma');

function formatDate(d) {
  if (!d) return null;
  return new Date(d).toISOString().slice(0, 10);
}

function formatTime(t) {
  if (!t) return null;
  return new Date(t).toISOString().slice(11, 16);
}

exports.listApprovedBookings = async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: {
        user_id: req.user.user_id,
        booking_status: 'Approved',
        usage_log: { none: {} },
      },
      include: {
        resource: { select: { resource_name: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    const result = bookings.map((b) => ({
      booking_id: b.booking_id,
      resource_id: b.resource_id,
      resource_name: b.resource.resource_name,
      booking_date: formatDate(b.booking_date),
      start_time: formatTime(b.start_time),
      end_time: formatTime(b.end_time),
      purpose: b.purpose,
      attendee_count: b.attendee_count,
    }));

    res.json(result);
  } catch (err) {
    console.error('List approved bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch approved bookings.' });
  }
};

exports.listBookings = async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};

    if (req.user.role_name !== 'Admin') {
      where.user_id = req.user.user_id;
    }
    if (status) {
      where.booking_status = status;
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        resource: { select: { resource_name: true } },
        user: { select: { name: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    const result = bookings.map((b) => ({
      booking_id: b.booking_id,
      user_id: b.user_id,
      resource_id: b.resource_id,
      resource_name: b.resource.resource_name,
      booked_by: b.user.name,
      booking_date: formatDate(b.booking_date),
      start_time: formatTime(b.start_time),
      end_time: formatTime(b.end_time),
      purpose: b.purpose,
      attendee_count: b.attendee_count,
      booking_status: b.booking_status,
      is_recurring: b.is_recurring,
      created_at: b.created_at,
    }));

    res.json(result);
  } catch (err) {
    console.error('List bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings.' });
  }
};

exports.createBooking = async (req, res) => {
  try {
    const { resource_id, booking_date, start_time, end_time, purpose, attendee_count, slot_id } =
      req.body;
    const userId = req.user.user_id;

    // Validate resource exists and check capacity
    const resource = await prisma.resource.findUnique({
      where: { resource_id: parseInt(resource_id) },
    });
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found.' });
    }
    if (resource.status !== 'Available') {
      return res.status(400).json({ error: 'Resource is not available.' });
    }
    if (resource.capacity && attendee_count > resource.capacity) {
      return res
        .status(400)
        .json({ error: `Attendee count exceeds capacity of ${resource.capacity}.` });
    }

    // --- Department access control ---
    const accessEntries = await prisma.department_resource_access.findMany({
      where: { resource_id: parseInt(resource_id) },
    });
    if (accessEntries.length > 0) {
      const allowedDepts = accessEntries.map((a) => a.dept_id);
      if (!allowedDepts.includes(req.user.dept_id)) {
        return res
          .status(403)
          .json({ error: 'Your department does not have access to this resource' });
      }
    }

    // --- Resource policy enforcement ---
    const policy = await prisma.resource_policy.findFirst({
      where: { category_id: resource.category_id },
    });

    if (policy) {
      // Max duration check
      if (policy.max_duration_hrs) {
        const startCheck = new Date(`1970-01-01T${start_time}:00Z`);
        const endCheck = new Date(`1970-01-01T${end_time}:00Z`);
        const durationHrs = (endCheck - startCheck) / (1000 * 60 * 60);
        if (durationHrs > policy.max_duration_hrs) {
          return res.status(400).json({
            error: `Booking duration exceeds maximum allowed ${policy.max_duration_hrs} hours for this resource category`,
          });
        }
      }

      // Advance booking check
      if (policy.advance_booking_days) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const bookDate = new Date(booking_date);
        bookDate.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((bookDate - today) / (1000 * 60 * 60 * 24));
        if (diffDays > policy.advance_booking_days) {
          return res.status(400).json({
            error: `Bookings for this resource can only be made ${policy.advance_booking_days} days in advance`,
          });
        }
      }
    }

    // Check holiday calendar
    const holiday = await prisma.holiday_calendar.findUnique({
      where: { holiday_date: new Date(booking_date) },
    });
    if (holiday) {
      return res
        .status(400)
        .json({ error: `Cannot book on holiday: ${holiday.holiday_name}.` });
    }

    // Check for conflicts (overlapping time on same resource + date)
    const startDt = new Date(`1970-01-01T${start_time}:00Z`);
    const endDt = new Date(`1970-01-01T${end_time}:00Z`);

    const conflicts = await prisma.booking.findMany({
      where: {
        resource_id: parseInt(resource_id),
        booking_date: new Date(booking_date),
        booking_status: { in: ['Pending', 'Approved'] },
        start_time: { lt: endDt },
        end_time: { gt: startDt },
      },
    });

    if (conflicts.length > 0) {
      return res
        .status(409)
        .json({ error: 'Time slot conflicts with an existing booking.' });
    }

    // Determine booking status based on policy
    const bookingStatus = policy && !policy.requires_approval ? 'Approved' : 'Pending';

    const booking = await prisma.booking.create({
      data: {
        user_id: userId,
        resource_id: parseInt(resource_id),
        booking_date: new Date(booking_date),
        start_time: startDt,
        end_time: endDt,
        purpose: purpose || null,
        attendee_count: attendee_count || 1,
        slot_id: slot_id ? parseInt(slot_id) : null,
        booking_status: bookingStatus,
      },
    });

    res.status(201).json({
      ...booking,
      booking_date: formatDate(booking.booking_date),
      start_time: formatTime(booking.start_time),
      end_time: formatTime(booking.end_time),
    });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ error: 'Failed to create booking.' });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({
      where: { booking_id: parseInt(id) },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    if (booking.user_id !== req.user.user_id && req.user.role_name !== 'Admin') {
      return res.status(403).json({ error: 'You can only cancel your own bookings.' });
    }
    const terminalStates = ['Cancelled', 'Rejected', 'Completed'];
    if (terminalStates.includes(booking.booking_status)) {
      return res.status(400).json({ error: `Cannot cancel booking with status: ${booking.booking_status}` });
    }

    // --- Cancellation policy enforcement ---
    const bookingResource = await prisma.resource.findUnique({
      where: { resource_id: booking.resource_id },
    });
    if (bookingResource) {
      const cancelPolicy = await prisma.resource_policy.findFirst({
        where: { category_id: bookingResource.category_id },
      });
      if (cancelPolicy && cancelPolicy.cancellation_hrs) {
        const bookingStart = new Date(
          `${new Date(booking.booking_date).toISOString().slice(0, 10)}T${new Date(booking.start_time).toISOString().slice(11, 19)}Z`
        );
        const now = new Date();
        const hoursUntilBooking = (bookingStart - now) / (1000 * 60 * 60);
        if (hoursUntilBooking < cancelPolicy.cancellation_hrs) {
          return res.status(400).json({
            error: `Cancellations must be made at least ${cancelPolicy.cancellation_hrs} hours before the booking`,
          });
        }
      }
    }

    const updated = await prisma.booking.update({
      where: { booking_id: parseInt(id) },
      data: { booking_status: 'Cancelled' },
    });

    res.json({
      ...updated,
      booking_date: formatDate(updated.booking_date),
      start_time: formatTime(updated.start_time),
      end_time: formatTime(updated.end_time),
    });
  } catch (err) {
    console.error('Cancel booking error:', err);
    res.status(500).json({ error: 'Failed to cancel booking.' });
  }
};

exports.createRecurringBooking = async (req, res) => {
  try {
    const {
      resource_id,
      start_time,
      end_time,
      purpose,
      attendee_count,
      recurrence_type,
      day_of_week,
      recur_start,
      recur_end,
    } = req.body;
    const userId = req.user.user_id;

    // Validate resource
    const resource = await prisma.resource.findUnique({
      where: { resource_id: parseInt(resource_id) },
    });
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found.' });
    }
    if (resource.status !== 'Available') {
      return res.status(400).json({ error: 'Resource is not available.' });
    }
    if (resource.capacity && attendee_count > resource.capacity) {
      return res
        .status(400)
        .json({ error: `Attendee count exceeds capacity of ${resource.capacity}.` });
    }

    // Generate dates based on recurrence pattern
    const dates = [];
    const startDate = new Date(recur_start);
    const endDate = new Date(recur_end);

    if (startDate > endDate) {
      return res.status(400).json({ error: 'Start date must be before end date.' });
    }

    const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

    if (recurrence_type === 'Daily') {
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d));
      }
    } else if (recurrence_type === 'Weekly' || recurrence_type === 'Biweekly') {
      if (!day_of_week || dayMap[day_of_week] === undefined) {
        return res.status(400).json({ error: 'day_of_week is required for Weekly/Biweekly recurrence.' });
      }
      const targetDay = dayMap[day_of_week];
      const step = recurrence_type === 'Biweekly' ? 14 : 7;
      let d = new Date(startDate);
      // Advance to first occurrence of the target day
      while (d.getDay() !== targetDay && d <= endDate) {
        d.setDate(d.getDate() + 1);
      }
      for (; d <= endDate; d.setDate(d.getDate() + step)) {
        dates.push(new Date(d));
      }
    } else if (recurrence_type === 'Monthly') {
      const dayOfMonth = startDate.getDate();
      for (let d = new Date(startDate); d <= endDate; ) {
        dates.push(new Date(d));
        d.setMonth(d.getMonth() + 1);
        d.setDate(dayOfMonth);
        // Handle months where the day doesn't exist (e.g. 31st)
        if (d.getDate() !== dayOfMonth) {
          d.setDate(0); // go to last day of previous month
        }
      }
    } else {
      return res.status(400).json({ error: 'Invalid recurrence_type.' });
    }

    if (dates.length === 0) {
      return res.status(400).json({ error: 'No dates generated for the given recurrence pattern.' });
    }

    // Fetch holidays in the date range
    const holidays = await prisma.holiday_calendar.findMany({
      where: {
        holiday_date: { gte: startDate, lte: endDate },
      },
    });
    const holidaySet = new Set(holidays.map((h) => h.holiday_date.toISOString().slice(0, 10)));

    const startDt = new Date(`1970-01-01T${start_time}:00Z`);
    const endDt = new Date(`1970-01-01T${end_time}:00Z`);

    const createdBookings = [];
    const skippedDates = [];

    // Use a transaction
    await prisma.$transaction(async (tx) => {
      for (const date of dates) {
        const dateStr = date.toISOString().slice(0, 10);

        // Skip holidays
        if (holidaySet.has(dateStr)) {
          skippedDates.push({ date: dateStr, reason: 'Holiday' });
          continue;
        }

        // Check for conflicts
        const conflicts = await tx.booking.findMany({
          where: {
            resource_id: parseInt(resource_id),
            booking_date: date,
            booking_status: { in: ['Pending', 'Approved'] },
            start_time: { lt: endDt },
            end_time: { gt: startDt },
          },
        });

        if (conflicts.length > 0) {
          skippedDates.push({ date: dateStr, reason: 'Conflict' });
          continue;
        }

        const booking = await tx.booking.create({
          data: {
            user_id: userId,
            resource_id: parseInt(resource_id),
            booking_date: date,
            start_time: startDt,
            end_time: endDt,
            purpose: purpose || null,
            attendee_count: attendee_count || 1,
            is_recurring: true,
          },
        });
        createdBookings.push(booking);
      }

      // Create recurring_pattern linked to the first booking
      if (createdBookings.length > 0) {
        await tx.recurring_pattern.create({
          data: {
            booking_id: createdBookings[0].booking_id,
            recurrence_type: recurrence_type,
            day_of_week: day_of_week || null,
            recur_start: startDate,
            recur_end: endDate,
          },
        });
      }
    });

    res.status(201).json({
      created: createdBookings.length,
      skipped: skippedDates.length,
      skipped_dates: skippedDates,
    });
  } catch (err) {
    console.error('Create recurring booking error:', err);
    res.status(500).json({ error: 'Failed to create recurring bookings.' });
  }
};

exports.getTimeSlots = async (req, res) => {
  try {
    const slots = await prisma.time_slot.findMany({
      where: { is_active: true },
      orderBy: { start_time: 'asc' },
    });

    const result = slots.map((s) => ({
      ...s,
      start_time: formatTime(s.start_time),
      end_time: formatTime(s.end_time),
    }));

    res.json(result);
  } catch (err) {
    console.error('Get time slots error:', err);
    res.status(500).json({ error: 'Failed to fetch time slots.' });
  }
};
