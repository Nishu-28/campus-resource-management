import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineXMark } from 'react-icons/hi2';

export default function ManageBuildings() {
  const [buildings, setBuildings] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [buildingForm, setBuildingForm] = useState({ building_name: '', building_code: '', address: '', num_floors: '' });
  const [deptForm, setDeptForm] = useState({ dept_name: '', dept_code: '', building_id: '', floor_number: '', hod_id: '', contact_email: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/buildings'),
      api.get('/departments'),
      api.get('/users'),
    ])
      .then(([b, d, u]) => {
        setBuildings(b.data);
        setDepartments(d.data);
        setUsers(u.data);
      })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  };

  const handleAddBuilding = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/buildings', { ...buildingForm, num_floors: parseInt(buildingForm.num_floors) || 0 });
      toast.success('Building added');
      setShowBuildingModal(false);
      setBuildingForm({ building_name: '', building_code: '', address: '', num_floors: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add building');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddDept = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/departments', {
        ...deptForm,
        floor_number: parseInt(deptForm.floor_number) || null,
      });
      toast.success('Department added');
      setShowDeptModal(false);
      setDeptForm({ dept_name: '', dept_code: '', building_id: '', floor_number: '', hod_id: '', contact_email: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add department');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div className="space-y-8">
      {/* Buildings Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Buildings</h1>
          <button onClick={() => setShowBuildingModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
            <HiOutlinePlus className="w-4 h-4" /> Add Building
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Code</th>
                <th className="px-5 py-3 font-medium">Address</th>
                <th className="px-5 py-3 font-medium">Floors</th>
              </tr>
            </thead>
            <tbody>
              {buildings.length === 0 ? (
                <tr><td colSpan="4" className="px-5 py-8 text-center text-gray-500">No buildings found.</td></tr>
              ) : buildings.map(b => (
                <tr key={b.building_id} className="border-b last:border-0">
                  <td className="px-5 py-3 font-medium text-gray-900">{b.building_name}</td>
                  <td className="px-5 py-3 text-gray-600">{b.building_code}</td>
                  <td className="px-5 py-3 text-gray-600">{b.address || '-'}</td>
                  <td className="px-5 py-3 text-gray-600">{b.num_floors}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Departments Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Departments</h2>
          <button onClick={() => setShowDeptModal(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
            <HiOutlinePlus className="w-4 h-4" /> Add Department
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Code</th>
                <th className="px-5 py-3 font-medium">Building</th>
                <th className="px-5 py-3 font-medium">Floor</th>
                <th className="px-5 py-3 font-medium">HOD</th>
                <th className="px-5 py-3 font-medium">Email</th>
              </tr>
            </thead>
            <tbody>
              {departments.length === 0 ? (
                <tr><td colSpan="6" className="px-5 py-8 text-center text-gray-500">No departments found.</td></tr>
              ) : departments.map(d => (
                <tr key={d.department_id} className="border-b last:border-0">
                  <td className="px-5 py-3 font-medium text-gray-900">{d.dept_name}</td>
                  <td className="px-5 py-3 text-gray-600">{d.dept_code}</td>
                  <td className="px-5 py-3 text-gray-600">{d.building_name || '-'}</td>
                  <td className="px-5 py-3 text-gray-600">{d.floor_number ?? '-'}</td>
                  <td className="px-5 py-3 text-gray-600">{d.hod_name || '-'}</td>
                  <td className="px-5 py-3 text-gray-600">{d.contact_email || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Building Modal */}
      {showBuildingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Add Building</h2>
              <button onClick={() => setShowBuildingModal(false)} className="p-1 hover:bg-gray-100 rounded"><HiOutlineXMark className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddBuilding} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Building Name</label>
                <input required value={buildingForm.building_name} onChange={e => setBuildingForm({ ...buildingForm, building_name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Building Code</label>
                <input required value={buildingForm.building_code} onChange={e => setBuildingForm({ ...buildingForm, building_code: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input value={buildingForm.address} onChange={e => setBuildingForm({ ...buildingForm, address: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Floors</label>
                <input required type="number" min="1" value={buildingForm.num_floors} onChange={e => setBuildingForm({ ...buildingForm, num_floors: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">{submitting ? 'Adding...' : 'Add Building'}</button>
                <button type="button" onClick={() => setShowBuildingModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Department Modal */}
      {showDeptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Add Department</h2>
              <button onClick={() => setShowDeptModal(false)} className="p-1 hover:bg-gray-100 rounded"><HiOutlineXMark className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddDept} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Name</label>
                <input required value={deptForm.dept_name} onChange={e => setDeptForm({ ...deptForm, dept_name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department Code</label>
                <input required value={deptForm.dept_code} onChange={e => setDeptForm({ ...deptForm, dept_code: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Building</label>
                <select value={deptForm.building_id} onChange={e => setDeptForm({ ...deptForm, building_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm">
                  <option value="">Select building</option>
                  {buildings.map(b => <option key={b.building_id} value={b.building_id}>{b.building_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
                <input type="number" min="0" value={deptForm.floor_number} onChange={e => setDeptForm({ ...deptForm, floor_number: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">HOD</label>
                <select value={deptForm.hod_id} onChange={e => setDeptForm({ ...deptForm, hod_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm">
                  <option value="">Select HOD</option>
                  {users.map(u => <option key={u.user_id} value={u.user_id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                <input type="email" value={deptForm.contact_email} onChange={e => setDeptForm({ ...deptForm, contact_email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">{submitting ? 'Adding...' : 'Add Department'}</button>
                <button type="button" onClick={() => setShowDeptModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
