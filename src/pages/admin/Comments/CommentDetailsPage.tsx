import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Check, XCircle, Trash2, Sparkles, Save } from 'lucide-react';
import { commentService } from '../../../services/commentService';
import { useToast } from '../../../context/ToastContext';
import Loading from '../../../components/shared/Loading';
import ErrorState from '../../../components/shared/ErrorState';
import ConfirmDialog from '../../../components/shared/ConfirmDialog';
import type { CommentItem } from '../../../types';

export default function CommentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [comment, setComment] = useState<CommentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [providerReply, setProviderReply] = useState('');
  const [savingReply, setSavingReply] = useState(false);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadComment = useCallback(async () => {
    if (!id) return;
    try {
      const res = await commentService.getCommentById(id);
      setComment(res.data);
      setProviderReply(res.data.providerResponse?.text || '');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comment.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) void loadComment();
    });
    return () => {
      active = false;
    };
  }, [loadComment]);

  const handleToggleApproval = async () => {
    if (!comment) return;
    try {
      const res = comment.isApproved
        ? await commentService.rejectComment(comment._id)
        : await commentService.approveComment(comment._id);
      setComment((prev) => (prev ? { ...prev, isApproved: res.data.isApproved } : res.data));
      showToast(res.data.isApproved ? 'Comment approved.' : 'Comment rejected / unpublished.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update comment.', 'error');
    }
  };

  const handleSaveReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment) return;
    setSavingReply(true);
    try {
      const res = await commentService.updateComment(comment._id, {
        providerResponse: { text: providerReply.trim() }
      });
      setComment((prev) =>
        prev ? { ...prev, providerResponse: res.data.providerResponse } : res.data
      );
      showToast('Provider response saved.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save response.', 'error');
    } finally {
      setSavingReply(false);
    }
  };

  const handleDelete = async () => {
    if (!comment) return;
    setDeleting(true);
    try {
      await commentService.deleteComment(comment._id);
      showToast('Comment deleted.');
      navigate('/admin/comments', { replace: true });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to delete comment.', 'error');
      setDeleting(false);
    }
  };

  if (loading) return <Loading label="Loading comment details..." />;
  if (error || !comment) {
    return <ErrorState message={error || 'Comment not found.'} onRetry={loadComment} />;
  }

  const postObj = typeof comment.post === 'object' && comment.post !== null ? comment.post : null;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/comments"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Back to comments"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-white">Comment by {comment.reviewerName}</h2>
            <p className="text-xs text-slate-400 font-mono">ID: {comment._id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleToggleApproval()}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
              comment.isApproved
                ? 'bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-800'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {comment.isApproved ? (
              <>
                <XCircle className="w-4 h-4" aria-hidden="true" />
                Reject / Unpublish
              </>
            ) : (
              <>
                <Check className="w-4 h-4" aria-hidden="true" />
                Approve Comment
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
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-amber-400 font-bold text-sm">★ {comment.rating} / 5</span>
          {comment.isApproved ? (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
              Approved
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950 text-amber-300 border border-amber-800">
              Pending Approval
            </span>
          )}
          {comment.isGenerated && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-950 text-purple-300 border border-purple-800">
              <Sparkles className="w-3 h-3" aria-hidden="true" />
              AI / Demo Generated
            </span>
          )}
        </div>

        <blockquote className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 leading-relaxed">
          "{comment.comment}"
        </blockquote>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
          <div>
            <dt className="text-slate-400 font-semibold uppercase">Target Post</dt>
            <dd className="mt-1">
              {postObj ? (
                <Link
                  to={`/admin/posts/${postObj._id}`}
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >
                  {postObj.title}
                </Link>
              ) : (
                <span className="text-slate-500">Unknown post</span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400 font-semibold uppercase">Visit Date</dt>
            <dd className="mt-1 text-slate-200">{comment.visitDate || '—'}</dd>
          </div>
          <div>
            <dt className="text-slate-400 font-semibold uppercase">Reviewer Stats</dt>
            <dd className="mt-1 text-slate-200">{comment.reviewerStats || '—'}</dd>
          </div>
          <div>
            <dt className="text-slate-400 font-semibold uppercase">Submitted At</dt>
            <dd className="mt-1 text-slate-200">
              {new Date(comment.createdAt).toLocaleString()}
            </dd>
          </div>
        </dl>
      </div>

      <form
        onSubmit={handleSaveReply}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4"
      >
        <h3 className="text-base font-bold text-white">Provider Response</h3>
        <textarea
          rows={3}
          value={providerReply}
          onChange={(e) => setProviderReply(e.target.value)}
          placeholder="Optional response shown beneath the review..."
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={savingReply}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" aria-hidden="true" />
            {savingReply ? 'Saving...' : 'Save Response'}
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete Comment?"
        description="Permanently remove this comment? This action cannot be undone."
        confirmLabel="Delete Comment"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}
