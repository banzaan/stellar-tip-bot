// components/Testimonial.jsx
import { useState, useEffect } from 'react';

export default function Testimonial() {
  const [feedbacks, setFeedbacks] = useState([
    {
      id: 1,
      feedbackText: "Stellar Tip Bot made sending and receiving tips on X completely seamless. Highly recommended!",
      telegramName: "Mike Andrew",
      image: "images/testimonial/client-1.jpg"
    }
  ]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    async function fetchFeedbacks() {
      try {
        const res = await fetch('/api/feedback');
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setFeedbacks(data);
          }
        }
      } catch (err) {
        console.error("Failed to load feedbacks:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchFeedbacks();
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex === feedbacks.length - 1 ? 0 : prevIndex + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? feedbacks.length - 1 : prevIndex - 1));
  };

  const currentItem = feedbacks[currentIndex] || feedbacks[0];
  const userName = currentItem.telegramName || currentItem.name || "Anonymous";
  

  const cleanUsername = userName.replace('@', '').trim();
  const isAnonymous = cleanUsername.toLowerCase() === 'anonymous' || cleanUsername === 'Anonymous User';
  const telegramProfileUrl = isAnonymous ? '#' : `https://t.me/${cleanUsername}`;


  const clientImage = currentItem.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userName)}`;

  return (
    <section className="section testimonial bg-primary-shape" id="team">
      <div className="container">
        <div className="row">
          <div className="col-12">
            <div className="section-title">
              <h2 className="text-white">Our Happy Customers</h2>
              <p className="text-white">
                don’t take our word for it (our moms are biased anyway).
                here is what the community actually thinks. From minor bugs conquered to massive tips flying around see why hundreds of users call this home.
              </p>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-10 mx-auto position-relative px-5">
            
            <button 
              onClick={prevSlide}
              style={{
                position: 'absolute',
                left: '-10px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                width: '45px',
                height: '45px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: '#fff',
                boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#333',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              &#10094;
            </button>


            <div className="testimonial-item bg-white p-4 rounded shadow">
              <div className="row align-items-center">
                <div 
                  className="col-md-5 client-img mb-3 mb-md-0" 
                  style={{ 
                    backgroundImage: `url(${clientImage})`, 
                    minHeight: '250px', 
                    backgroundSize: 'cover', 
                    backgroundPosition: 'center',
                    borderRadius: '8px',
                    backgroundColor: '#f8f9fa'
                  }}
                ></div>
                <div className="col-md-7">
                  <div className="p-3">
                    <strong className="mb-3 d-block text-primary">Community Feedback</strong>
                    <p className="lead font-italic mb-4">"{currentItem.feedbackText || currentItem.text}"</p>
                    

                    <h6 className="mb-1">
                      {isAnonymous ? (
                        <span>{userName}</span>
                      ) : (
                        <a 
                          href={telegramProfileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{ color: '#007bff', textDecoration: 'none' }}
                        >
                          @{cleanUsername} ↗
                        </a>
                      )}
                    </h6>
                    
                  </div>
                </div>
              </div>
            </div>


            <button 
              onClick={nextSlide}
              style={{
                position: 'absolute',
                right: '-10px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 10,
                width: '45px',
                height: '45px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: '#fff',
                boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#333',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              &#10095;
            </button>

          </div>
        </div>
      </div>
    </section>
  );
}