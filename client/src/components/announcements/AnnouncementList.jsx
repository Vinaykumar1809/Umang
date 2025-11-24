import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AnnouncementCard from './AnnouncementCard';
import toast from 'react-hot-toast';

const AnnouncementList = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const fetchAnnouncements = async (pageNum) => {
    setLoading(true);
    try {
      const res = await axios.get('/api/announcements', { params: { limit: 10, page: pageNum } });
      if (pageNum === 1) {
        setAnnouncements(res.data.data);
      } else {
        setAnnouncements(prev => [...prev, ...res.data.data]);
      }
      setHasMore(pageNum < res.data.pagination.pages);
    } catch (err) {
      toast.error('Failed to load announcements');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAnnouncements(1);
  }, []);

  const loadMore = () => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    fetchAnnouncements(nextPage);
    setPage(nextPage);
  };

  return (
    <>
      <div className="space-y-6">
        {announcements.map(ann => (
          <AnnouncementCard key={ann._id} announcement={ann} />
        ))}
      </div>

      {loading && <div className="text-center mt-6">Loading...</div>}

      {!loading && hasMore && (
        <div className="text-center mt-6">
          <button onClick={loadMore} className="px-6 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition">
            Load More
          </button>
        </div>
      )}

      {!hasMore && announcements.length > 0 && (
        <div className="text-center mt-6 text-gray-500">No more announcements</div>
      )}

      {announcements.length === 0 && !loading && (
        <div className="text-center mt-6 text-gray-500">No announcements found</div>
      )}
    </>
  );
};

export default AnnouncementList;
