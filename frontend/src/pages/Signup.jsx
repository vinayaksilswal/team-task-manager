import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, User, Key, Mail, Shield, AlertCircle } from 'lucide-react';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await signup(name, email, password, role);
      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/member');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Registration failed. Please check inputs and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-tr from-slate-950 via-slate-900 to-violet-950 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-white shadow-lg shadow-primary-600/30">
            <UserPlus size={24} />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-white font-sans">Create an account</h2>
          <p className="mt-2 text-sm text-slate-400">
            Join the workspace and manage your work
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              <AlertCircle className="shrink-0" size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300">
                Full Name
              </label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <User size={18} />
                </span>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full rounded-xl border border-slate-700 bg-slate-800/80 py-2.5 pl-10 pr-3 text-white placeholder-slate-500 outline-none ring-primary-500 transition focus:border-primary-500 focus:ring-2"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Email Address
              </label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Mail size={18} />
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-xl border border-slate-700 bg-slate-800/80 py-2.5 pl-10 pr-3 text-white placeholder-slate-500 outline-none ring-primary-500 transition focus:border-primary-500 focus:ring-2"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Key size={18} />
                </span>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-700 bg-slate-800/80 py-2.5 pl-10 pr-3 text-white placeholder-slate-500 outline-none ring-primary-500 transition focus:border-primary-500 focus:ring-2"
                  placeholder="Min 6 characters"
                />
              </div>
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-slate-300">
                Workspace Role
              </label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Shield size={18} />
                </span>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="block w-full rounded-xl border border-slate-700 bg-slate-800 py-2.5 pl-10 pr-3 text-white outline-none ring-primary-500 transition focus:border-primary-500 focus:ring-2"
                >
                  <option value="MEMBER">Member (Assigned Tasks only)</option>
                  <option value="ADMIN">Admin (Manage Projects & Tasks)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex w-full justify-center rounded-xl bg-primary-600 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-600/30 transition hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {submitting ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-slate-400">Already have an account? </span>
          <Link to="/login" className="font-medium text-primary-400 hover:text-primary-300">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
