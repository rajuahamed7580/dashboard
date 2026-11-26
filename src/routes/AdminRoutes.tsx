import { Routes, Route, Navigate } from 'react-router-dom';
import AdminProtectedRoute from '../components/admin/AdminProtectedRoute';
import AdminLayout from '../layouts/AdminLayout';
import LoginPage from '../pages/auth/LoginPage';
import NotFoundPage from '../pages/NotFoundPage';
import DashboardPage from '../pages/admin/Dashboard/DashboardPage';
import UsersPage from '../pages/admin/Users/UsersPage';
import UserDetailsPage from '../pages/admin/Users/UserDetailsPage';
import PostsPage from '../pages/admin/Posts/PostsPage';
import CreatePostPage from '../pages/admin/Posts/CreatePostPage';
import PostDetailsPage from '../pages/admin/Posts/PostDetailsPage';
import EditPostPage from '../pages/admin/Posts/EditPostPage';
import CommentsPage from '../pages/admin/Comments/CommentsPage';
import CommentDetailsPage from '../pages/admin/Comments/CommentDetailsPage';
import CommentGeneratorPage from '../pages/admin/CommentGenerator/CommentGeneratorPage';
import CustomUrlsPage from '../pages/admin/CustomUrls/CustomUrlsPage';
import ProfilePage from '../pages/admin/Profile/ProfilePage';
import SettingsPage from '../pages/admin/Settings/SettingsPage';

export default function AdminRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

      {/* Protected Admin Routes */}
      <Route element={<AdminProtectedRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />

          {/* Users Module */}
          <Route path="users" element={<UsersPage />} />
          <Route path="users/:id" element={<UserDetailsPage />} />

          {/* Posts Module */}
          <Route path="posts" element={<PostsPage />} />
          <Route path="posts/create" element={<CreatePostPage />} />
          <Route path="posts/:id" element={<PostDetailsPage />} />
          <Route path="posts/:id/edit" element={<EditPostPage />} />

          {/* Comments Module */}
          <Route path="comments" element={<CommentsPage />} />
          <Route path="comments/:id" element={<CommentDetailsPage />} />

          {/* Content Management */}
          <Route path="comment-generator" element={<CommentGeneratorPage />} />
          <Route path="custom-urls" element={<CustomUrlsPage />} />

          {/* Account */}
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
