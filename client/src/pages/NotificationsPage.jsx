import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import moment from 'moment';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaCheckCircle, FaTrash, FaInbox } from 'react-icons/fa';
import { useSocket } from '../../context/socketContext';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const navigate = useNavigate();
  const { socket } = useSocket();

  useEffect(() => {
    fetchNotifications(1);
    markAllAsRead();

    //  Listen for new notifications via socket
    if (socket) {
      const handleNewNotification = (notification) => {
        console.log('🔔 New notification received:', notification);
        // Update UI immediately with new notification
        setNotifications(prev => [notification, ...prev]);
        toast.success(notification.title, {
          icon: '🔔',
          duration: 4000,
          position: 'top-right'
        });
      };

      socket.on('notification', handleNewNotification);

      return () => {
        socket.off('notification', handleNewNotification);
      };
    }
  }, [socket]);

  const fetchNotifications = async (pageNum) => {
    setLoading(true);
    try {
      const res = await api.get('/notifications', { params: { page: pageNum, limit: 20 } });
      const data = res.data.data;
      setNotifications(prev => pageNum === 1 ? data : [...prev, ...data]);
      setHasMore(pageNum < res.data.pagination.pages);
    } catch {
      toast.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  // Mark all as read - Update UI immediately
  const markAllAsRead = async () => {
    try {
  
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

      await api.put('/notifications/mark-all-read');
    } catch {
 
      await fetchNotifications(1);
    }
  };

  
  const handleRead = async (id) => {
    try {
   
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));


      await api.put(`/notifications/${id}/read`);
    } catch {

      await fetchNotifications(1);
      toast.error('Failed to mark as read');
    }
  };

  //  Delete notification - Update UI immediately
  const handleDelete = async (id) => {
    try {
    
      setNotifications(prev => prev.filter(n => n._id !== id));

   
      await api.delete(`/notifications/${id}`);
      toast.success('Notification deleted');
    } catch {
  
      await fetchNotifications(1);
      toast.error('Failed to delete notification');
    }
  };

  // Clear read notifications - Update UI immediately
  const handleClearRead = async () => {
    try {
   
      setNotifications(prev => prev.filter(n => !n.isRead));

      await api.delete('/notifications/read/clear');
      toast.success('Cleared read notifications');
    } catch {
     
      await fetchNotifications(1);
      toast.error('Failed to clear read');
    }
  };

  const loadMore = () => {
    if (!hasMore || loading) return;
    const next = page + 1;
    fetchNotifications(next);
    setPage(next);
  };

  // Handle notification title click - redirect based on type
const handleNotificationClick = async (notification) => {
  try {
    if (!notification.isRead) {
      await handleRead(notification._id);
    }

    switch (notification.type) {
      case 'post_approved':
      case 'post_published':
        if (notification.metadata?.postId) {
          navigate(`/blog/${notification.metadata.postId}`);
        }
        break;

      case 'post_pending':
        navigate('/admin/posts');
        break;

      case 'post_edit_request':
        navigate('/admin/edit-requests');
        break;

      case 'post_edit_approved':
        if (notification.metadata?.postId) {
          navigate(`/blog/${notification.metadata.postId}`);
        }
        break;

      case 'post_edit_rejected':
        navigate('/member/posts?status=published');
        break;

      case 'post_rejected':
        navigate('/member/posts?status=rejected');
        break;

      case 'post_liked':
        if (notification.metadata?.postId) {
          navigate(`/blog/${notification.metadata.postId}`);
        }
        break;

      case 'comment_added':
      case 'comment_liked':
      case 'comment_replied':
        if (notification.metadata?.postId && notification.metadata?.commentId) {
          // Navigate to post with comment hash
          navigate(`/blog/${notification.metadata.postId}#comment-${notification.metadata.commentId}`);
          
          // Scroll to comment after navigation
          setTimeout(() => {
            const commentElement = document.getElementById(`comment-${notification.metadata.commentId}`);
            if (commentElement) {
              commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              // Highlight the comment briefly
              commentElement.style.backgroundColor = 'rgba(33, 128, 141, 0.1)';
              setTimeout(() => {
                commentElement.style.backgroundColor = '';
              }, 2000);
            }
          }, 500);
        }
        break;

      case 'announcement_created':
        navigate('/announcements');
        break;

      case 'role_changed':
        navigate('/dashboard');
        break;

      default:
        console.warn('Unknown notification type:', notification.type);
    }
  } catch (error) {
    console.error('Error handling notification click:', error);
  }
};


  // Determine if notification is clickable based on type
  const isClickable = (notification) => {
    const clickableTypes = [
      'post_approved',
      'post_published',
      'post_rejected',
      'post_pending',
      'post_edit_request',
      'post_edit_approved',
      'post_edit_rejected',
      'post_liked',
      'comment_added',
      'comment_liked',
      'comment_replied',
      'announcement_created',
      'role_changed'
    ];
    return clickableTypes.includes(notification.type);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="flex items-center space-x-3 mb-8">
          <FaBell className="text-3xl text-primary-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
        </div>

        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <button
            onClick={markAllAsRead}
            className="px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 text-sm transition"
          >
            Mark all as read
          </button>
          <button
            onClick={handleClearRead}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm transition"
          >
            Clear read notifications
          </button>
        </div>

        {loading && <div className="text-center py-6 text-gray-500">Loading...</div>}

        {!loading && notifications.length === 0 && (
          <div className="text-center py-12">
            <FaInbox className="text-4xl mb-2 text-gray-400 mx-auto" />
            <p className="text-gray-500">No notifications found.</p>
          </div>
        )}

        <ul className="space-y-4">
          {notifications.map(n => (
            <li
              key={n._id}
              className={`p-4 rounded-lg shadow bg-white dark:bg-gray-800 flex justify-between items-start gap-4 transition ${
                n.isRead ? 'opacity-70' : 'border-l-4 border-primary-600'
              }`}
            >
              <div className="flex-1 min-w-0">
                {/* Clickable Title */}
                <button
                  onClick={() => handleNotificationClick(n)}
                  disabled={!isClickable(n)}
                  className={`text-left w-full ${
                    isClickable(n)
                      ? 'text-gray-900 dark:text-white font-semibold hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer transition'
                      : 'text-gray-900 dark:text-white font-semibold'
                  }`}
                  title={isClickable(n) ? 'Click to view' : ''}
                >
                  {n.title}
                  {isClickable(n) && <span className="ml-2 text-xs text-primary-600">→</span>}
                </button>

                <p className="text-gray-700 dark:text-gray-300 mt-1 text-sm">{n.message}</p>
                <p className="text-xs text-gray-400 mt-2">{moment(n.createdAt).fromNow()}</p>

                {/* Display rejection reason if exists */}
                {n.metadata?.rejectionReason && (
                  <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm">
                    <p className="text-red-800 dark:text-red-200">
                      <span className="font-semibold">Reason:</span> {n.metadata.rejectionReason}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {!n.isRead && (
                  <button
                    onClick={() => handleRead(n._id)}
                    className="text-green-600 hover:text-green-700 transition"
                    title="Mark as read"
                  >
                    <FaCheckCircle size={18} />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(n._id)}
                  className="text-red-500 hover:text-red-700 transition"
                  title="Delete notification"
                >
                  <FaTrash size={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>

        {!loading && hasMore && notifications.length > 0 && (
          <div className="text-center mt-8">
            <button
              onClick={loadMore}
              className="px-6 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
