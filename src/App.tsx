import React, { useState, useEffect, useRef } from 'react';

const API_BASE_URL = 'http://localhost:5000/api/v1';
const WEBSITE_BASE_URL = 'http://localhost:3000';

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('pd_admin_token'));
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'reviews' | 'generator' | 'users'>('overview');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('admin@privatedelights.com');
  const [loginPassword, setLoginPassword] = useState('AdminPassword123!');

  // Dashboard Data State
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);

  // Filter & Search states
  const [postSearch, setPostSearch] = useState('');
  const [postStatusFilter, setPostStatusFilter] = useState('');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'pending' | 'approved' | 'generated'>('all');

  // Generator State
  const [genPostId, setGenPostId] = useState('');
  const [genLimit, setGenLimit] = useState(5);
  const [generatedResults, setGeneratedResults] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Post Modal (Create or Edit)
  const [showPostModal, setShowPostModal] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialPostState = {
    title: '',
    slug: '',
    displayName: '',
    category: 'Escort',
    age: 25,
    gender: 'Female',
    ethnicity: 'White',
    height: '5 ft 7 in',
    bodyType: 'Curvy',
    serviceType: 'Incall, Outcall',
    city: 'Norwalk',
    state: 'California',
    country: 'USA',
    phone: '(408) 403-1569',
    donations: 'Ask',
    paymentMethods: 'Cash, Paypal, Zelle, Apple Pay',
    mainImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    images: [] as { url: string; caption?: string; isMain?: boolean }[],
    // Dynamic Attributes
    eyes: 'Brown',
    hair: 'White',
    hairLength: 'To butt',
    grooming: 'Bald',
    chest: '30 - 32 DD',
    piercings: false,
    tattoos: false,
    smoke: false,
    // Tab sections
    aboutNotice: "🚗💨 OUTCALLS require 60 Deposit 🚗💨 I'll make the drive if you make the deposit!! ❤️",
    aboutWarnings: '⚠️ 🚫No Gpe 🚫No service 🚫No gfe 🚫No bbbi 🚫No Bare ⚠️',
    noList: 'BBBJ, DFK, COF, FOV, CIM, LFK, RIV, DATY',
    workingHours: '10:00 AM - 11:00 PM',
    workingDays: 'Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday',
    screeningRequirements: 'Two references from recognized providers or employment & LinkedIn verification.',
    depositAmount: '$60 for outcalls',
    screeningInstructions: 'Please text with your name, screening info, date, time and duration requested.'
  };

  const [postForm, setPostForm] = useState(initialPostState);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>)
    };
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Request failed');
      }
      return data;
    } catch (err: any) {
      throw err;
    }
  };

  // Auth verify
  useEffect(() => {
    if (token) {
      authFetch('/auth/me')
        .then((data) => {
          if (data.data?.role !== 'admin') {
            showToast('Access denied: You must be an admin.', 'error');
            handleLogout();
          } else {
            setCurrentUser(data.data);
          }
        })
        .catch(() => {
          handleLogout();
        });
    }
  }, [token]);

  // Tab change
  useEffect(() => {
    if (!token) return;

    if (activeTab === 'overview') {
      loadOverviewStats();
    } else if (activeTab === 'posts') {
      loadPosts();
    } else if (activeTab === 'reviews') {
      loadReviews();
    } else if (activeTab === 'generator') {
      loadPosts();
    } else if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab, token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      if (data.data?.user?.role !== 'admin') {
        throw new Error('Only administrator accounts can access this dashboard.');
      }

      localStorage.setItem('pd_admin_token', data.data.token);
      setToken(data.data.token);
      setCurrentUser(data.data.user);
      showToast('Welcome back, Admin!');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('pd_admin_token');
    setToken(null);
    setCurrentUser(null);
  };

  const loadOverviewStats = async () => {
    try {
      const data = await authFetch('/dashboard/stats');
      setDashboardStats(data.data);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const loadPosts = async () => {
    try {
      let query = `?limit=50&sortBy=createdAt&sortOrder=desc`;
      if (postStatusFilter) query += `&status=${postStatusFilter}`;
      if (postSearch) query += `&search=${encodeURIComponent(postSearch)}`;
      const data = await authFetch(`/posts${query}`);
      setPosts(data.data || []);
      if (!genPostId && data.data?.length > 0) {
        setGenPostId(data.data[0]._id);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const loadReviews = async () => {
    try {
      let query = '?limit=50&sortBy=createdAt&sortOrder=desc';
      if (reviewFilter === 'pending') query += '&isApproved=false';
      if (reviewFilter === 'approved') query += '&isApproved=true';
      if (reviewFilter === 'generated') query += '&isGenerated=true';

      const data = await authFetch(`/comments${query}`);
      setReviews(data.data || []);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const loadUsers = async () => {
    try {
      const data = await authFetch('/users?limit=50');
      setUsersList(data.data || []);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingPostId(null);
    setPostForm(initialPostState);
    setShowPostModal(true);
  };

  // Open Edit Modal with populated data
  const openEditModal = (p: any) => {
    setEditingPostId(p._id);
    setPostForm({
      title: p.title || '',
      slug: p.slug || '',
      displayName: p.displayName || '',
      category: p.category || 'Escort',
      age: p.age || 25,
      gender: p.gender || 'Female',
      ethnicity: p.ethnicity || 'White',
      height: p.height || '5 ft 7 in',
      bodyType: p.bodyType || 'Curvy',
      serviceType: Array.isArray(p.serviceType) ? p.serviceType.join(', ') : 'Incall, Outcall',
      city: p.location?.city || 'Norwalk',
      state: p.location?.state || 'California',
      country: p.location?.country || 'USA',
      phone: p.contact?.phone || '(408) 403-1569',
      donations: p.donations || 'Ask',
      paymentMethods: Array.isArray(p.paymentMethods) ? p.paymentMethods.join(', ') : 'Cash, Paypal, Zelle, Apple Pay',
      mainImage: p.mainImage || '',
      images: p.images || [],
      eyes: p.attributes?.eyes || 'Brown',
      hair: p.attributes?.hair || 'White',
      hairLength: p.attributes?.hairLength || 'To butt',
      grooming: p.attributes?.grooming || 'Bald',
      chest: p.attributes?.chest || '30 - 32 DD',
      piercings: Boolean(p.attributes?.piercings),
      tattoos: Boolean(p.attributes?.tattoos),
      smoke: Boolean(p.attributes?.smoke),
      aboutNotice: p.aboutSection?.notice || '',
      aboutWarnings: p.aboutSection?.warnings || '',
      noList: Array.isArray(p.aboutSection?.noList) ? p.aboutSection.noList.join(', ') : '',
      workingHours: p.scheduleSection?.workingHours || '10:00 AM - 11:00 PM',
      workingDays: Array.isArray(p.scheduleSection?.workingDays) ? p.scheduleSection.workingDays.join(', ') : 'Monday - Sunday',
      screeningRequirements: p.screeningSection?.requirements || '',
      depositAmount: p.screeningSection?.depositAmount || '$60 for outcalls',
      screeningInstructions: p.screeningSection?.instructions || ''
    });
    setShowPostModal(true);
  };

  // Upload image files
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingFiles(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    try {
      const res = await authFetch('/posts/upload', {
        method: 'POST',
        body: formData
      });

      const uploadedImages = res.data || [];
      const newImagesList = [
        ...postForm.images,
        ...uploadedImages.map((img: any, idx: number) => ({
          url: img.url,
          caption: '',
          isMain: postForm.images.length === 0 && idx === 0
        }))
      ];

      setPostForm({
        ...postForm,
        images: newImagesList,
        mainImage: postForm.mainImage || (uploadedImages[0]?.url ?? '')
      });

      showToast(`Successfully uploaded ${uploadedImages.length} image(s)!`);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setUploadingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Save Post (Create or Update)
  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const imagesPayload = postForm.images.length > 0
        ? postForm.images
        : postForm.mainImage
        ? [{ url: postForm.mainImage, caption: 'Main photo', isMain: true }]
        : [];

      const payload = {
        title: postForm.title,
        slug: postForm.slug || undefined,
        displayName: postForm.displayName,
        category: postForm.category,
        age: Number(postForm.age),
        gender: postForm.gender,
        ethnicity: postForm.ethnicity,
        height: postForm.height,
        bodyType: postForm.bodyType,
        serviceType: postForm.serviceType.split(',').map((s) => s.trim()).filter(Boolean),
        mainImage: postForm.mainImage || imagesPayload[0]?.url || '',
        images: imagesPayload,
        location: {
          city: postForm.city,
          state: postForm.state,
          country: postForm.country,
          formattedLocation: `${postForm.country} > ${postForm.state} > ${postForm.city} 📍`
        },
        contact: {
          phone: postForm.phone
        },
        donations: postForm.donations,
        paymentMethods: postForm.paymentMethods.split(',').map((p) => p.trim()).filter(Boolean),
        attributes: {
          eyes: postForm.eyes,
          hair: postForm.hair,
          hairLength: postForm.hairLength,
          grooming: postForm.grooming,
          chest: postForm.chest,
          piercings: postForm.piercings,
          tattoos: postForm.tattoos,
          smoke: postForm.smoke
        },
        aboutSection: {
          notice: postForm.aboutNotice,
          warnings: postForm.aboutWarnings,
          noList: postForm.noList.split(',').map((s) => s.trim()).filter(Boolean)
        },
        scheduleSection: {
          workingHours: postForm.workingHours,
          workingDays: postForm.workingDays.split(',').map((s) => s.trim()).filter(Boolean)
        },
        screeningSection: {
          requirements: postForm.screeningRequirements,
          depositRequired: true,
          depositAmount: postForm.depositAmount,
          instructions: postForm.screeningInstructions
        }
      };

      if (editingPostId) {
        await authFetch(`/posts/${editingPostId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });
        showToast('Profile post updated successfully!');
      } else {
        await authFetch('/posts', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showToast('New profile post created & published to client website!');
      }

      setShowPostModal(false);
      loadPosts();
      if (activeTab === 'overview') loadOverviewStats();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleTogglePublish = async (post: any) => {
    try {
      const endpoint = post.status === 'published' ? `/posts/${post._id}/archive` : `/posts/${post._id}/publish`;
      await authFetch(endpoint, { method: 'PATCH' });
      showToast(`Post status updated.`);
      loadPosts();
      if (activeTab === 'overview') loadOverviewStats();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this profile? All associated reviews will also be removed.')) return;
    try {
      await authFetch(`/posts/${postId}`, { method: 'DELETE' });
      showToast('Profile deleted successfully.');
      loadPosts();
      if (activeTab === 'overview') loadOverviewStats();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Review Actions
  const handleApproveReview = async (reviewId: string) => {
    try {
      await authFetch(`/comments/${reviewId}/approve`, { method: 'PATCH' });
      showToast('Review approved! Now live on client website.');
      loadReviews();
      if (activeTab === 'overview') loadOverviewStats();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleRejectReview = async (reviewId: string) => {
    try {
      await authFetch(`/comments/${reviewId}/reject`, { method: 'PATCH' });
      showToast('Review unapproved.');
      loadReviews();
      if (activeTab === 'overview') loadOverviewStats();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Delete this review permanently?')) return;
    try {
      await authFetch(`/comments/${reviewId}`, { method: 'DELETE' });
      showToast('Review deleted.');
      loadReviews();
      if (activeTab === 'overview') loadOverviewStats();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Review Generator
  const handleGenerateReviews = async () => {
    if (!genPostId) {
      showToast('Please select a target post.', 'error');
      return;
    }
    setIsGenerating(true);
    try {
      const result = await authFetch('/comments/generate', {
        method: 'POST',
        body: JSON.stringify({ postId: genPostId, limit: Number(genLimit) })
      });
      showToast(result.message);
      setGeneratedResults(result.data?.comments || []);
      loadReviews();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleBlockUser = async (user: any) => {
    try {
      const endpoint = user.isBlock ? `/users/${user._id}/unblock` : `/users/${user._id}/block`;
      await authFetch(endpoint, { method: 'PATCH' });
      showToast(`User ${user.isBlock ? 'unblocked' : 'blocked'} successfully.`);
      loadUsers();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Login view
  if (!token) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
        {message && (
          <div
            className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg text-white font-medium shadow-xl ${
              message.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
              Private<span className="text-blue-500">Delights</span>
            </h1>
            <p className="text-slate-400 text-sm">Modular Backend & Content Manager</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Admin Email
              </label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700 text-center">
            <p className="text-xs text-slate-400">
              Default Super Admin: <code className="text-blue-400">admin@privatedelights.com</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Toast Alert */}
      {message && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg text-white font-medium shadow-2xl transition-all ${
            message.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Top Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl font-black tracking-tight text-white">
              Private<span className="text-blue-500">Delights</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-950 text-blue-400 border border-blue-800">
              Admin Portal
            </span>
            <a
              href={WEBSITE_BASE_URL}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 border border-slate-700"
            >
              <span>🌐 Open Website</span>
              <span>↗</span>
            </a>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-slate-200">{currentUser?.name || 'Super Admin'}</div>
              <div className="text-xs text-slate-400">{currentUser?.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col md:flex-row gap-8 w-full">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <nav className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 space-y-1">
            {[
              { id: 'overview', label: '📊 Dashboard Overview' },
              { id: 'posts', label: '📝 Profile Listings' },
              { id: 'reviews', label: '⭐ Review Moderation' },
              { id: 'generator', label: '🎲 Review Generator' },
              { id: 'users', label: '👥 User Accounts' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center justify-between ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="mt-6 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 space-y-2">
            <div className="font-semibold text-slate-300">Live Sync Status</div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-slate-300 font-mono">Backend: 5000</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="text-slate-300 font-mono">Client: 3000</span>
            </div>
            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              Profiles saved here automatically appear on the client website.
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-white">Platform Statistics</h2>
                <p className="text-slate-400 text-sm">Real-time metrics from MongoDB database</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                  <div className="text-xs font-semibold uppercase text-slate-400 mb-1">Total Profiles</div>
                  <div className="text-3xl font-extrabold text-white">
                    {dashboardStats?.stats?.posts?.total ?? '...'}
                  </div>
                  <div className="mt-2 text-xs text-emerald-400">
                    {dashboardStats?.stats?.posts?.published ?? 0} Published • {dashboardStats?.stats?.posts?.draft ?? 0} Draft
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                  <div className="text-xs font-semibold uppercase text-slate-400 mb-1">Total Reviews</div>
                  <div className="text-3xl font-extrabold text-blue-400">
                    {dashboardStats?.stats?.comments?.total ?? '...'}
                  </div>
                  <div className="mt-2 text-xs text-slate-400">
                    {dashboardStats?.stats?.comments?.approved ?? 0} Approved •{' '}
                    <span className="text-amber-400">{dashboardStats?.stats?.comments?.pending ?? 0} Pending</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                  <div className="text-xs font-semibold uppercase text-slate-400 mb-1">Average Rating</div>
                  <div className="text-3xl font-extrabold text-amber-400 flex items-center space-x-1">
                    <span>{dashboardStats?.stats?.ratings?.average ?? '5.0'}</span>
                    <span className="text-lg">★</span>
                  </div>
                  <div className="mt-2 text-xs text-slate-400">Across approved reviews</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
                  <div className="text-xs font-semibold uppercase text-slate-400 mb-1">Registered Users</div>
                  <div className="text-3xl font-extrabold text-indigo-400">
                    {dashboardStats?.stats?.users?.total ?? '...'}
                  </div>
                  <div className="mt-2 text-xs text-slate-400">
                    {dashboardStats?.stats?.users?.active ?? 0} Active • {dashboardStats?.stats?.users?.blocked ?? 0} Blocked
                  </div>
                </div>
              </div>

              {/* Pending Reviews Moderation Queue */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="font-semibold text-white">Pending Reviews (Needs Approval to show on Website)</h3>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                  >
                    View All Reviews →
                  </button>
                </div>

                <div className="divide-y divide-slate-800">
                  {dashboardStats?.recentActivity?.pendingReviews?.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-sm">No pending reviews require approval.</div>
                  ) : (
                    dashboardStats?.recentActivity?.pendingReviews?.map((rev: any) => (
                      <div key={rev._id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-200">{rev.reviewerName}</span>
                            <span className="text-amber-400 text-xs font-semibold">★ {rev.rating}</span>
                            {rev.isGenerated && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-purple-900/60 text-purple-300 border border-purple-700">
                                Generated
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-300 mt-1 italic">"{rev.comment}"</p>
                          <div className="text-xs text-slate-500 mt-1">
                            For post: <span className="text-slate-400">{rev.post?.title || 'Unknown post'}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleApproveReview(rev._id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition-colors"
                          >
                            Approve for Live
                          </button>
                          <button
                            onClick={() => handleDeleteReview(rev._id)}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: POSTS */}
          {activeTab === 'posts' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">Profile Listings</h2>
                  <p className="text-slate-400 text-sm">Create and edit escort profiles shown on the website</p>
                </div>
                <button
                  onClick={openCreateModal}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold shadow-md transition-colors"
                >
                  + Upload New Profile
                </button>
              </div>

              {/* Filter bar */}
              <div className="flex flex-wrap gap-3">
                <input
                  type="text"
                  placeholder="Search profiles by title or city..."
                  value={postSearch}
                  onChange={(e) => setPostSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadPosts()}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                />
                <select
                  value={postStatusFilter}
                  onChange={(e) => setPostStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">All Statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
                <button
                  onClick={loadPosts}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg"
                >
                  Apply
                </button>
              </div>

              {/* Posts Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-300">
                    <thead className="bg-slate-800/80 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="px-5 py-4">Profile</th>
                        <th className="px-5 py-4">Location</th>
                        <th className="px-5 py-4">Rating</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {posts.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                            No profiles found. Click "Upload New Profile" to create one!
                          </td>
                        </tr>
                      ) : (
                        posts.map((post) => (
                          <tr key={post._id} className="hover:bg-slate-800/40">
                            <td className="px-5 py-4">
                              <div className="flex items-center space-x-3">
                                <img
                                  src={post.mainImage || 'https://via.placeholder.com/60'}
                                  alt=""
                                  className="w-12 h-12 rounded-lg object-cover bg-slate-800"
                                />
                                <div>
                                  <div className="font-bold text-white leading-tight">{post.title}</div>
                                  <div className="text-xs text-blue-400">@{post.displayName}</div>
                                  <div className="text-[11px] text-slate-500 font-mono">slug: /posts/{post.slug}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div>{post.location?.city || 'Norwalk'}, {post.location?.state || 'CA'}</div>
                              <div className="text-xs text-slate-500">{post.location?.country || 'USA'}</div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="text-amber-400 font-semibold">★ {post.averageRating}</div>
                              <div className="text-xs text-slate-500">{post.totalReviews} reviews</div>
                            </td>
                            <td className="px-5 py-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
                                  post.status === 'published'
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                    : post.status === 'draft'
                                    ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}
                              >
                                {post.status}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right space-x-2 whitespace-nowrap">
                              <a
                                href={`${WEBSITE_BASE_URL}/posts/${post.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 bg-blue-950 text-blue-400 hover:bg-blue-900 border border-blue-800 rounded text-xs transition-colors"
                              >
                                👁️ View Live
                              </a>
                              <button
                                onClick={() => openEditModal(post)}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => handleTogglePublish(post)}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors"
                              >
                                {post.status === 'published' ? 'Archive' : 'Publish'}
                              </button>
                              <button
                                onClick={() => handleDeletePost(post._id)}
                                className="px-2.5 py-1 bg-rose-950 text-rose-300 hover:bg-rose-900 border border-rose-800 rounded text-xs transition-colors"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: REVIEWS MODERATION */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Review Moderation</h2>
                <p className="text-slate-400 text-sm">Approve customer feedback so it displays dynamically on the client website</p>
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                {[
                  { id: 'all', label: 'All Reviews' },
                  { id: 'pending', label: 'Pending Approval' },
                  { id: 'approved', label: 'Approved Only' },
                  { id: 'generated', label: 'Generated Reviews' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setReviewFilter(f.id as any);
                      loadReviews();
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      reviewFilter === f.id ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Reviews List */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div className="divide-y divide-slate-800">
                  {reviews.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">No reviews found matching this filter.</div>
                  ) : (
                    reviews.map((rev) => (
                      <div key={rev._id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white">{rev.reviewerName}</span>
                            <span className="text-amber-400 font-semibold text-xs">★ {rev.rating}</span>
                            {rev.isApproved ? (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800">
                                Approved on Website
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-amber-950 text-amber-400 border border-amber-800">
                                Pending Moderation
                              </span>
                            )}
                            {rev.isGenerated && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-purple-950 text-purple-400 border border-purple-800">
                                Demo Generated
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-300">"{rev.comment}"</p>
                          <div className="text-xs text-slate-500 flex items-center space-x-3">
                            <span>Post: {rev.post?.title || 'Unknown'}</span>
                            <span>•</span>
                            <span>{rev.visitDate}</span>
                            <span>•</span>
                            <span>{rev.reviewerStats}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {!rev.isApproved ? (
                            <button
                              onClick={() => handleApproveReview(rev._id)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold"
                            >
                              Approve
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRejectReview(rev._id)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-semibold"
                            >
                              Unapprove
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteReview(rev._id)}
                            className="px-3 py-1.5 bg-rose-950 text-rose-300 hover:bg-rose-900 border border-rose-800 rounded text-xs font-semibold"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: REVIEW GENERATOR */}
          {activeTab === 'generator' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Random Review Generator</h2>
                <p className="text-slate-400 text-sm">
                  Automatically generates realistic sample reviews for testing and populating profiles.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Select Target Profile
                    </label>
                    <select
                      value={genPostId}
                      onChange={(e) => setGenPostId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                      {posts.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.title} (@{p.displayName})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Quantity to Generate (1 - 50)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={genLimit}
                      onChange={(e) => setGenLimit(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleGenerateReviews}
                    disabled={isGenerating || !genPostId}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50"
                  >
                    {isGenerating ? 'Generating...' : '⚡ Generate Reviews Now'}
                  </button>
                  <span className="text-xs text-slate-500">
                    Generated reviews are marked with <code className="text-purple-400">isGenerated: true</code> and stay unpublished until reviewed.
                  </span>
                </div>
              </div>

              {/* Preview of newly generated comments */}
              {generatedResults.length > 0 && (
                <div className="bg-slate-900 border border-purple-900/50 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white text-base">
                      Generated Reviews Preview ({generatedResults.length})
                    </h3>
                    <button
                      onClick={() => {
                        setActiveTab('reviews');
                        setReviewFilter('pending');
                      }}
                      className="text-xs text-blue-400 hover:underline"
                    >
                      Go to Moderation Queue →
                    </button>
                  </div>

                  <div className="divide-y divide-slate-800">
                    {generatedResults.map((r, i) => (
                      <div key={r._id || i} className="py-3 flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-sm text-slate-200">{r.reviewerName}</span>
                            <span className="text-amber-400 text-xs">★ {r.rating}</span>
                            <span className="text-xs text-slate-500">• {r.visitDate}</span>
                          </div>
                          <p className="text-xs text-slate-300 mt-1 italic">"{r.comment}"</p>
                        </div>
                        <button
                          onClick={() => handleApproveReview(r._id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded"
                        >
                          Approve
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: USERS */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white">User Accounts</h2>
                <p className="text-slate-400 text-sm">Manage registered users, administrators, and permissions</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-4">User</th>
                      <th className="px-5 py-4">Role</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {usersList.map((user) => (
                      <tr key={user._id}>
                        <td className="px-5 py-4">
                          <div className="font-bold text-white">{user.name}</div>
                          <div className="text-xs text-slate-500">{user.email}</div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                              user.role === 'admin' ? 'bg-purple-950 text-purple-400 border border-purple-800' : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              user.isBlock ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            }`}
                          >
                            {user.isBlock ? 'Blocked' : 'Active'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {user.role !== 'admin' && (
                            <button
                              onClick={() => handleToggleBlockUser(user)}
                              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors"
                            >
                              {user.isBlock ? 'Unblock' : 'Block User'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* CREATE / EDIT POST MODAL */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex justify-center items-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3 sticky top-0 bg-slate-900 z-10">
              <h3 className="text-lg font-bold text-white">
                {editingPostId ? 'Edit Profile Post' : 'Upload & Create Profile Post'}
              </h3>
              <button
                onClick={() => setShowPostModal(false)}
                className="text-slate-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePost} className="space-y-4 text-xs">
              {/* IMAGE UPLOAD SECTION */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <label className="text-slate-200 font-bold block text-sm">
                  📸 Profile Images & Gallery (Cloudinary / File Upload)
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="text-slate-400 text-xs file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                  />
                  {uploadingFiles && <span className="text-blue-400 animate-pulse">Uploading to storage...</span>}
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Or paste Main Image URL:</label>
                  <input
                    type="url"
                    value={postForm.mainImage}
                    onChange={(e) => setPostForm({ ...postForm, mainImage: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded text-white"
                    placeholder="https://..."
                  />
                </div>

                {/* Thumbnails preview */}
                {postForm.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {postForm.images.map((img, idx) => (
                      <div key={idx} className="relative group w-14 h-14 rounded overflow-hidden border border-slate-700">
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            const filtered = postForm.images.filter((_, i) => i !== idx);
                            setPostForm({ ...postForm, images: filtered });
                          }}
                          className="absolute inset-0 bg-red-600/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center font-bold text-xs transition-opacity"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* BASIC INFO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Title *</label>
                  <input
                    type="text"
                    required
                    value={postForm.title}
                    onChange={(e) => setPostForm({ ...postForm, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-white"
                    placeholder="Sexy snow bunny CUCKOLD SPECIAL"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold mb-1 block">Display Name (Handle) *</label>
                  <input
                    type="text"
                    required
                    value={postForm.displayName}
                    onChange={(e) => setPostForm({ ...postForm, displayName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-white"
                    placeholder="miaa_snow"
                  />
                </div>
              </div>

              {/* DEMOGRAPHICS */}
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Category</label>
                  <input
                    type="text"
                    value={postForm.category}
                    onChange={(e) => setPostForm({ ...postForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Age</label>
                  <input
                    type="number"
                    value={postForm.age}
                    onChange={(e) => setPostForm({ ...postForm, age: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Gender</label>
                  <input
                    type="text"
                    value={postForm.gender}
                    onChange={(e) => setPostForm({ ...postForm, gender: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Ethnicity</label>
                  <input
                    type="text"
                    value={postForm.ethnicity}
                    onChange={(e) => setPostForm({ ...postForm, ethnicity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-white"
                  />
                </div>
              </div>

              {/* LOCATION & PHONE */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">City</label>
                  <input
                    type="text"
                    value={postForm.city}
                    onChange={(e) => setPostForm({ ...postForm, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">State</label>
                  <input
                    type="text"
                    value={postForm.state}
                    onChange={(e) => setPostForm({ ...postForm, state: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Phone</label>
                  <input
                    type="text"
                    value={postForm.phone}
                    onChange={(e) => setPostForm({ ...postForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-white"
                  />
                </div>
              </div>

              {/* DONATIONS & PAYMENTS */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Donations</label>
                  <input
                    type="text"
                    value={postForm.donations}
                    onChange={(e) => setPostForm({ ...postForm, donations: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Payment Types (comma-separated)</label>
                  <input
                    type="text"
                    value={postForm.paymentMethods}
                    onChange={(e) => setPostForm({ ...postForm, paymentMethods: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-white"
                  />
                </div>
              </div>

              {/* PHYSICAL ATTRIBUTES */}
              <div className="grid grid-cols-5 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Eyes</label>
                  <input
                    type="text"
                    value={postForm.eyes}
                    onChange={(e) => setPostForm({ ...postForm, eyes: e.target.value })}
                    className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Hair</label>
                  <input
                    type="text"
                    value={postForm.hair}
                    onChange={(e) => setPostForm({ ...postForm, hair: e.target.value })}
                    className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Hair Length</label>
                  <input
                    type="text"
                    value={postForm.hairLength}
                    onChange={(e) => setPostForm({ ...postForm, hairLength: e.target.value })}
                    className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Grooming</label>
                  <input
                    type="text"
                    value={postForm.grooming}
                    onChange={(e) => setPostForm({ ...postForm, grooming: e.target.value })}
                    className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Chest</label>
                  <input
                    type="text"
                    value={postForm.chest}
                    onChange={(e) => setPostForm({ ...postForm, chest: e.target.value })}
                    className="w-full px-2 py-1 bg-slate-950 border border-slate-800 rounded text-white"
                  />
                </div>
              </div>

              {/* TAB 1: ABOUT SECTION CONFIG */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                <div className="font-semibold text-slate-300">About Tab Configuration</div>
                <div>
                  <label className="text-slate-400 block mb-1">Outcall Notice Banner</label>
                  <input
                    type="text"
                    value={postForm.aboutNotice}
                    onChange={(e) => setPostForm({ ...postForm, aboutNotice: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Warnings / Prohibited Limits</label>
                  <input
                    type="text"
                    value={postForm.aboutWarnings}
                    onChange={(e) => setPostForm({ ...postForm, aboutWarnings: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">My 'No' List (comma-separated)</label>
                  <input
                    type="text"
                    value={postForm.noList}
                    onChange={(e) => setPostForm({ ...postForm, noList: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-white"
                  />
                </div>
              </div>

              {/* TAB 3: SCHEDULE CONFIG */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                <div className="font-semibold text-slate-300">Schedule Tab Configuration</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Working Hours</label>
                    <input
                      type="text"
                      value={postForm.workingHours}
                      onChange={(e) => setPostForm({ ...postForm, workingHours: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Working Days</label>
                    <input
                      type="text"
                      value={postForm.workingDays}
                      onChange={(e) => setPostForm({ ...postForm, workingDays: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-white"
                    />
                  </div>
                </div>
              </div>

              {/* TAB 4: SCREENING CONFIG */}
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                <div className="font-semibold text-slate-300">Screening Tab Configuration</div>
                <div>
                  <label className="text-slate-400 block mb-1">Screening Requirements</label>
                  <input
                    type="text"
                    value={postForm.screeningRequirements}
                    onChange={(e) => setPostForm({ ...postForm, screeningRequirements: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-400 block mb-1">Deposit Amount</label>
                    <input
                      type="text"
                      value={postForm.depositAmount}
                      onChange={(e) => setPostForm({ ...postForm, depositAmount: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Instructions</label>
                    <input
                      type="text"
                      value={postForm.screeningInstructions}
                      onChange={(e) => setPostForm({ ...postForm, screeningInstructions: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800 sticky bottom-0 bg-slate-900 py-2">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold shadow-lg"
                >
                  {editingPostId ? 'Update & Sync to Website' : 'Upload & Publish to Website'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
