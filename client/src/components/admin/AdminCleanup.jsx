import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { FaSync, FaTrash, FaCheckCircle, FaExclamationCircle, FaSpinner } from 'react-icons/fa';

const AdminCleanup = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [cleanupHistory, setCleanupHistory] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);

  // Load cleanup stats on component mount
  useEffect(() => {
    fetchStats();
    // Optionally refresh stats every 5 minutes
    const interval = setInterval(fetchStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Fetch cleanup statistics from backend
   */
  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/cleanup/stats');
      
      if (data.success) {
        setStats(data.data);
        toast.success('Statistics updated');
      } else {
        toast.error('Failed to fetch statistics');
      }
    } catch (error) {
      console.error('Error fetching cleanup stats:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Run cleanup with specified age filter
   */
  const runCleanup = async (minAgeDays = 0) => {
    try {
      setCleaning(true);
      const { data } = await api.post('/cleanup/orphaned-images', {
        minAgeDays
      });

      if (data.success) {
        const result = data.data;
        
        // Add to cleanup history
        const historyEntry = {
          timestamp: new Date().toLocaleString(),
          deletedCount: result.deletedCount,
          errorCount: result.errorCount,
          totalOrphaned: result.totalOrphaned,
          duration: result.duration,
          minAgeDays
        };
        
        setCleanupHistory(prev => [historyEntry, ...prev].slice(0, 10)); // Keep last 10
        
        // Show success message
        toast.success(
          `✅ Cleanup completed!\n` +
          `Deleted: ${result.deletedCount} images\n` +
          `Duration: ${result.duration}\n` +
          `Errors: ${result.errorCount}`,
          { duration: 5 }
        );

        // Refresh stats
        await fetchStats();
        setShowConfirmation(false);
      }
    } catch (error) {
      console.error('Error running cleanup:', error);
      toast.error(error.response?.data?.message || 'Cleanup failed');
    } finally {
      setCleaning(false);
    }
  };

  /**
   * Handle cleanup action confirmation
   */
  const handleConfirmCleanup = async () => {
    if (selectedAction) {
      await runCleanup(selectedAction.minAgeDays);
    }
  };

  /**
   * Handle delete all orphaned images
   */
  const handleDeleteAll = () => {
    setSelectedAction({
      type: 'deleteAll',
      minAgeDays: 0,
      label: 'Delete ALL orphaned images'
    });
    setShowConfirmation(true);
  };

  /**
   * Handle delete images older than 1 day
   */
  const handleDeleteOldImages = () => {
    setSelectedAction({
      type: 'deleteOld',
      minAgeDays: 1,
      label: 'Delete images older than 1 day'
    });
    setShowConfirmation(true);
  };

  /**
   * Handle delete images older than 7 days
   */
  const handleDeleteVeryOldImages = () => {
    setSelectedAction({
      type: 'deleteVeryOld',
      minAgeDays: 7,
      label: 'Delete images older than 7 days'
    });
    setShowConfirmation(true);
  };

  return (
    <div className="min-h-screen  p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header  */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <FaTrash className="text-red-500" />
            Cleanup Manager
          </h1>
          <p className="text-gray-900 dark:text-white">
            Scan and delete orphaned images from your Cloudinary account
          </p>
        </div>

        {/* Statistics Grid */}
        {stats && !loading ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {/* Images in Database */}
              <div className="bg-white dark:bg-gray-800  rounded-lg shadow-md p-6 border-l-4 border-blue-500">
                <p className="text-gray-900 dark:text-white text-sm font-semibold mb-1">
                  Images in Database
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.imagesInDatabase}
                </p>
                <p className="text-gray-900 dark:text-white text-xs mt-2">Total referenced images</p>
              </div>

              {/* Images in Cloudinary */}
              <div className="bg-white dark:bg-gray-800  rounded-lg shadow-md p-6 border-l-4 border-purple-500">
                <p className="text-gray-900 dark:text-white text-sm font-semibold mb-1">
                  Images in Cloudinary
                </p>
                <p className="text-3xl font-bold text-purple-600">
                  {stats.imagesInCloudinary}
                </p>
                <p className="text-gray-900 dark:text-white text-xs mt-2">Total images uploaded</p>
              </div>

              {/* Orphaned Images */}
              <div className="bg-white dark:bg-gray-800  rounded-lg shadow-md p-6 border-l-4 border-red-500">
                <p className="text-gray-900 dark:text-white text-sm font-semibold mb-1">
                  Orphaned Images
                </p>
                <p className="text-3xl font-bold text-red-600">
                  {stats.orphanedImages}
                </p>
                <p className="text-gray-900 dark:text-white text-xs mt-2">Not used anywhere</p>
              </div>

              {/* Estimated Time */}
              <div className="bg-white dark:bg-gray-800  rounded-lg shadow-md p-6 border-l-4 border-green-500">
                <p className="text-gray-900 dark:text-white text-sm font-semibold mb-1">
                  Est. Cleanup Time
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.estimatedCleanupTime}
                </p>
                <p className="text-gray-900 dark:text-white text-xs mt-2">Approximate duration</p>
              </div>
            </div>

            {/* Orphaned Images Preview */}
            {stats.orphanedImagesList && stats.orphanedImagesList.length > 0 && (
              <div className="bg-white dark:bg-gray-800  rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FaExclamationCircle className="text-amber-500" />
                  Orphaned Images Preview (First 50)
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-64 overflow-y-auto">
                  {stats.orphanedImagesList.map((publicId, index) => (
                    <div key={index} className="text-xs bg-gray-100 p-2 rounded text-gray-700 break-words">
                      {publicId}
                    </div>
                  ))}
                </div>
                {stats.orphanedImages > 50 && (
                  <p className="text-sm text-gray-500 mt-3">
                    ... and {stats.orphanedImages - 50} more orphaned images
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Cleanup Actions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Refresh Stats Button */}
                <button
                  onClick={fetchStats}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
                >
                  <FaSync className={loading ? 'animate-spin' : ''} />
                  {loading ? 'Refreshing...' : 'Refresh Stats'}
                </button>

                {/* Delete Old Images Button (1+ days) */}
                <button
                  onClick={handleDeleteOldImages}
                  disabled={cleaning || stats.orphanedImages === 0}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
                >
                  <FaTrash />
                  {cleaning ? 'Cleaning...' : 'Delete (1+ Days Old)'}
                </button>

                {/* Delete All Orphaned Images Button */}
                <button
                  onClick={handleDeleteAll}
                  disabled={cleaning || stats.orphanedImages === 0}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
                >
                  <FaTrash />
                  {cleaning ? 'Cleaning...' : 'Delete All Orphaned'}
                </button>
              </div>

              {/* Additional delete option for very old images */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={handleDeleteVeryOldImages}
                  disabled={cleaning || stats.orphanedImages === 0}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors w-full md:w-1/3"
                >
                  <FaTrash />
                  {cleaning ? 'Cleaning...' : 'Delete (7+ Days Old)'}
                </button>
              </div>
            </div>
          </>
        ) : (
          // Loading State
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 flex flex-col items-center justify-center">
            <FaSpinner className="text-4xl text-blue-500 animate-spin mb-4" />
            <p className="text-gray-900 dark:text-white font-semibold">Loading statistics...</p>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmation && selectedAction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6 md:p-8">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FaExclamationCircle className="text-red-500" />
                Confirm Cleanup
              </h3>

              <p className="text-gray-900 dark:text-white mb-6">
                Are you sure you want to <strong>{selectedAction.label}</strong>?
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-amber-800">
                  <strong>This action cannot be undone.</strong> Make sure you have a backup if needed.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setShowConfirmation(false)}
                  disabled={cleaning}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmCleanup}
                  disabled={cleaning}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
                >
                  {cleaning ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Cleaning...
                    </>
                  ) : (
                    <>
                      <FaTrash />
                      Confirm Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cleanup History */}
        {cleanupHistory.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FaCheckCircle className="text-green-500" />
              Cleanup History
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b border-gray-300">
                  <tr>
                    <th className="text-left p-3 font-semibold text-gray-700">Timestamp</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Deleted</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Total</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Errors</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Duration</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Type</th>
                  </tr>
                </thead>
                <tbody>
                 
                  {cleanupHistory.map((entry, index) => (
                    <tr key={index} className="border-b border-gray-200 ">
                      <td className="p-3 text-gray-900 dark:text-white">{entry.timestamp}</td>
                      <td className="p-3">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                          {entry.deletedCount}
                        </span>
                      </td>
                      <td className="p-3 text-gray-900 dark:text-white">{entry.totalOrphaned}</td>
                      <td className="p-3">
                        {entry.errorCount > 0 ? (
                          <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-semibold">
                            {entry.errorCount}
                          </span>
                        ) : (
                          <span className="text-green-600 font-semibold">0</span>
                        )}
                      </td>
                      <td className="p-3 text-gray-900 dark:text-white">{entry.duration}</td>
                      <td className="p-3">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {entry.minAgeDays === 0 ? 'All' : `${entry.minAgeDays}+ days`}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Information Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">ℹ️ How It Works</h3>
          <ul className="text-blue-800 text-sm space-y-2">
            <li>
              <strong>Refresh Stats:</strong> Scans all schemas and Cloudinary to identify orphaned images.
            </li>
            <li>
              <strong>Delete (1+ Days Old):</strong> Only deletes images older than 1 day - safest option for production.
            </li>
            <li>
              <strong>Delete All Orphaned:</strong> Deletes all orphaned images immediately.
            </li>
            <li>
              <strong>Delete (7+ Days Old):</strong> Only deletes images older than 7 days - very conservative.
            </li>
            <li>
              <strong>Automatic Cleanup:</strong> Runs daily at 2 AM automatically (set in scheduler).
            </li>
            <li>
              <strong>Safety:</strong> Only deletes images NOT referenced in any database schema.
            </li>
          </ul>
        </div>

        {/* Warning Box */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mt-4">
          <h3 className="text-lg font-semibold text-amber-900 mb-3">⚠️ Important Notes</h3>
          <ul className="text-amber-800 text-sm space-y-2">
            <li>
              ✓ The cleanup service scans <strong>ALL 7 schemas</strong>: Posts, Users, Announcements, Gallery, Alumni, Team, AboutUs
            </li>
            <li>
              ✓ Images in use will <strong>NEVER be deleted</strong> - only truly orphaned images
            </li>
            <li>
              ✓ The age filter prevents accidental deletion of recently uploaded images
            </li>
            <li>
              ⚠️ Use "Delete All Orphaned" with caution - recommended only for older installations
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminCleanup;
