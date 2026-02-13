import nodemailer from 'nodemailer';

// Create transporter lazily so env vars are available at call time
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: SendEmailOptions): Promise<void> => {
  // Skip if SMTP credentials not configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('📧 Email (No SMTP configured - logging only)');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('💡 Set SMTP_USER and SMTP_PASS env vars to enable real email sending');
    return;
  }

  try {
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    console.log(`✅ Email sent to ${options.to}`);
  } catch (error: any) {
    // Log the error but DON'T throw - the forgot-password route should still succeed
    console.error('❌ Email send failed:', error?.message || error);
    console.error('SMTP Config: host=' + (process.env.SMTP_HOST || 'smtp.gmail.com') +
      ', port=' + (process.env.SMTP_PORT || '587') +
      ', user=' + (process.env.SMTP_USER ? process.env.SMTP_USER.substring(0, 5) + '...' : 'NOT SET'));
  }
};

export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
  userName: string
): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Password Reset Request</h1>
        </div>
        <div class="content">
          <p>Hi ${userName},</p>
          <p>We received a request to reset your password for your Swiftora account.</p>
          <p>Click the button below to reset your password:</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background: #fff; padding: 10px; border-radius: 4px;">${resetUrl}</p>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Swiftora. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Hi ${userName},

We received a request to reset your password for your Swiftora account.

Click this link to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email.

© ${new Date().getFullYear()} Swiftora
  `.trim();

  await sendEmail({
    to: email,
    subject: 'Reset Your Swiftora Password',
    html,
    text,
  });
};
