import fs from 'fs';
import path from 'path';

const FEEDBACK_FILE_PATH = path.join(process.cwd(), 'feedbacks.json');


function sanitizeText(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      let { telegramName, feedbackText } = req.body;


      if (!feedbackText || typeof feedbackText !== 'string' || !feedbackText.trim()) {
        return res.status(400).json({ error: 'Feedback text is required.' });
      }


      if (feedbackText.length > 500) {
        return res.status(400).json({ error: 'Feedback is too long (Max 500 characters).' });
      }

      
      const safeFeedback = sanitizeText(feedbackText.trim());
      const safeTelegramName = sanitizeText(telegramName ? telegramName.trim() : 'Anonymous');

      let feedbacks = [];
      if (fs.existsSync(FEEDBACK_FILE_PATH)) {
        const fileData = fs.readFileSync(FEEDBACK_FILE_PATH, 'utf8');
        try {
          feedbacks = JSON.parse(fileData);
        } catch (e) {
          feedbacks = []; 
        }
      }

      const newFeedback = {
        id: Date.now(),
        telegramName: safeTelegramName,
        feedbackText: safeFeedback,
        createdAt: new Date().toISOString()
      };

      feedbacks.unshift(newFeedback);
      fs.writeFileSync(FEEDBACK_FILE_PATH, JSON.stringify(feedbacks, null, 2), 'utf8');

      return res.status(200).json({ success: true, message: 'Feedback saved!' });

    } catch (error) {
      console.error('Error saving feedback:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'GET') {
    try {
      if (fs.existsSync(FEEDBACK_FILE_PATH)) {
        const fileData = fs.readFileSync(FEEDBACK_FILE_PATH, 'utf8');
        const feedbacks = JSON.parse(fileData);
        return res.status(200).json(feedbacks);
      }
      return res.status(200).json([]);
    } catch (error) {
      console.error('Error reading feedback:', error);
      return res.status(500).json({ error: 'Error reading feedbacks' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}