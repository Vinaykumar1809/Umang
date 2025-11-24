import React from 'react';
import PostList from '../components/posts/PostList';

const BlogPage = () => (
  <div className="container mx-auto py-8">
    <h1 className="text-3xl font-bold mb-4">All Posts</h1>
    <PostList />
  </div>
);

export default BlogPage;
