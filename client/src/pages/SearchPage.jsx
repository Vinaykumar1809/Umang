import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import api from '../utils/api';
import PostCard from '../components/posts/PostCard';
import toast from 'react-hot-toast';
import { FaSearch } from 'react-icons/fa';

const SearchPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState(null);

  // Fetch posts by content keywords or author username
  const fetchPosts = useCallback(async (query) => {
    if (!query.trim()) {
      setPosts([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get('/posts/search', {
        params: { q: query }
      });
      setPosts(res.data.data);
    } catch (error) {
      toast.error('Failed to fetch posts');
    }
    setLoading(false);
  }, []);

  // Debounce search input changes
  useEffect(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => {
      fetchPosts(searchTerm);
    }, 500);
    setDebounceTimer(timer);

    return () => clearTimeout(timer);
  }, [searchTerm, fetchPosts]);

  return (
    <div className="container mx-auto px-6 py-8 max-w-5xl">
      <div className="mb-6 flex justify-center">
        <div className="relative w-full max-w-md">
          <input
            type="search"
            placeholder="Search posts or author..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="block w-full rounded-full border border-gray-300 py-2 pl-10 pr-4 shadow-sm
                       focus:border-primary-600 focus:ring focus:ring-primary-300 focus:ring-opacity-50
                       dark:bg-gray-800 dark:border-gray-600 dark:focus:border-primary-500
                       dark:text-white transition"
          />
          <FaSearch
            className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500 pointer-events-none"
            size={18}
          />
        </div>
      </div>

      {loading && (
        <div className="text-center text-gray-600 animate-pulse">Loading posts...</div>
      )}

      {!loading && posts.length === 0 && searchTerm.trim() !== '' && (
        <div className="text-center text-gray-500 mt-6">No posts found</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map(post => (
          <PostCard key={post._id} post={post} />
        ))}
      </div>
    </div>
  );
};

export default SearchPage;
