// components/Subscribe.jsx
import { useState } from 'react';

export default function Subscribe() {
  const [feedbackText, setFeedbackText] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    setLoading(true);
    setMessage('');

    const telegramName = localStorage.getItem('telegram_username') || 'Anonymous User';

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramName, feedbackText })
      });

      if (response.ok) {
        setMessage('Thank you! Sent.');
        setFeedbackText('');
      } else {
        setMessage('Failed to send.');
      }
    } catch (err) {
      setMessage('Network error.');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    <section className="section cta-subscribe" id="contact">
      <div className="container">
        <div className="row bg-elipse-red">
          <div className="col-lg-4">
            <div className="image">
              <img className="phone-thumb" src="images/phones/iphone-banner.png" alt="iphone-app" />
            </div>
          </div>
          <div className="col-lg-8 align-self-center">
            <div className="content">
              <div className="mb-4">
                <h2>what's your feedback?</h2>
              </div>
              <div className="description">
                <p>We plan to reduce the risk from payments</p>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="input-group">
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Enter your feedback" 
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    required
                  />
                  <div className="input-group-append" onClick={handleSubmit} style={{ cursor: 'pointer' }}>
                    <span className="input-group-text ti-arrow-right"></span>
                  </div>
                </div>
                {message && (
                  <small style={{ display: 'block', marginTop: '8px', color: message.includes('Thank') ? '#28a745' : '#dc3545' }}>
                    {message}
                  </small>
                )}
              </form>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}