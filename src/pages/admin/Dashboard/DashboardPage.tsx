import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  FileText,
  MessageSquare,
  CheckCircle2,
  Clock,
  Star,
  ArrowRight,
  BarChart3,
  MapPin,
  Sparkles
} from 'lucide-react';
import { dashboardService } from '../../../services/dashboardService';
import { commentService } from '../../../services/commentService';
import { useToast } from '../../../context/ToastContext';
import Loading from '../../../components/shared/Loading';
import ErrorState from '../../../components/shared/ErrorState';
import ConfirmDialog from '../../../components/shared/ConfirmDialog';
import type { DashboardAnalyticsData, DashboardStatsData } from '../../../types';

export default function DashboardPage() {
  const { showToast } = useToast();
  const [statsData, setStatsData] = useState<DashboardStatsData | null>(null);
  const [analytics, setAnalytics] = useState<DashboardAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const [statsRes, analyticsRes] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getAnalytics()
      ]);
      setStatsData(statsRes.data);
      setAnalytics(analyticsRes.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) void loadDashboard();
    });
    return () => {
      active = false;
    };
  }, [loadDashboard]);

  const handleApproveReview = async (id: string) => {
    try {
      await commentService.approveComment(id);
      showToast('Comment approved and published to the website.');
      void loadDashboard();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to approve comment.', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setActionLoading(true);
    try {
      await commentService.deleteComment(deleteTargetId);
      showToast('Comment deleted permanently.');
      setDeleteTargetId(null);
      void loadDashboard();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete comment.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <Loading label="Loading platform metrics and analytics..." />;
  if (error) return <ErrorState message={error} onRetry={loadDashboard} />;

  const stats = statsData?.stats;
  const activity = statsData?.recentActivity;

  const maxCategoryCount = Math.max(
    1,
    ...(analytics?.categoryDistribution.map((c) => c.count) || [1])
  );
  const maxLocationCount = Math.max(
    1,
    ...(analytics?.locationDistribution.map((l) => l.count) || [1])
  );
  const maxRatingCount = Math.max(
    1,
    ...(analytics?.ratingDistribution.map((r) => r.count) || [1])
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Platform Overview</h2>
          <p className="text-sm text-slate-400">
            Real-time metrics, moderation queue, and distribution analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/admin/posts/create"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
          >
            + Create Post
          </Link>
          <Link
            to="/admin/comment-generator"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" aria-hidden="true" />
            Generator
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Users</span>
            <Users className="w-4 h-4 text-indigo-400" aria-hidden="true" />
          </div>
          <div className="text-2xl font-extrabold text-white">{stats?.users.total ?? 0}</div>
          <div className="text-xs text-slate-400">
            {stats?.users.active ?? 0} active · {stats?.users.blocked ?? 0} blocked
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Posts</span>
            <FileText className="w-4 h-4 text-blue-400" aria-hidden="true" />
          </div>
          <div className="text-2xl font-extrabold text-white">{stats?.posts.total ?? 0}</div>
          <div className="text-xs text-slate-400">
            {stats?.posts.draft ?? 0} draft · {stats?.posts.archived ?? 0} archived
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Published Posts</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">
            {stats?.posts.published ?? 0}
          </div>
          <div className="text-xs text-slate-400">Live on public site</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Comments</span>
            <MessageSquare className="w-4 h-4 text-sky-400" aria-hidden="true" />
          </div>
          <div className="text-2xl font-extrabold text-white">{stats?.comments.total ?? 0}</div>
          <div className="text-xs text-slate-400">
            {stats?.comments.approved ?? 0} approved · {stats?.comments.generated ?? 0} demo
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Comments</span>
            <Clock className="w-4 h-4 text-amber-400" aria-hidden="true" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400">
            {stats?.comments.pending ?? 0}
          </div>
          <div className="text-xs text-slate-400">Awaiting moderation</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Rating</span>
            <Star className="w-4 h-4 text-amber-400" aria-hidden="true" />
          </div>
          <div className="text-2xl font-extrabold text-amber-300">
            {stats?.ratings.average ?? 5.0} ★
          </div>
          <div className="text-xs text-slate-400">Approved reviews</div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Distribution */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" aria-hidden="true" />
              Posts by Category
            </h3>
          </div>
          <div className="space-y-3">
            {analytics?.categoryDistribution.length ? (
              analytics.categoryDistribution.map((item) => (
                <div key={item.category} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">{item.category}</span>
                    <span className="text-slate-400 font-semibold">{item.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${Math.round((item.count / maxCategoryCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">No category data available yet.</p>
            )}
          </div>
        </section>

        {/* Rating Breakdown */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" aria-hidden="true" />
            Rating Distribution
          </h3>
          <div className="space-y-3">
            {analytics?.ratingDistribution.length ? (
              analytics.ratingDistribution.map((item) => (
                <div key={item.rating} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-amber-400 font-semibold">{item.rating} Stars</span>
                    <span className="text-slate-400">{item.count} reviews</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-400"
                      style={{ width: `${Math.round((item.count / maxRatingCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">No approved ratings yet.</p>
            )}
          </div>
        </section>

        {/* Top Locations */}
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            Top Locations
          </h3>
          <div className="space-y-3">
            {analytics?.locationDistribution.length ? (
              analytics.locationDistribution.slice(0, 6).map((loc, idx) => (
                <div key={`${loc.city}-${loc.state}-${idx}`} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 truncate">
                      {loc.city}, {loc.state}
                    </span>
                    <span className="text-slate-400 font-semibold">{loc.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.round((loc.count / maxLocationCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500">No location data available yet.</p>
            )}
          </div>
        </section>
      </div>

      {/* Pending Comments Moderation Queue */}
      <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white">Pending Comments Queue</h3>
            <p className="text-xs text-slate-400">
              Approve or remove comments before they appear on the live website
            </p>
          </div>
          <Link
            to="/admin/comments"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300"
          >
            View All Comments
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="divide-y divide-slate-800">
          {!activity?.pendingReviews?.length ? (
            <div className="p-8 text-center text-xs text-slate-500">
              All caught up! No pending comments require moderation.
            </div>
          ) : (
            activity.pendingReviews.map((rev) => {
              const postTitle =
                typeof rev.post === 'object' && rev.post !== null ? rev.post.title : 'Unknown post';
              return (
                <div
                  key={rev._id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/admin/comments/${rev._id}`}
                        className="font-semibold text-sm text-white hover:text-blue-400 transition-colors"
                      >
                        {rev.reviewerName}
                      </Link>
                      <span className="text-amber-400 text-xs font-semibold">★ {rev.rating}</span>
                      {rev.isGenerated && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-950 text-purple-300 border border-purple-800">
                          AI / Demo Generated
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-300 italic">"{rev.comment}"</p>
                    <p className="text-xs text-slate-500">
                      Post: <span className="text-slate-400">{postTitle}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => void handleApproveReview(rev._id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTargetId(rev._id)}
                      className="px-3 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-semibold transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Recent Posts & Recent Users */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Recent Posts</h3>
            <Link
              to="/admin/posts"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300"
            >
              Manage Posts →
            </Link>
          </div>
          <div className="divide-y divide-slate-800">
            {!activity?.recentPosts?.length ? (
              <div className="p-6 text-center text-xs text-slate-500">No posts created yet.</div>
            ) : (
              activity.recentPosts.map((post) => (
                <Link
                  key={post._id}
                  to={`/admin/posts/${post._id}`}
                  className="p-4 flex items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={post.mainImage || 'https://via.placeholder.com/48'}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover bg-slate-800 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{post.title}</div>
                      <div className="text-xs text-slate-400 truncate">
                        @{post.displayName} · ★ {post.averageRating} ({post.totalReviews})
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase flex-shrink-0 ${
                      post.status === 'published'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {post.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Recent Users</h3>
            <Link
              to="/admin/users"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300"
            >
              Manage Users →
            </Link>
          </div>
          <div className="divide-y divide-slate-800">
            {!activity?.recentUsers?.length ? (
              <div className="p-6 text-center text-xs text-slate-500">No users registered yet.</div>
            ) : (
              activity.recentUsers.map((u) => (
                <Link
                  key={u._id}
                  to={`/admin/users/${u._id}`}
                  className="p-4 flex items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{u.name}</div>
                    <div className="text-xs text-slate-400 truncate">{u.email}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-800 text-slate-300">
                      {u.role}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        u.isBlock
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}
                    >
                      {u.isBlock ? 'Blocked' : 'Active'}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTargetId)}
        title="Delete Comment?"
        description="This action permanently removes the comment and cannot be undone."
        confirmLabel="Delete Comment"
        loading={actionLoading}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTargetId(null)}
      />
    </div>
  );
}
