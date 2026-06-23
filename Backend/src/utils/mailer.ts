import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendOTP = async (email: string, otp: string) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || '"منصة التعلم الذكية" <noreply@emaqra2a.com>',
    to: email,
    subject: 'رمز استعادة كلمة المرور',
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center; direction: rtl;">
        <h2 style="color: #0f766e;">استعادة كلمة المرور</h2>
        <p>لقد طلبت إعادة تعيين كلمة المرور الخاصة بك.</p>
        <p>رمز التحقق الخاص بك هو:</p>
        <div style="font-size: 32px; font-weight: bold; padding: 20px; background-color: #f0fdfa; color: #0f766e; border-radius: 10px; display: inline-block; letter-spacing: 5px;">
          ${otp}
        </div>
        <p>هذا الرمز صالح لمدة 15 دقيقة فقط.</p>
        <p>إذا لم تطلب هذا الرمز، يرجى تجاهل هذه الرسالة.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};
