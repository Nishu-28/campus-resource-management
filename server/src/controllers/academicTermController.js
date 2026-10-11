const prisma = require('../lib/prisma');

exports.listAcademicTerms = async (req, res) => {
  try {
    const terms = await prisma.academic_term.findMany({
      orderBy: { start_date: 'desc' },
    });

    res.json(terms);
  } catch (err) {
    console.error('List academic terms error:', err);
    res.status(500).json({ error: 'Failed to fetch academic terms.' });
  }
};

exports.createAcademicTerm = async (req, res) => {
  try {
    const { term_name, start_date, end_date, is_current } = req.body;

    const term = await prisma.academic_term.create({
      data: {
        term_name,
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        is_current: is_current !== undefined ? is_current : false,
      },
    });

    res.status(201).json(term);
  } catch (err) {
    console.error('Create academic term error:', err);
    res.status(500).json({ error: 'Failed to create academic term.' });
  }
};

exports.updateAcademicTerm = async (req, res) => {
  try {
    const { id } = req.params;
    const { term_name, start_date, end_date, is_current } = req.body;

    const data = {};
    if (term_name !== undefined) data.term_name = term_name;
    if (start_date !== undefined) data.start_date = new Date(start_date);
    if (end_date !== undefined) data.end_date = new Date(end_date);
    if (is_current !== undefined) data.is_current = is_current;

    const term = await prisma.academic_term.update({
      where: { term_id: parseInt(id) },
      data,
    });

    res.json(term);
  } catch (err) {
    console.error('Update academic term error:', err);
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Academic term not found.' });
    }
    res.status(500).json({ error: 'Failed to update academic term.' });
  }
};

exports.deleteAcademicTerm = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.academic_term.delete({
      where: { term_id: parseInt(id) },
    });

    res.json({ message: 'Academic term deleted successfully.' });
  } catch (err) {
    console.error('Delete academic term error:', err);
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Academic term not found.' });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({ error: 'Cannot delete term. Holidays reference it.' });
    }
    res.status(500).json({ error: 'Failed to delete academic term.' });
  }
};
