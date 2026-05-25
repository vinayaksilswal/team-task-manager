import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Briefcase, Plus, Trash2, Users, UserPlus, UserMinus, CheckCircle2, Clock, 
  AlertCircle, AlertTriangle, Calendar, LogOut, FileText, ChevronRight, X 
} from 'lucide-react';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [projects, setProjects] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  
  // Modals & Forms State
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  
  const [projName, setProjName] = useState('');
  const [projDesc, setProjDesc] = useState('');
  
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [projRes, usersRes] = await Promise.all([
        api.get('/projects'),
        api.get('/users')
      ]);
      setProjects(projRes.data);
      setAllUsers(usersRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProject = async (id) => {
    try {
      const res = await api.get(`/projects/${id}`);
      setSelectedProject(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load project details.');
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/projects', { name: projName, description: projDesc });
      setProjects([res.data, ...projects]);
      setShowProjectModal(false);
      setProjName('');
      setProjDesc('');
      handleSelectProject(res.data.id);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create project.');
    }
  };

  const handleDeleteProject = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this project? All associated tasks will be lost.')) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects(projects.filter(p => p.id !== id));
      if (selectedProject?.id === id) {
        setSelectedProject(null);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to delete project.');
    }
  };

  const handleAddMember = async (userId) => {
    if (!userId || !selectedProject) return;
    try {
      await api.post(`/projects/${selectedProject.id}/members`, { user_id: parseInt(userId) });
      handleSelectProject(selectedProject.id);
    } catch (err) {
      console.error(err);
      setError('Failed to add project member.');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!selectedProject) return;
    try {
      await api.delete(`/projects/${selectedProject.id}/members/${userId}`);
      handleSelectProject(selectedProject.id);
    } catch (err) {
      console.error(err);
      setError('Failed to remove project member.');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;
    setError('');
    try {
      const payload = {
        title: taskTitle,
        description: taskDesc || null,
        due_date: new Date(taskDueDate).toISOString(),
        assigned_to_id: taskAssignee ? parseInt(taskAssignee) : null
      };
      await api.post(`/projects/${selectedProject.id}/tasks`, payload);
      setShowTaskModal(false);
      setTaskTitle('');
      setTaskDesc('');
      setTaskDueDate('');
      setTaskAssignee('');
      handleSelectProject(selectedProject.id);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create task.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await api.delete(`/tasks/${taskId}`);
      handleSelectProject(selectedProject.id);
    } catch (err) {
      console.error(err);
      setError('Failed to delete task.');
    }
  };

  const handleUpdateTaskStatus = async (taskId, currentStatus) => {
    const nextStatusMap = {
      'PENDING': 'IN_PROGRESS',
      'IN_PROGRESS': 'COMPLETED',
      'COMPLETED': 'PENDING'
    };
    const nextStatus = nextStatusMap[currentStatus];
    try {
      await api.put(`/tasks/${taskId}`, { status: nextStatus });
      handleSelectProject(selectedProject.id);
    } catch (err) {
      console.error(err);
      setError('Failed to update task status.');
    }
  };

  const isOverdue = (dueDate, status) => {
    if (status === 'COMPLETED') return false;
    return new Date(dueDate) < new Date();
  };

  // Helper stats
  const getProjectStats = () => {
    if (!selectedProject) return { total: 0, pending: 0, inProgress: 0, completed: 0 };
    const tasks = selectedProject.tasks || [];
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'PENDING').length,
      inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      completed: tasks.filter(t => t.status === 'COMPLETED').length
    };
  };

  const stats = getProjectStats();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary-500/20">
            TM
          </div>
          <div>
            <h1 className="text-xl font-bold">Team Workspace</h1>
            <p className="text-xs text-slate-400">Admin Control Center</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold">{user?.name}</p>
            <span className="inline-flex items-center rounded-full bg-red-400/10 px-2 py-0.5 text-xs font-medium text-red-400 ring-1 ring-inset ring-red-400/20">
              Admin
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

      {/* Main Workspace Panels */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Panel: Projects Sidebar */}
        <aside className="w-full md:w-80 bg-white border-r border-slate-200 flex flex-col overflow-y-auto shrink-0">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 flex items-center gap-2">
              <Briefcase size={18} className="text-slate-500" />
              Projects ({projects.length})
            </h2>
            <button 
              onClick={() => setShowProjectModal(true)}
              className="p-1.5 rounded-lg bg-primary-50 text-primary-600 hover:bg-primary-100 transition"
              title="New Project"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="flex-1 p-2 space-y-1">
            {projects.map((p) => (
              <div 
                key={p.id}
                onClick={() => handleSelectProject(p.id)}
                className={`w-full text-left p-3.5 rounded-xl cursor-pointer transition-all-custom flex items-center justify-between group ${
                  selectedProject?.id === p.id 
                    ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600' 
                    : 'hover:bg-slate-50 border-l-4 border-transparent text-slate-700'
                }`}
              >
                <div className="truncate pr-2">
                  <h3 className="font-semibold text-sm truncate group-hover:text-primary-700">{p.name}</h3>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{p.description || 'No description'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => handleDeleteProject(p.id, e)}
                    className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
                    title="Delete Project"
                  >
                    <Trash2 size={14} />
                  </button>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-primary-400" />
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <div className="p-6 text-center text-slate-400">
                <Briefcase size={36} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm">No projects created yet.</p>
              </div>
            )}
          </div>
        </aside>

        {/* Center Panel: Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
          {error && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600">
              <AlertCircle className="shrink-0" size={18} />
              <span>{error}</span>
              <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700 font-bold">×</button>
            </div>
          )}

          {selectedProject ? (
            <div className="space-y-6">
              {/* Project Head Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{selectedProject.name}</h2>
                  <p className="text-slate-500 mt-1">{selectedProject.description || 'No description available.'}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      Created {new Date(selectedProject.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowTaskModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-500 transition shadow-lg shadow-primary-500/20"
                >
                  <Plus size={16} /> Create Task
                </button>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><FileText size={20} /></div>
                  <div><p className="text-xs text-slate-400">Total Tasks</p><p className="text-lg font-bold">{stats.total}</p></div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center"><Clock size={20} /></div>
                  <div><p className="text-xs text-slate-400">Pending</p><p className="text-lg font-bold">{stats.pending}</p></div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"><AlertTriangle size={20} /></div>
                  <div><p className="text-xs text-slate-400">In Progress</p><p className="text-lg font-bold">{stats.inProgress}</p></div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircle2 size={20} /></div>
                  <div><p className="text-xs text-slate-400">Completed</p><p className="text-lg font-bold">{stats.completed}</p></div>
                </div>
              </div>

              {/* Members & Tasks Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left col: Members list */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col h-[500px]">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Users size={18} className="text-slate-500" />
                    Project Members ({selectedProject.members?.length || 0})
                  </h3>

                  {/* Add Member Dropdown */}
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Add User to Project</label>
                    <div className="relative">
                      <select 
                        onChange={(e) => {
                          handleAddMember(e.target.value);
                          e.target.value = '';
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary-500 transition"
                      >
                        <option value="">Select a user to add...</option>
                        {allUsers
                          .filter(u => !selectedProject.members?.some(m => m.id === u.id))
                          .map(u => (
                            <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                          ))
                        }
                      </select>
                    </div>
                  </div>

                  {/* Member Rows */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {selectedProject.members?.map(m => (
                      <div key={m.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="truncate">
                          <p className="text-sm font-semibold text-slate-800">{m.name}</p>
                          <p className="text-xs text-slate-400 truncate">{m.email}</p>
                        </div>
                        <button 
                          onClick={() => handleRemoveMember(m.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="Remove Member"
                        >
                          <UserMinus size={16} />
                        </button>
                      </div>
                    ))}
                    {(!selectedProject.members || selectedProject.members.length === 0) && (
                      <div className="text-center py-12 text-slate-400">
                        <Users size={28} className="mx-auto mb-2 text-slate-300" />
                        <p className="text-xs">No members added yet.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right col: Tasks list */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col h-[500px]">
                  <h3 className="font-bold text-slate-900 mb-4">Tasks</h3>
                  
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {selectedProject.tasks?.map(t => (
                      <div key={t.id} className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                        t.status === 'COMPLETED' ? 'bg-slate-50/50 border-slate-200' : 'bg-white border-slate-200 hover:shadow-sm'
                      }`}>
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span 
                              onClick={() => handleUpdateTaskStatus(t.id, t.status)}
                              className={`cursor-pointer px-2 py-0.5 rounded-full text-xs font-semibold select-none transition ${
                                t.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                                t.status === 'IN_PROGRESS' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'
                              }`}
                              title="Click to cycle status"
                            >
                              {t.status}
                            </span>
                            
                            {isOverdue(t.due_date, t.status) && (
                              <span className="inline-flex items-center gap-0.5 bg-red-50 text-red-600 px-2 py-0.5 rounded-full text-xs font-medium">
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
                            <span>
                              Assignee: <strong className="text-slate-600">{t.assigned_to?.name || 'Unassigned'}</strong>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                          <button 
                            onClick={() => handleDeleteTask(t.id)}
                            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Delete Task"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {(!selectedProject.tasks || selectedProject.tasks.length === 0) && (
                      <div className="text-center py-24 text-slate-400">
                        <FileText size={32} className="mx-auto mb-2 text-slate-300" />
                        <p className="text-xs">No tasks added to this project yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Welcome screen when no project is selected */
            <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
              <div className="h-16 w-16 rounded-2xl bg-indigo-50 text-primary-600 flex items-center justify-center mb-6 shadow-sm">
                <Briefcase size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">No Project Selected</h2>
              <p className="text-slate-400 text-sm mt-2">
                Select a project from the left panel sidebar to manage its tasks, members, and details, or create a brand new one.
              </p>
              <button 
                onClick={() => setShowProjectModal(true)}
                className="mt-6 flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-500 transition shadow-md shadow-primary-500/20"
              >
                <Plus size={16} /> Create New Project
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Modal: Create Project */}
      {showProjectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Create New Project</h3>
              <button onClick={() => setShowProjectModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Project Name</label>
                <input 
                  type="text"
                  required
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 transition"
                  placeholder="E.g., Website Redesign"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
                <textarea 
                  value={projDesc}
                  onChange={(e) => setProjDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 transition h-24 resize-none"
                  placeholder="Brief summary of the goals..."
                />
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowProjectModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-500 transition rounded-xl"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Task */}
      {showTaskModal && selectedProject && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Create Task</h3>
              <button onClick={() => setShowTaskModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateTask} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Task Title</label>
                <input 
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 transition"
                  placeholder="What needs to be done?"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
                <textarea 
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 transition h-20 resize-none"
                  placeholder="Provide context or details..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Due Date</label>
                <input 
                  type="datetime-local"
                  required
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Assign User</label>
                <select 
                  value={taskAssignee}
                  onChange={(e) => setTaskAssignee(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-primary-500 transition"
                >
                  <option value="">Leave Unassigned</option>
                  {selectedProject.members?.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">Note: You can only assign tasks to project members.</span>
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-500 transition rounded-xl"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
