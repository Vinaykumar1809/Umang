import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AboutSection from '../about/AboutSection';
import TeamSection from '../about/TeamSection';
import AlumniSection from '../about/AlumniSection';

const AboutUsManager = () => {
  const [activeTab, setActiveTab] = useState('about');

  // About Us State
  const [aboutData, setAboutData] = useState(null);
  const [refreshAbout, setRefreshAbout] = useState(0);

  // Team and Alumni data
  const [teamMembers, setTeamMembers] = useState([]);
  const [groupedAlumni, setGroupedAlumni] = useState({});
  const [refreshTeam, setRefreshTeam] = useState(0);
  const [refreshAlumni, setRefreshAlumni] = useState(0);

  // General state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  // Fetch Functions
  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchAboutUs(),
        fetchTeamMembers(),
        fetchAlumni()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAboutUs = async () => {
    try {
      const res = await axios.get('/api/aboutus');
      setAboutData(res.data.data);
    } catch (error) {
      console.error('Error fetching about us:', error);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const res = await axios.get('/api/team');
      setTeamMembers(res.data.data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const fetchAlumni = async () => {
    try {
      const res = await axios.get('/api/alumni');
      setGroupedAlumni(res.data.data || {});
    } catch (error) {
      console.error('Error fetching alumni:', error);
    }
  };

  // Update handlers
  const handleAboutUpdate = async () => {
    await fetchAboutUs();
    setRefreshAbout(prev => prev + 1);
  };

  const handleTeamUpdate = async () => {
    await fetchTeamMembers();
    setRefreshTeam(prev => prev + 1);
  };

  const handleAlumniUpdate = async () => {
    await fetchAlumni();
    setRefreshAlumni(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-gray-300 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('about')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'about'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
          }`}
        >
          About Us
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'team'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
          }`}
        >
          Team
        </button>
        <button
          onClick={() => setActiveTab('alumni')}
          className={`px-4 py-2 font-semibold transition-colors ${
            activeTab === 'alumni'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
          }`}
        >
          Alumni
        </button>
      </div>

      {/* About Us Tab - Reuses AboutSection Component */}
      {activeTab === 'about' && (
        <AboutSection
          key={`about-${refreshAbout}`}
          aboutData={aboutData}
          onUpdate={handleAboutUpdate}
        />
      )}

      {/* Team Tab - Reuses TeamSection Component */}
      {activeTab === 'team' && (
        <TeamSection
          key={`team-${refreshTeam}`}
          teamMembers={teamMembers}
          onUpdate={handleTeamUpdate}
        />
      )}

      {/* Alumni Tab - Reuses AlumniSection Component */}
      {activeTab === 'alumni' && (
        <AlumniSection
          key={`alumni-${refreshAlumni}`}
          groupedAlumni={groupedAlumni}
          onUpdate={handleAlumniUpdate}
        />
      )}
    </div>
  );
};

export default AboutUsManager;
