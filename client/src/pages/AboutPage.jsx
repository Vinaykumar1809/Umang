import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../utils/api';
import { useAuth } from '../../context/authContext';
import AboutSection from '../components/about/AboutSection';
import TeamSection from '../components/about/TeamSection';
import AlumniSection from '../components/about/AlumniSection';

const AboutPage = () => {
  const { user } = useAuth();
  const [aboutData, setAboutData] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [groupedAlumni, setGroupedAlumni] = useState({});
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'ADMIN';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch About Us data
      try {
        const aboutRes = await api.get('/aboutus');
        setAboutData(aboutRes.data.data);
      } catch (err) {
        console.warn('About Us data not available');
        setAboutData(null);
      }

      // Fetch Team Members
      try {
        const teamRes = await api.get('/team');
        setTeamMembers(teamRes.data.data || []);
      } catch (err) {
        console.warn('Team members data not available');
        setTeamMembers([]);
      }

      // Fetch Alumni
      try {
        const alumniRes = await api.get('/alumni');
        setGroupedAlumni(alumniRes.data.data || {});
      } catch (err) {
        console.warn('Alumni data not available');
        setGroupedAlumni({});
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if team members exist
  const hasTeamMembers = teamMembers && teamMembers.length > 0;

  // Check if alumni exist
  const hasAlumni = groupedAlumni && Object.keys(groupedAlumni).length > 0;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* About Section */}
      {aboutData && <AboutSection aboutData={aboutData} onUpdate={fetchData} />}

      {/* Team Section - Show if: has team members OR user is admin */}
      {(hasTeamMembers || isAdmin) && <TeamSection teamMembers={teamMembers} onUpdate={fetchData} />}

      {/* Alumni Section - Show if: has alumni OR user is admin */}
      {(hasAlumni || isAdmin) && <AlumniSection groupedAlumni={groupedAlumni} onUpdate={fetchData} />}
    </div>
  );
};

export default AboutPage;
