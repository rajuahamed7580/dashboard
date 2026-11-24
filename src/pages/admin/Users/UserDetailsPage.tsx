import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Ban, CheckCircle, Trash2 } from 'lucide-react';
import { userService } from '../../../services/userService';
import { useToast } from '../../../context/ToastContext';
import { useAuth } from '../../../context/AuthContext';
import Loading from '../../../components/shared/Loading';
import ErrorState from '../../../components/shared/ErrorState';
import ConfirmDialog from '../../../components/shared/ConfirmDialog';
import type { User } from '../../../types';

export default function UserDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user: currentUser } = useAuth();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [saving, setSaving] = useState(false);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadUser = useCallback(async () => {
    if (!id) return;
    try {
      const res = await userService.getUserById(id);
      setUser(res.data);
      setName(res.data.name);
      setEmail(res.data.email);
      setRole(res.data.role);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) void loadUser();
    });
    return () => {
      active = false;
    };
  }, [loadUser]);

  const handleSave = async (e: React.FormEvent) => {
    if (!id) return;
    e.preventDefault();
    setSaving(true);
    try {
      const res = await userService.updateUser(id, { name: name.trim(), email: email.trim(), role });
      setUser(res.data);
      showToast('User details updated.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update user.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBlock = async () => {
    if (!user) return;
    try {
      const res = user.isBlock
        ? await userService.unblockUser(user._id)
        : await userService.blockUser(user._id);
      setUser(res.data);
      showToast(`User ${res.data.isBlock ? 'blocked' : 'unblocked'} successfully.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update status.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      await userService.deleteUser(user._id);
      showToast('User deleted permanently.');
      navigate('/admin/users', { replace: true });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete user.', 'error');
      setDeleting(false);
    }
  };

  if (loading) return <Loading label="Loading user details..." />;
  if (error || !user) return <ErrorState message={error || 'User not found.'} onRetry={loadUser} />;

  const isSelf = currentUser?._id === user._id;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/users"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Back to users"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-white">{user.name}</h2>
            <p className="text-xs text-slate-400 font-mono">ID: {user._id}</p>
          </div>
        </div>

        {!isSelf && user.role !== 'admin' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void handleToggleBlock()}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                user.isBlock
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800'
              }`}
            >
              {user.isBlock ? (
                <>
                  <CheckCircle className="w-4 h-4" aria-hidden="true" />
                  Unblock User
                </>
              ) : (
                <>
                  <Ban className="w-4 h-4" aria-hidden="true" />
                  Block User
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setConfirmDeleteOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-semibold transition-colors"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 uppercase font-semibold">Status</div>
          <div className="mt-1.5">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                user.isBlock
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
              }`}
            >
              {user.isBlock ? 'Blocked' : 'Active'}
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 uppercase font-semibold">Role</div>
          <div className="mt-1 text-sm font-bold text-white uppercase">{user.role}</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 uppercase font-semibold">Registered</div>
          <div className="mt-1 text-sm font-semibold text-slate-200">
            {new Date(user.createdAt).toLocaleString()}
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSave}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5"
      >
        <h3 className="text-base font-bold text-white">Edit User Information</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="user-name" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Full Name
            </label>
            <input
              id="user-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="user-email" className="block text-xs font-semibold text-slate-300 mb-1.5">
              Email Address
            </label>
            <input
              id="user-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="user-role" className="block text-xs font-semibold text-slate-300 mb-1.5">
            Account Role
          </label>
          <select
            id="user-role"
            value={role}
            disabled={isSelf}
            onChange={(e) => setRole(e.target.value as 'admin' | 'user')}
            className="w-full sm:w-56 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" aria-hidden="true" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete User Account?"
        description={`Permanently delete "${user.name}" (${user.email})? This cannot be undone.`}
        confirmLabel="Delete User"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}
