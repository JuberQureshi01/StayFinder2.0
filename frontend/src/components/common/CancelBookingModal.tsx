import { X, AlertTriangle, Loader2 } from "lucide-react";

interface RefundInfo {
  originalAmount: number;
  refundAmount: number;
  deductionAmount: number;
  cancellationPolicy: string;
}

interface CancelBookingModalProps {
  booking: any;
  cancelResult: any;
  cancelling: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const CancelBookingModal = ({ booking, cancelResult, cancelling, onConfirm, onClose }: CancelBookingModalProps) => {
  if (!booking && !cancelResult) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        {cancelResult ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <X className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Booking Cancelled</h3>
            <p className="mt-2 text-sm text-gray-600">{cancelResult.message}</p>
            {cancelResult.refund && (
              <div className="mt-4 rounded-xl bg-gray-50 p-4 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Original Amount</span>
                  <span className="font-medium">₹{cancelResult.refund.originalAmount.toLocaleString("en-IN")}</span>
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-gray-500">Refund Amount</span>
                  <span className="font-semibold text-green-600">₹{cancelResult.refund.refundAmount.toLocaleString("en-IN")}</span>
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-gray-500">Deduction</span>
                  <span className="font-medium text-gray-700">₹{cancelResult.refund.deductionAmount.toLocaleString("en-IN")}</span>
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-gray-500">Policy</span>
                  <span className="font-medium capitalize">{cancelResult.refund.cancellationPolicy}</span>
                </div>
              </div>
            )}
            <button onClick={onClose} className="mt-6 w-full rounded-xl bg-gray-900 px-4 py-2.5 font-medium text-white hover:bg-black">
              Done
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Cancel Booking?</h3>
            <p className="mt-2 text-sm text-gray-600">
              This will cancel your stay at <strong>{booking?.listing?.title}</strong>.
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Refund amount depends on the cancellation policy. This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3">
              <button onClick={onClose} disabled={cancelling} className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">
                Keep Booking
              </button>
              <button onClick={onConfirm} disabled={cancelling} className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 font-medium text-white transition hover:bg-red-700 disabled:opacity-50">
                {cancelling ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cancelling...
                  </span>
                ) : "Yes, Cancel"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CancelBookingModal;
