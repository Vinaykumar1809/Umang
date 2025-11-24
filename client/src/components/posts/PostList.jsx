import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import PostCard from './PostCard';
import toast from 'react-hot-toast';
import { FaSearch } from 'react-icons/fa';

const PostList = ({ initialSearch = '' }) => {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(initialSearch);
  const [debounceTimer, setDebounceTimer] = useState(null);

  const fetchPosts = useCallback(async (pageNumber, searchTerm) => {
    setLoading(true);
    try {
      const res = await axios.get('/api/posts', {
        params: { limit: 10, page: pageNumber, search: searchTerm,sort: '-createdAt' }
      });
      if (pageNumber === 1) {
        setPosts(res.data.data);
      } else {
        setPosts(prev => [...prev, ...res.data.data]);
      }
      setHasMore(pageNumber < res.data.pagination.pages);
    } catch (error) {
      toast.error('Failed to fetch posts');
    }
    setLoading(false);
  }, []);

  // Debounce search input to avoid firing on every keystroke
  useEffect(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    const timer = setTimeout(() => {
      setPage(1);
      fetchPosts(1, search);
    }, 500); // 500ms debounce
    setDebounceTimer(timer);

    return () => clearTimeout(timer); // cleanup on unmount or search change
  }, [search, fetchPosts]);

  const loadMore = () => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    fetchPosts(nextPage, search);
    setPage(nextPage);
  };

  return (
    <>
      {/* Search input with icon */}
      <div className="mb-4 flex justify-center">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search posts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
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

      {/* Posts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map(post => <PostCard key={post._id} post={post} />)}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="mt-6 text-center text-gray-600 animate-pulse">Loading...</div>
      )}

      {/* Load More Button */}
      {!loading && hasMore && (
        <div className="mt-6 text-center">
          <button
            onClick={loadMore}
            className="px-6 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition"
          >
            Load More
          </button>
        </div>
      )}

      {/* No more posts */}
      {!hasMore && posts.length > 0 && (
        <div className="mt-6 text-center text-gray-500">No more posts</div>
      )}

      {/* No posts found */}
      {posts.length === 0 && !loading && (
        <div className="mt-6 text-center text-gray-500">No posts found</div>
      )}
    </>
  );
};

export default PostList;
