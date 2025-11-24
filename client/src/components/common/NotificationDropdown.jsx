import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import { FaCheck, FaTimes, FaBell, FaCheckDouble } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useSocket } from '../../../context/SocketContext';

const NotificationDropdown = ({ onClose = () => {}, onUpdateCount = () => {} }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const { socket } = useSocket();

  // Update parent when notifications change
  useEffect(() => {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    onUpdateCount(unreadCount);
  }, [notifications, onUpdateCount]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    fetchNotifications();

    const handleClickOutside = (e) => {
      if (!isMobile && containerRef.current && !containerRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKey);

    //  REAL-TIME: Listen for new notifications via socket
    if (socket) {
      const handleNewNotification = (notification) => {
        console.log('🔔 New notification received:', notification);
        // Just update state, don't call parent callback here
        setNotifications(prev => [notification, ...prev]);
        toast.success(notification.title, {
          icon: '🔔',
          duration: 4000,
          position: 'top-right'
        });
      };

      socket.on('notification', handleNewNotification);

      return () => {
        window.removeEventListener('resize', handleResize);
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('keydown', handleKey);
        socket.off('notification', handleNewNotification);
      };
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, [isMobile, socket, onClose]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications?limit=5');
      const list = res.data.data || [];
      setNotifications(list);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  //  Mark as read - Update UI immediately
  const markAsRead = async (id) => {
    try {
      // Update UI immediately (Optimistic Update)
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
      // Send to server
      await api.put(`/notifications/${id}/read`);
    } catch {
      //  Rollback if error
      await fetchNotifications();
      toast.error('Failed to mark notification as read');
    }
  };

  //Delete notification - Update UI immediately
  const deleteNotification = async (id) => {
    try {
      // Update UI immediately (Optimistic Update)
      setNotifications(prev => prev.filter(n => n._id !== id));
      // Send delete to server
      await api.delete(`/notifications/${id}`);
      toast.success('Notification deleted');
    } catch {
      //rollback if error
      await fetchNotifications();
      toast.error('Failed to delete notification');
    }
  };

  // Handle notification click - redirect based on type
  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read
      if (!notification.isRead) {
        await markAsRead(notification._id);
      }

      // Navigate based on type
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

        default:
          break;
      }

      onClose();
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

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
      'announcement_created'
    ];
    return clickableTypes.includes(notification.type);
  };

  const Header = ({ compact = false }) => (
    <div className={`flex items-center justify-between px-4 py-3 ${compact ? '' : 'border-b border-gray-200 dark:border-gray-600'}`}>
      <div className="flex items-center gap-3">
        <FaBell className="text-lg text-white" />
        <h3 className="font-semibold text-white">Notifications</h3>
      </div>
      <div className="flex items-center gap-2">
        {notifications.some(n => !n.isRead) && (
          <button onClick={() => notifications.forEach(n => markAsRead(n._id))} className="text-sm hover:underline text-white/90">
            <FaCheckDouble /> <span>Mark all</span>
          </button>
        )}
        <button onClick={onClose} className="p-1 rounded hover:bg-white/10">
          <FaTimes className="text-white" />
        </button>
      </div>
    </div>
  );

  const NotificationItem = ({ n }) => (
    <div
      className={`border-b border-gray-100 dark:border-gray-700 p-3 flex items-start space-x-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600/30 transition ${
        !n.isRead ? 'bg-primary-50 dark:bg-primary-900/10' : ''
      }`}
      onClick={() => isClickable(n) && handleNotificationClick(n)}
    >
      <FaBell className="text-2xl text-gray-500 dark:text-gray-400 mt-1 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 dark:text-white text-sm line-clamp-2">
          {n.title}
          {isClickable(n) && <span className="ml-2 text-xs text-primary-600">→</span>}
        </p>
        <p className="text-gray-600 dark:text-gray-300 text-sm mt-1 line-clamp-2">{n.message}</p>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span>{moment(n.createdAt).fromNow()}</span>
        </div>

        {/* Show rejection reason if exists */}
        {n.metadata?.rejectionReason && (
          <div className="mt-2 p-1 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs">
            <p className="text-red-700 dark:text-red-300">
              <span className="font-semibold">Reason:</span> {n.metadata.rejectionReason}
            </p>
          </div>
        )}
      </div>
      <div className="flex flex-col items-end gap-2 ml-3 flex-shrink-0">
        {!n.isRead && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              markAsRead(n._id);
            }}
            className="text-xs px-2 py-1 rounded bg-primary-600 text-white hover:bg-primary-700"
          >
            <FaCheck />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteNotification(n._id);
          }}
          className="text-xs px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <FaTimes />
        </button>
      </div>
    </div>
  );

  // Mobile full-screen
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50">
        <div ref={containerRef} className="fixed inset-y-0 right-0 left-0 bg-white dark:bg-gray-900 overflow-auto">
          <div className="bg-primary-600"><Header compact /></div>
          <div className="p-3">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <FaBell className="text-4xl text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-400">No notifications</p>
              </div>
            ) : (
              notifications.map(n => <NotificationItem key={n._id} n={n} />)
            )}
          </div>
          {notifications.length > 0 && (
            <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 text-center sticky bottom-0">
              <button
                onClick={() => {
                  navigate('/notifications');
                  onClose();
                }}
                className="text-primary-600 dark:text-primary-400 hover:underline text-sm font-semibold"
              >
                View All Notifications
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop dropdown
  return (
    <div ref={containerRef} className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-700 rounded-lg shadow-2xl overflow-hidden z-50">
      <div className="bg-primary-600"><Header /></div>
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <FaBell className="text-4xl text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 dark:text-gray-400">No notifications</p>
          </div>
        ) : (
          notifications.map(n => <NotificationItem key={n._id} n={n} />)
        )}
      </div>
      {notifications.length > 0 && (
        <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 text-center">
          <button
            onClick={() => {
              navigate('/notifications');
              onClose();
            }}
            className="text-primary-600 dark:text-primary-400 hover:underline text-sm font-semibold"
          >
            View All Notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
