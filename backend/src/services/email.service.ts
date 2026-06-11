import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail", // You can change this to SendGrid, AWS SES, etc.
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export class EmailService {
  static async sendInvoice(
    userEmail: string,
    userName: string,
    pdfBuffer: Buffer,
  ) {
    try {
      await transporter.sendMail({
        from: `"Stay Finder Support" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: "Your Booking is Confirmed! 🏨",
        text: `Hi ${userName},\n\nYour payment was successful and your booking is confirmed! Please find your official receipt attached.\n\nEnjoy your stay!`,
        attachments: [
          {
            filename: "StayFinder_Invoice.pdf",
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      });
      console.log(`Invoice emailed successfully to ${userEmail}`);
    } catch (error) {
      console.error("Failed to send invoice email:", error);
    }
  }

  static async sendRefundEmail(
    userEmail: string,
    userName: string,
    refundInfo: { bookingId: string; refundAmount: number; refundId: string },
  ) {
    try {
      await transporter.sendMail({
        from: `"Stay Finder Support" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: "Refund Initiated",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #111827;">Refund Initiated</h2>
            <p style="color: #4B5563; line-height: 1.6;">Hi ${userName},</p>
            <p style="color: #4B5563; line-height: 1.6;">Your booking has been cancelled and a refund has been initiated.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6B7280;">Booking ID</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">${refundInfo.bookingId}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6B7280;">Refund Amount</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">₹${refundInfo.refundAmount.toLocaleString("en-IN")}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; color: #6B7280;">Refund ID</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold; font-size: 12px;">${refundInfo.refundId}</td></tr>
            </table>
            <p style="color: #4B5563; line-height: 1.6;">The amount will be credited within <strong>5-7 business days</strong>.</p>
            <p style="color: #9CA3AF; font-size: 14px;">If you have any questions, please contact support.</p>
          </div>
        `,
      });
      console.log(`Refund email sent to ${userEmail}`);
    } catch (error) {
      console.error("Failed to send refund email:", error);
    }
  }

  // 👇 ADDED THIS NEW METHOD
  static async sendPasswordReset(userEmail: string, resetUrl: string) {
    try {
      await transporter.sendMail({
        from: `"Stay Finder Support" <${process.env.EMAIL_USER}>`,
        to: userEmail,
        subject: "Password Reset Request 🔐",
        text: `You recently requested to reset your password for your StayFinder account.\n\nClick the link below to reset it:\n${resetUrl}\n\nIf you did not request a password reset, please ignore this email or reply to let us know.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #111827;">Password Reset Request</h2>
            <p style="color: #4B5563; line-height: 1.6;">You recently requested to reset your password for your StayFinder account. Click the button below to reset it. <strong>This link will expire in 10 minutes.</strong></p>
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; margin: 20px 0; background-color: #f43f5e; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
            <p style="color: #6B7280; font-size: 14px;">If you did not request a password reset, please ignore this email.</p>
          </div>
        `,
      });
      console.log(`Password reset email sent to ${userEmail}`);
    } catch (error) {
      console.error("Failed to send password reset email:", error);
      // We throw the error here so the auth controller knows the email failed to send
      throw new Error("Email delivery failed");
    }
  }
}
