import React, { useEffect, useState } from 'react';
import axios from 'axios';
import api from '../utils/api';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import AnnouncementCard from '../components/announcements/AnnouncementCard';
import PostList from '../components/posts/PostList';

const Home = () => {
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    api.get('/announcements/featured')
      .then(res => setFeatured(res.data.data || []));
  }, []);

  const sliderSettings = {
    dots: true,
    infinite: true,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: false,
    slidesToShow: 1,
    slidesToScroll: 1,
    pauseOnHover: false
  };

  return (
    <>
      {featured.length > 0 && (
        <div className="mb-8 max-w-6xl mx-auto">
          <Slider {...sliderSettings}>
            {featured.map(announce => (
              <AnnouncementCard
                key={announce._id}
                announcement={announce}
                isHero
              />
            ))}
          </Slider>
        </div>
      )}
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-4">Latest Posts</h1>
        <PostList />
      </div>
    </>
  );
};

export default Home;
