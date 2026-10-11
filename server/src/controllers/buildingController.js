const prisma = require('../lib/prisma');

exports.listBuildings = async (req, res) => {
  try {
    const buildings = await prisma.building.findMany({
      include: {
        _count: { select: { department: true } },
      },
      orderBy: { building_name: 'asc' },
    });

    const result = buildings.map((b) => ({
      building_id: b.building_id,
      building_name: b.building_name,
      building_code: b.building_code,
      address: b.address,
      total_floors: b.total_floors,
      created_at: b.created_at,
      department_count: b._count.department,
    }));

    res.json(result);
  } catch (err) {
    console.error('List buildings error:', err);
    res.status(500).json({ error: 'Failed to fetch buildings.' });
  }
};

exports.createBuilding = async (req, res) => {
  try {
    const { building_name, building_code, address, total_floors } = req.body;

    const building = await prisma.building.create({
      data: {
        building_name,
        building_code,
        address: address || null,
        total_floors: total_floors || 1,
      },
    });

    res.status(201).json(building);
  } catch (err) {
    console.error('Create building error:', err);
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Building code already exists.' });
    }
    res.status(500).json({ error: 'Failed to create building.' });
  }
};

exports.listDepartments = async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        building: { select: { building_name: true, building_code: true } },
      },
      orderBy: { dept_name: 'asc' },
    });

    res.json(departments);
  } catch (err) {
    console.error('List departments error:', err);
    res.status(500).json({ error: 'Failed to fetch departments.' });
  }
};

exports.createDepartment = async (req, res) => {
  try {
    const { dept_name, dept_code, building_id, floor_number, hod_name, contact_email } = req.body;

    const department = await prisma.department.create({
      data: {
        dept_name,
        dept_code,
        building_id: building_id ? parseInt(building_id) : null,
        floor_number: floor_number ? parseInt(floor_number) : null,
        hod_name: hod_name || null,
        contact_email: contact_email || null,
      },
    });

    res.status(201).json(department);
  } catch (err) {
    console.error('Create department error:', err);
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Department code already exists.' });
    }
    res.status(500).json({ error: 'Failed to create department.' });
  }
};

exports.updateBuilding = async (req, res) => {
  try {
    const { id } = req.params;
    const { building_name, building_code, address, total_floors } = req.body;

    const data = {};
    if (building_name !== undefined) data.building_name = building_name;
    if (building_code !== undefined) data.building_code = building_code;
    if (address !== undefined) data.address = address || null;
    if (total_floors !== undefined) data.total_floors = parseInt(total_floors);

    const building = await prisma.building.update({
      where: { building_id: parseInt(id) },
      data,
    });

    res.json(building);
  } catch (err) {
    console.error('Update building error:', err);
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Building not found.' });
    }
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Building code already exists.' });
    }
    res.status(500).json({ error: 'Failed to update building.' });
  }
};

exports.deleteBuilding = async (req, res) => {
  try {
    const { id } = req.params;
    const buildingId = parseInt(id);

    // Check if any resources or departments reference this building
    const [resourceCount, departmentCount] = await Promise.all([
      prisma.resource.count({ where: { building_id: buildingId } }),
      prisma.department.count({ where: { building_id: buildingId } }),
    ]);

    if (resourceCount > 0 || departmentCount > 0) {
      return res.status(400).json({
        error: `Cannot delete building. ${resourceCount} resource(s) and ${departmentCount} department(s) reference it.`,
      });
    }

    await prisma.building.delete({
      where: { building_id: buildingId },
    });

    res.json({ message: 'Building deleted successfully.' });
  } catch (err) {
    console.error('Delete building error:', err);
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Building not found.' });
    }
    res.status(500).json({ error: 'Failed to delete building.' });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { dept_name, dept_code, building_id, floor_number, hod_name, contact_email } = req.body;

    const data = {};
    if (dept_name !== undefined) data.dept_name = dept_name;
    if (dept_code !== undefined) data.dept_code = dept_code;
    if (building_id !== undefined) data.building_id = building_id ? parseInt(building_id) : null;
    if (floor_number !== undefined) data.floor_number = floor_number ? parseInt(floor_number) : null;
    if (hod_name !== undefined) data.hod_name = hod_name || null;
    if (contact_email !== undefined) data.contact_email = contact_email || null;

    const department = await prisma.department.update({
      where: { dept_id: parseInt(id) },
      data,
    });

    res.json(department);
  } catch (err) {
    console.error('Update department error:', err);
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Department not found.' });
    }
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Department code already exists.' });
    }
    res.status(500).json({ error: 'Failed to update department.' });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const deptId = parseInt(id);

    // Check if any users reference this department
    const userCount = await prisma.user.count({
      where: { dept_id: deptId },
    });

    if (userCount > 0) {
      return res.status(400).json({
        error: `Cannot delete department. ${userCount} user(s) reference it.`,
      });
    }

    await prisma.department.delete({
      where: { dept_id: deptId },
    });

    res.json({ message: 'Department deleted successfully.' });
  } catch (err) {
    console.error('Delete department error:', err);
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Department not found.' });
    }
    res.status(500).json({ error: 'Failed to delete department.' });
  }
};
