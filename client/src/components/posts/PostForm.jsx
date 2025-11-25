import React, { useEffect, useState } from 'react';
import axios from 'axios';
import api from '../../utils/api';
import PostCard from './PostCard';

const PostList = ({ query = '' }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const res = await api.get(`/posts?search=${query}`);
      setPosts(res.data.data);
      setLoading(false);
    };
    fetchPosts();
  }, [query]);

  if (loading) return <div>Loading...</div>;
  if (!posts.length) return <div>No posts found.</div>;

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map(post => <PostCard key={post._id} post={post} />)}
    </div>
  );
};

export default PostList;
