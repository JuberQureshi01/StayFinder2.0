import { Request, Response } from "express";
import crypto from "crypto";
import Booking from "../booking/booking.model";
import Refund from "../refund/refund.model";
import { PDFService } from "../../services/pdf.service";
import { EmailService } from "../../services/email.service";
import { NotificationService } from "../../services/notification.service";

export const handleRazorpayWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers["x-razorpay-signature"] as string;
    if (!signature)
      return res.status(400).json({ message: "Missing Razorpay signature" });

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET as string)
      .update(req.body.toString())
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("Razorpay Webhook Signature Mismatch!");
      return res.status(400).json({ message: "Invalid Signature" });
    }

    const event = JSON.parse(req.body.toString());

    if (event.event === "order.paid") {
      const orderId = event.payload.order.entity.id;
      const paymentId = event.payload.payment.entity.id;

      const booking = await Booking.findOne({ razorpayOrderId: orderId })
        .populate("user", "profile.name email")
        .populate("listing", "title");

      if (booking && booking.status !== "confirmed") {
        booking.status = "confirmed";
        booking.razorpayPaymentId = paymentId;
        await booking.save();

        await NotificationService.send({
          userId: booking.user._id.toString(),
          type: "booking_confirmed",
          title: "Booking Confirmed!",
          message: `Your stay at ${(booking.listing as any).title} is confirmed. Pack your bags!`,
          link: "/trips",
        });

        await NotificationService.send({
          userId: booking.host.toString(),
          type: "new_booking",
          title: "New Reservation!",
          message: `You have a new booking at ${(booking.listing as any).title}`,
          link: "/host/dashboard",
        });

        const pdfBuffer = await PDFService.generateInvoiceBuffer(
          booking,
          booking.user,
          booking.listing,
        );

        EmailService.sendInvoice(
          (booking.user as any).email,
          (booking.user as any).name,
          pdfBuffer,
        ).catch((err) => console.error("Invoice email failed:", err));
      }
    }

    if (event.event === "refund.processed" || event.event === "refund.created") {
      const refundEntity = event.payload.refund.entity;
      const refundId = refundEntity.id;
      const paymentId = refundEntity.payment_id;
      const status = refundEntity.status === "processed" ? "completed" : "processing";

      const refund = await Refund.findOne({ razorpayRefundId: refundId });
      if (refund) {
        refund.status = status;
        if (status === "completed") refund.processedAt = new Date();
        await refund.save();

        if (status === "completed") {
          const booking = await Booking.findById(refund.booking).populate("user", "profile.name email");
          if (booking) {
            await NotificationService.send({
              userId: booking.user._id.toString(),
              type: "booking_cancelled",
              title: "Refund Completed",
              message: `₹${refund.refundAmount.toLocaleString("en-IN")} has been credited to your account.`,
              link: "/trips",
            });
          }
        }
      } else {
        const refundByPayment = await Refund.findOne({ paymentId });
        if (refundByPayment && !refundByPayment.razorpayRefundId) {
          refundByPayment.razorpayRefundId = refundId;
          refundByPayment.status = status;
          if (status === "completed") refundByPayment.processedAt = new Date();
          await refundByPayment.save();
        }
      }
    }

    if (event.event === "refund.failed") {
      const refundEntity = event.payload.refund.entity;
      const refundId = refundEntity.id;
      const failureReason = refundEntity.failure_reason || "Bank/ gateway error";

      const refund = await Refund.findOne({ razorpayRefundId: refundId });
      if (refund) {
        refund.status = "failed";
        refund.failedAt = new Date();
        refund.failureReason = failureReason;
        await refund.save();

        const booking = await Booking.findById(refund.booking).populate("user", "profile.name email");
        if (booking) {
          await NotificationService.send({
            userId: booking.user._id.toString(),
            type: "booking_cancelled",
            title: "Refund Failed",
            message: `Refund of ₹${refund.refundAmount.toLocaleString("en-IN")} failed. Please contact support.`,
            link: "/trips",
          });
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error("Razorpay Webhook Error:", error.message);
    return res.status(500).json({ message: "Webhook Processing Error" });
  }
};
