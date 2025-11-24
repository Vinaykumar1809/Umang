import React from 'react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => (
  <div className="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-800 rounded-xl">
    <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>
    <div className="grid gap-6 md:grid-cols-3">
      <Link to="/admin/posts" className="bg-primary-600 text-white p-8 rounded-lg text-center hover:bg-primary-700">
        Pending Posts
      </Link>
       <Link to="/admin/edit-requests" className="bg-primary-600 text-white p-8 rounded-lg text-center hover:bg-primary-700">
        Review Edit Requests
      </Link>
      <Link to="/admin/users" className="bg-primary-600 text-white p-8 rounded-lg text-center hover:bg-primary-700">
        Users
      </Link>
      <Link to="/admin/announcements" className="bg-primary-600 text-white p-8 rounded-lg text-center hover:bg-primary-700">
        Announcements
      </Link>
      <Link to="/admin/about" className="bg-primary-600 text-white p-8 rounded-lg text-center hover:bg-primary-700">
       About Us
      </Link>
       <Link to="/admin/gallery" className="bg-primary-600 text-white p-8 rounded-lg text-center hover:bg-primary-700">
      Gallery
      </Link>
      <Link to="/admin/cleanup" className="bg-primary-600 text-white p-8 rounded-lg text-center hover:bg-primary-700">
       Image Cleanup
      </Link>
      
    </div>
  </div>
);

export default AdminDashboard;
