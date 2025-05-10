const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "farmtofork2025@gmail.com", 
    pass: "ffdt jtst bkdh xrdb", // Generate App Password from Google
  },
});
// API Endpoint to Send Email 
app.post("/send-email", async (req, res) => {
    const { orderId, temperature, minTemp, maxTemp, status } = req.body;
  
    const mailOptions = {
      from: "farmtofork2025@gmail.com",
      to: "norammw@gmail.com",
      subject: `🚨 [Farm To Fork] Urgent Temperature Alert for Order #${orderId}`,
      text: `Dear Farm To Fork Partner,
  
  We have detected an unsafe temperature for Order #${orderId}. This could impact the quality and safety of your fresh produce or perishable goods.
  
  🔴 Temperature Alert Details:
  - 📦 Order ID: ${orderId}
  - 📌 Current Status: ${status}
  - 🌡️ Recorded Temperature: ${temperature}°C
  - ✅ Safe Range: ${minTemp}°C - ${maxTemp}°C
  
  
  
  Best Regards,  
  Farm To Fork Team  
  `,
    };
  
    try {
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "Email sent successfully" });
      } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ message: "Failed to send email", error });
      }
    });
    
    app.listen(5000, () => {
      console.log("Server running on port 5000");
    });