import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

export class PaymentService {
  static async initiateRefund(paymentId: string, amount?: number): Promise<{ id: string; status: string } | null> {
    try {
      const options: any = {};
      if (amount && amount > 0) {
        options.amount = Math.round(amount * 100);
      }
      const result = await razorpay.payments.refund(paymentId, options);
      console.log(`Refund ${result.id} initiated for payment: ${paymentId}, amount: ${amount || "full"}`);
      return { id: result.id, status: result.status };
    } catch (error: any) {
      console.error(`Refund failed for payment ${paymentId}:`, error.message);
      return null;
    }
  }

  static async fetchRefund(refundId: string) {
    try {
      return await razorpay.refunds.fetch(refundId);
    } catch (error: any) {
      console.error(`Failed to fetch refund ${refundId}:`, error.message);
      return null;
    }
  }
}
