const prisma = require('../lib/prisma');

exports.listHolidays = async (req, res) => {
  try {
    const holidays = await prisma.holiday_calendar.findMany({
      include: {
        academic_term: { select: { term_id: true, term_name: true } },
      },
      orderBy: { holiday_date: 'asc' },
    });

    res.json(holidays);
  } catch (err) {
    console.error('List holidays error:', err);
    res.status(500).json({ error: 'Failed to fetch holidays.' });
  }
};

exports.createHoliday = async (req, res) => {
  try {
    const { holiday_name, holiday_date, term_id } = req.body;

    const holiday = await prisma.holiday_calendar.create({
      data: {
        holiday_name,
        holiday_date: new Date(holiday_date),
        term_id: term_id ? parseInt(term_id) : null,
      },
    });

    res.status(201).json(holiday);
  } catch (err) {
    console.error('Create holiday error:', err);
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'A holiday already exists on this date.' });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({ error: 'Referenced academic term does not exist.' });
    }
    res.status(500).json({ error: 'Failed to create holiday.' });
  }
};

exports.updateHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    const { holiday_name, holiday_date, term_id } = req.body;

    const data = {};
    if (holiday_name !== undefined) data.holiday_name = holiday_name;
    if (holiday_date !== undefined) data.holiday_date = new Date(holiday_date);
    if (term_id !== undefined) data.term_id = term_id ? parseInt(term_id) : null;

    const holiday = await prisma.holiday_calendar.update({
      where: { holiday_id: parseInt(id) },
      data,
    });

    res.json(holiday);
  } catch (err) {
    console.error('Update holiday error:', err);
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Holiday not found.' });
    }
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'A holiday already exists on this date.' });
    }
    res.status(500).json({ error: 'Failed to update holiday.' });
  }
};

exports.deleteHoliday = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.holiday_calendar.delete({
      where: { holiday_id: parseInt(id) },
    });

    res.json({ message: 'Holiday deleted successfully.' });
  } catch (err) {
    console.error('Delete holiday error:', err);
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Holiday not found.' });
    }
    res.status(500).json({ error: 'Failed to delete holiday.' });
  }
};
