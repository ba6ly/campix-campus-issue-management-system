const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1) Create a transporter
  const isGmail = process.env.EMAIL_HOST && process.env.EMAIL_HOST.includes('gmail');
  const transporterConfig = isGmail
    ? {
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    }
    : {
      host: process.env.EMAIL_HOST || 'smtp.mailtrap.io',
      port: Number(process.env.EMAIL_PORT) || 2525,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    };

  const transporter = nodemailer.createTransport(transporterConfig);

  // 2) Define the email options
  const mailOptions = {
    from: 'Campix Support <noreply@campix.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  // 3) Actually send the email
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    await transporter.sendMail(mailOptions);
  } else {
    console.log('--- EMAIL SIMULATION (SMTP not configured) ---');
    console.log('To:', options.email);
    console.log('Subject:', options.subject);
    console.log('Message:', options.message);
    console.log('----------------------------------------------');
  }
};

const sendOTP = async (email, otp) => {
  const message = `Your Campix verification code is: ${otp}. This code will expire in 10 minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; borderRadius: 10px;">
      <h2 style="color: #4f46e5; text-align: center;">Welcome to Campix!</h2>
      <p>Hello,</p>
      <p>Thank you for registering. Please use the following one-time password (OTP) to verify your account:</p>
      <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #1f2937; margin: 20px 0; border-radius: 8px;">
        ${otp}
      </div>
      <p>This code will expire in <strong>10 minutes</strong>. If you did not request this, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #6b7280; text-align: center;">Campix Campus Grievance System</p>
    </div>
  `;

  await sendEmail({
    email,
    subject: 'Campix Verification Code',
    message,
    html
  });
};

module.exports = { sendEmail, sendOTP };
