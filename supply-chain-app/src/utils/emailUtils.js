// src/utils/emailUtils.js

export const sendEmailAlert = async ({ orderId, temperature, minTemp, maxTemp, status }) => {
    try {
      await fetch('http://localhost:5000/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, temperature, minTemp, maxTemp, status }),
      });
      console.log('📧 Email alert sent for order', orderId);
    } catch (error) {
      console.error('❌ Failed to send email alert:', error);
    }
  };
  