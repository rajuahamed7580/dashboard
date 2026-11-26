import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  ExternalLink,
  Globe,
  Archive,
  MapPin,
  Phone,
  Star,
  MessageSquare
} from 'lucide-react';
import { postService } from '../../../services/postService';
import { commentService } from '../../../services/commentService';
import { buildWebsiteUrl } from '../../../services/apiClient';
import { useToast } from '../../../context/ToastContext';
import Loading from '../../../components/shared/Loading';
import ErrorState from '../../../components/shared/ErrorState';
import ConfirmDialog from '../../../components/shared/ConfirmDialog';
import type { CommentItem, Post } from '../../../types';

export default function PostDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const [postRes, commentsRes] = await Promise.all([
        postService.getPostById(id),
        commentService.getCommentsByPost(id, { limit: 10 })
      ]);
      setPost(postRes.data);
      setComments(commentsRes.data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load post details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) void loadData();
    });
    return () => {
      active = false;
    };
  }, [loadData]);

  const handleToggleStatus = async () => {
    if (!post) return;
    try {
      const res =
        post.status === 'published'
          ? await postService.archivePost(post._id)
          : await postService.publishPost(post._id);
      setPost(res.data);
      showToast(`Post status updated to ${res.data.status}.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update status.', 'error');
    }
  };

  const handleDelete = async () => {
    if (!post) return;
    setDeleting(true);
    try {
      await postService.deletePost(post._id);
      showToast('Post deleted permanently.');
      navigate('/admin/posts', { replace: true });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete post.', 'error');
      setDeleting(false);
    }
  };

  if (loading) return <Loading label="Loading post details..." />;
  if (error || !post) return <ErrorState message={error || 'Post not found.'} onRetry={loadData} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link
            to="/admin/posts"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors mt-0.5"
            aria-label="Back to posts"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold text-white">{post.title}</h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                  post.status === 'published'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : post.status === 'draft'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {post.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              @{post.displayName} ·{' '}
              {post.customUrls?.[0] ? (
                <span className="font-mono">{post.customUrls[0]}</span>
              ) : (
                <Link to="/admin/custom-urls" className="text-blue-400 hover:underline">
                  Set custom URL
                </Link>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {post.customUrls?.[0] ? (
            <a
              href={buildWebsiteUrl(post.customUrls[0])}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800 text-xs font-semibold transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              View Live
            </a>
          ) : (
            <Link
              to="/admin/custom-urls"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800 text-xs font-semibold transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              Set Custom URL
            </Link>
          )}

          <Link
            to={`/admin/posts/${post._id}/edit`}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
          >
            <Edit className="w-3.5 h-3.5" aria-hidden="true" />
            Edit Post
          </Link>

          <button
            type="button"
            onClick={() => void handleToggleStatus()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            {post.status === 'published' ? (
              <>
                <Archive className="w-3.5 h-3.5" aria-hidden="true" />
                Unpublish
              </>
            ) : (
              <>
                <Globe className="w-3.5 h-3.5" aria-hidden="true" />
                Publish
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setConfirmDeleteOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-semibold transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            Delete
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Gallery & Quick Metadata */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <img
              src={post.mainImage || 'https://via.placeholder.com/600x400'}
              alt={post.title}
              className="w-full h-64 object-cover bg-slate-800"
            />
            {post.images?.length > 1 && (
              <div className="p-3 grid grid-cols-4 gap-2 border-t border-slate-800">
                {post.images.map((img, i) => (
                  <img
                    key={`${img.url}-${i}`}
                    src={img.url}
                    alt=""
                    className="w-full h-14 object-cover rounded-lg border border-slate-800"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <MapPin className="w-4 h-4 text-blue-400" aria-hidden="true" />
              <span>
                {post.location?.city}, {post.location?.state}, {post.location?.country}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Phone className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              <span>{post.contact?.phone || 'Not provided'}</span>
            </div>
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <Star className="w-4 h-4" aria-hidden="true" />
              <span>
                {post.averageRating} / 5 ({post.totalReviews} approved reviews)
              </span>
            </div>
          </div>
        </div>

        {/* Right: Structured Details */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Profile Attributes</h3>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <dt className="text-slate-400">Category</dt>
                <dd className="text-white font-semibold mt-0.5">{post.category || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Age / Gender</dt>
                <dd className="text-white font-semibold mt-0.5">
                  {post.age ?? '—'} · {post.gender || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Ethnicity</dt>
                <dd className="text-white font-semibold mt-0.5">{post.ethnicity || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Height / Body</dt>
                <dd className="text-white font-semibold mt-0.5">
                  {post.height || '—'} · {post.bodyType || '—'}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Donations</dt>
                <dd className="text-white font-semibold mt-0.5">{post.donations || '—'}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Payments</dt>
                <dd className="text-white font-semibold mt-0.5">
                  {post.paymentMethods?.join(', ') || '—'}
                </dd>
              </div>
            </dl>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-white">About, Schedule & Screening</h3>
            {post.aboutSection?.notice && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">
                <div className="text-slate-400 font-semibold mb-1">Notice</div>
                {post.aboutSection.notice}
              </div>
            )}
            {post.aboutSection?.warnings && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">
                <div className="text-slate-400 font-semibold mb-1">Warnings</div>
                {post.aboutSection.warnings}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400 font-semibold mb-1">Working Hours</div>
                <div className="text-slate-200">{post.scheduleSection?.workingHours || '—'}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400 font-semibold mb-1">Deposit</div>
                <div className="text-slate-200">{post.screeningSection?.depositAmount || '—'}</div>
              </div>
            </div>
          </section>

          {/* Associated Comments */}
          <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-400" aria-hidden="true" />
                Recent Comments on this Post ({comments.length})
              </h3>
              <Link
                to={`/admin/comments?postId=${post._id}`}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300"
              >
                Moderate All →
              </Link>
            </div>
            <div className="divide-y divide-slate-800">
              {comments.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No comments for this post yet.
                </div>
              ) : (
                comments.map((c) => (
                  <Link
                    key={c._id}
                    to={`/admin/comments/${c._id}`}
                    className="block p-4 hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white">{c.reviewerName}</span>
                        <span className="text-amber-400 text-xs">★ {c.rating}</span>
                        {c.isGenerated && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-950 text-purple-300 border border-purple-800">
                            Generated
                          </span>
                        )}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          c.isApproved
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {c.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-2">"{c.comment}"</p>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete Post?"
        description={`Are you sure you want to permanently delete "${post.title}" and all of its associated comments?`}
        confirmLabel="Delete Post"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}
