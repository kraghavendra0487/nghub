const { runPy } = require('../utils/emailRunner');

class EmailController {
  // 📧 SEND EMAIL - Send custom email via API
  static async sendEmail(req, res) {
    try {
      const { message, senderEmail } = req.body;

      // Validation
      if (!message || !senderEmail) {
        return res.status(400).json({ 
          success: false, 
          error: 'Message and sender email are required' 
        });
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(senderEmail)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid email format' 
        });
      }

      // Use the custom Python email script to send email
      try {
        await runPy('./send_custom_email.py', [senderEmail, message]);
        
        res.json({
          success: true,
          message: 'Email sent successfully!',
          recipient: senderEmail
        });
      } catch (emailError) {
        console.error('❌ Email sending failed:', emailError);
        res.status(500).json({ 
          success: false, 
          error: 'Failed to send email',
          details: emailError.message
        });
      }

    } catch (error) {
      console.error('❌ Send email error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
      });
    }
  }
}

module.exports = EmailController;

