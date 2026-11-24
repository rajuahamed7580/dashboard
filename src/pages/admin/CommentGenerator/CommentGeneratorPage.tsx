import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Check, ArrowRight, Info } from 'lucide-react';
import { postService } from '../../../services/postService';
import { commentService } from '../../../services/commentService';
import { useToast } from '../../../context/ToastContext';
import Loading from '../../../components/shared/Loading';
import ErrorState from '../../../components/shared/ErrorState';
import type { CommentItem, Post } from '../../../types';

export default function CommentGeneratorPage() {
  const { showToast } = useToast();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPostId, setSelectedPostId] = useState('');
  const [limit, setLimit] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [generatedComments, setGeneratedComments] = useState<CommentItem[]>([]);
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());

  const loadPosts = useCallback(async () => {
    try {
      const res = await postService.getPosts({ limit: 100, sortBy: 'createdAt', sortOrder: 'desc' });
      const list = res.data || [];
      setPosts(list);
      if (list.length > 0) {
        setSelectedPostId((prev) => prev || list[0]._id);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts.');
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) void loadPosts();
    });
    return () => {
      active = false;
    };
  }, [loadPosts]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPostId) {
      showToast('Please select a target post first.', 'error');
      return;
    }

    setGenerating(true);
    try {
      const res = await commentService.generateComments(selectedPostId, Number(limit));
      setGeneratedComments(res.data?.comments || []);
      setApprovedIds(new Set());
      showToast(res.message || `Generated ${res.data?.comments?.length || 0} demo comments.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to generate comments.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleApproveGenerated = async (commentId: string) => {
    try {
      await commentService.approveComment(commentId);
      setApprovedIds((prev) => new Set(prev).add(commentId));
      showToast('Generated comment approved and published.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to approve comment.', 'error');
    }
  };

  if (loadingPosts) return <Loading label="Loading available posts..." />;
  if (error) return <ErrorState message={error} onRetry={loadPosts} />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Comment Generator</h2>
        <p className="text-sm text-slate-400">
          Generate realistic sample/demo reviews for any post. All generated comments remain
          unpublished until explicitly approved by an administrator.
        </p>
      </div>

      <form
        onSubmit={handleGenerate}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label
              htmlFor="gen-post"
              className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2"
            >
              Select Target Post
            </label>
            <select
              id="gen-post"
              value={selectedPostId}
              onChange={(e) => setSelectedPostId(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              {posts.length === 0 ? (
                <option value="">No posts available</option>
              ) : (
                posts.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.title} (@{p.displayName})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="gen-limit"
              className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2"
            >
              Generation Limit (1 – 50)
            </label>
            <input
              id="gen-limit"
              type="number"
              min={1}
              max={50}
              required
              value={limit}
              onChange={(e) => setLimit(Math.max(1, Math.min(50, Number(e.target.value) || 1)))}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-800">
          <div className="flex items-start gap-2 text-xs text-slate-400">
            <Info className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              Generated items are tagged <code className="text-purple-300">isGenerated: true</code>{' '}
              and <code className="text-amber-300">isApproved: false</code> until moderated.
            </span>
          </div>

          <button
            type="submit"
            disabled={generating || !selectedPostId}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold shadow-lg transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" aria-hidden="true" />
            {generating ? 'Generating...' : 'Generate Sample Comments'}
          </button>
        </div>
      </form>

      {/* Preview Generated Results */}
      {generatedComments.length > 0 && (
        <section className="bg-slate-900 border border-purple-900/60 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">
                Generated Comments Preview ({generatedComments.length})
              </h3>
              <p className="text-xs text-slate-400">
                Review each item below or moderate them later in the Comments queue.
              </p>
            </div>
            <Link
              to="/admin/comments?isApproved=false&isGenerated=true"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300"
            >
              Open Pending Queue
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>

          <div className="divide-y divide-slate-800">
            {generatedComments.map((item) => {
              const isApproved = approvedIds.has(item._id) || item.isApproved;
              return (
                <div
                  key={item._id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-white">{item.reviewerName}</span>
                      <span className="text-amber-400 text-xs font-semibold">★ {item.rating}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-950 text-purple-300 border border-purple-800">
                        <Sparkles className="w-2.5 h-2.5" aria-hidden="true" />
                        AI / Demo Generated
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          isApproved
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-amber-950 text-amber-300 border border-amber-800'
                        }`}
                      >
                        {isApproved ? 'Approved' : 'Unpublished (Pending)'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 italic">"{item.comment}"</p>
                    <p className="text-xs text-slate-500">
                      {item.visitDate} · {item.reviewerStats}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!isApproved ? (
                      <button
                        type="button"
                        onClick={() => void handleApproveGenerated(item._id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        Approve
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-400">Live ✓</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
