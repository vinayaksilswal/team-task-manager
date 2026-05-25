import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Briefcase, CheckCircle2, Clock, AlertCircle, AlertTriangle, 
  Calendar, LogOut, FileText, CheckCircle, ClipboardList 
} from 'lucide-react';

export default function MemberDashboard() {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null); // Filter tasks by project
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [projRes, tasksRes] = await Promise.all([
        api.get('/projects'),
        api.get('/tasks')
      ]);
      setProjects(projRes.data);
      setTasks(tasksRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (taskId, nextStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: nextStatus });
      // Update local task state immediately
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: nextStatus } : t));
    } catch (err) {
      console.error(err);
      setError('Failed to update task status.');
    }
  };

  const isOverdue = (dueDate, status) => {
    if (status === 'COMPLETED') return false;
    return new Date(dueDate) < new Date();
  };

  // Filter tasks
  const filteredTasks = selectedProjectId 
    ? tasks.filter(t => t.project_id === selectedProjectId)
    : tasks;

  // Stats
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'PENDING').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    completed: tasks.filter(t => t.status === 'COMPLETED').length
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary-500/20">
            TM
          </div>
          <div>
            <h1 className="text-xl font-bold">Workspace Portal</h1>
            <p className="text-xs text-slate-400">Team Member Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold">{user?.name}</p>
            <span className="inline-flex items-center rounded-full bg-emerald-400/10 px-2 py-0.5 text-xs font-medium text-emerald-400 ring-1 ring-inset ring-emerald-400/20">
              Member
            </span>
          </div>
          <button 
            onClick={logout}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition text-slate-300 hover:text-white"
            title="Log Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto overflow-y-auto">
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600">
            <AlertCircle className="shrink-0" size={18} />
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700 font-bold">×</button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><ClipboardList size={20} /></div>
            <div><p className="text-xs text-slate-400">My Tasks</p><p className="text-lg font-bold">{stats.total}</p></div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><Clock size={20} /></div>
            <div><p className="text-xs text-slate-400">Pending</p><p className="text-lg font-bold">{stats.pending}</p></div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><AlertTriangle size={20} /></div>
            <div><p className="text-xs text-slate-400">In Progress</p><p className="text-lg font-bold">{stats.inProgress}</p></div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircle size={20} /></div>
            <div><p className="text-xs text-slate-400">Completed</p><p className="text-lg font-bold">{stats.completed}</p></div>
          </div>
        </div>

        {/* Content Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Projects filter list */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[500px]">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Briefcase size={18} className="text-slate-500" />
              My Projects ({projects.length})
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              <div 
                onClick={() => setSelectedProjectId(null)}
                className={`p-3.5 rounded-xl cursor-pointer text-sm font-semibold transition ${
                  selectedProjectId === null 
                    ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600' 
                    : 'hover:bg-slate-50 border-l-4 border-transparent text-slate-700'
                }`}
              >
                All Projects
              </div>
              {projects.map(p => (
                <div 
                  key={p.id}
                  onClick={() => setSelectedProjectId(p.id)}
                  className={`p-3.5 rounded-xl cursor-pointer text-sm font-semibold transition ${
                    selectedProjectId === p.id 
                      ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600' 
                      : 'hover:bg-slate-50 border-l-4 border-transparent text-slate-700'
                  }`}
                >
                  <p className="truncate">{p.name}</p>
                  {p.description && <p className="text-xs text-slate-400 font-normal truncate mt-0.5">{p.description}</p>}
                </div>
              ))}
              {projects.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <Briefcase size={28} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-xs">You are not added to any projects.</p>
                </div>
              )}
            </div>
          </div>

          {/* Assigned Tasks list */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[500px]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <FileText size={18} className="text-slate-500" />
                Assigned Tasks ({filteredTasks.length})
              </h3>
              {selectedProjectId && (
                <button 
                  onClick={() => setSelectedProjectId(null)}
                  className="text-xs font-semibold text-primary-600 hover:text-primary-500"
                >
                  Clear Filter
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {filteredTasks.map(t => (
                <div 
                  key={t.id} 
                  className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                    t.status === 'COMPLETED' ? 'bg-slate-50/50 border-slate-200' : 'bg-white border-slate-200 hover:shadow-sm'
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isOverdue(t.due_date, t.status) && (
                        <span className="inline-flex items-center gap-0.5 bg-red-50 text-red-600 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                          <AlertCircle size={10} /> Overdue
                        </span>
                      )}
                    </div>
                    
                    <h4 className={`font-semibold text-sm ${t.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                      {t.title}
                    </h4>
                    {t.description && (
                      <p className="text-xs text-slate-400 line-clamp-2">{t.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-slate-400 pt-1 flex-wrap">
                      <span className={`flex items-center gap-1 ${isOverdue(t.due_date, t.status) ? 'text-red-500 font-semibold' : ''}`}>
                        <Calendar size={12} />
                        Due: {new Date(t.due_date).toLocaleDateString()} {new Date(t.due_date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>

                  {/* Status Dropdown selector */}
                  <div className="shrink-0 flex items-center gap-2">
                    <label className="text-xs text-slate-400 hidden sm:block">Status:</label>
                    <select
                      value={t.status}
                      onChange={(e) => handleUpdateStatus(t.id, e.target.value)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-xl border outline-none cursor-pointer transition focus:ring-1 focus:ring-primary-500 ${
                        t.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        t.status === 'IN_PROGRESS' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 
                        'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      <option value="PENDING">Pending</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>
                </div>
              ))}
              {filteredTasks.length === 0 && (
                <div className="text-center py-28 text-slate-400">
                  <CheckCircle size={32} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-xs">No tasks found here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
