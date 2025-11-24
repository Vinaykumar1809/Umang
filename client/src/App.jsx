import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { AuthProvider } from '../context/authContext.jsx';
import { SocketProvider } from '../context/socketContext.jsx';

// Common Components
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';
import RoleRoute from './components/common/RoleRoute';

// Pages
import Home from './pages/Home';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import BlogPage from './pages/BlogPage';
import PostDetail from './components/posts/PostDetail';
import Profile from './pages/Profile';
import AnnouncementsPage from './pages/AnnouncementsPage';

import AboutPage from './pages/AboutPage.jsx';
import Gallery from './pages/Gallery.jsx';
import NotificationsPage from './pages/NotificationsPage';
import CreatePost from './pages/CreatePost';
import EditPost from './pages/EditPost';
import SearchPage from './pages/SearchPage.jsx';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

// Admin Components
import AdminDashboard from './components/admin/AdminDashboard';
import PostApproval from './components/admin/PostApproval';
import UserManagement from './components/admin/UserManagement';
import AnnouncementManager from './components/admin/AnnouncementManager';
import AboutUsManager from './components/admin/AboutUsManager';
import GalleryManager from './components/admin/GalleryManager.jsx';
import CreateAnnouncement from './pages/CreateAnnouncement';
import EditAnnouncement from './pages/EditAnnouncement';
import EditRequestApproval from './components/admin/EditRequestApproval';
import AdminCleanup from './components/admin/AdminCleanup.jsx';

// Member Components
import MemberDashboard from './components/member/MemberDashboard';
import DraftPosts from './components/member/DraftPosts';
import MyPosts from './components/member/MyPosts';

import './index.css';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <Header />
            <main className="flex-grow">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:id" element={<PostDetail />} />
                <Route path="/announcements" element={<AnnouncementsPage />} />
                <Route path="/about" element={<AboutPage />} />
                 <Route path="/gallery" element={<Gallery />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/privacy-policy" element={<Privacy />} />
                <Route path="/terms-of-service" element={<Terms />} />

                {/* Protected Routes */}
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />

                {/* Member Routes - Authenticated users with MEMBER or ADMIN roles */}
                <Route
                  path="/member"
                  element={
                    <RoleRoute allowedRoles={['MEMBER', 'ADMIN']}>
                      <MemberDashboard />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/member/create-post"
                  element={
                    <RoleRoute allowedRoles={['MEMBER', 'ADMIN']}>
                      <CreatePost />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/member/edit-post/:id"
                  element={
                    <RoleRoute allowedRoles={['MEMBER', 'ADMIN']}>
                      <EditPost />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/member/drafts"
                  element={
                    <RoleRoute allowedRoles={['MEMBER', 'ADMIN']}>
                      <DraftPosts />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/member/posts"
                  element={
                    <RoleRoute allowedRoles={['MEMBER', 'ADMIN']}>
                      <MyPosts />
                    </RoleRoute>
                  }
                />

                {/* Admin Routes - For ADMIN role only */}
                <Route
                  path="/admin"
                  element={
                    <RoleRoute allowedRoles={['ADMIN']}>
                      <AdminDashboard />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/admin/posts"
                  element={
                    <RoleRoute allowedRoles={['ADMIN']}>
                      <PostApproval />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/admin/edit-requests"
                  element={
                    <RoleRoute allowedRoles={['ADMIN']}>
                      <EditRequestApproval />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <RoleRoute allowedRoles={['ADMIN']}>
                      <UserManagement />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/admin/announcements"
                  element={
                    <RoleRoute allowedRoles={['ADMIN']}>
                      <AnnouncementManager />
                    </RoleRoute>
                  }
                />
                 <Route
                  path="/admin/gallery"
                  element={
                    <RoleRoute allowedRoles={['ADMIN']}>
                      <GalleryManager />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/admin/edit-announcement/:id"
                  element={
                    <RoleRoute allowedRoles={['ADMIN']}>
                      <EditAnnouncement />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/admin/create-announcement"
                  element={
                    <RoleRoute allowedRoles={['ADMIN']}>
                      <CreateAnnouncement />
                    </RoleRoute>
                  }
                />
                <Route
                  path="/admin/about"
                  element={
                    <RoleRoute allowedRoles={['ADMIN']}>
                      <AboutUsManager />
                    </RoleRoute>
                  }
                />
                
                   <Route
                  path="/admin/cleanup"
                  element={
                    <RoleRoute allowedRoles={['ADMIN']}>
                      <AdminCleanup />
                    </RoleRoute>
                  }
                />
                
                {/* 404 - Not Found Route */}
                <Route
                  path="*"
                  element={
                    <div className="min-h-screen flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
                        <p className="text-gray-600 dark:text-gray-400">
                          Page not found
                        </p>
                      </div>
                    </div>
                  }
                />
              </Routes>
            </main>
            <Footer />
          </div>

          {/* React Hot Toast notification container */}
          <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={8}
            toastOptions={{
              duration: 4000,
              style: { background: '#363636', color: '#fff' },
              success: { duration: 3000, theme: { primary: '#4aed88' } },
            }}
          />
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
