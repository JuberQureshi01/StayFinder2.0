export const calculateRefundAmount = (
  daysUntilCheckIn: number,
  totalAmount: number,
  policy: string,
): { refundAmount: number; deductionAmount: number } => {
  let refundPercent = 0;

  if (policy === "flexible") {
    if (daysUntilCheckIn >= 7) refundPercent = 100;
    else if (daysUntilCheckIn >= 3) refundPercent = 50;
    else refundPercent = 0;
  } else if (policy === "moderate") {
    if (daysUntilCheckIn >= 7) refundPercent = 100;
    else if (daysUntilCheckIn >= 1) refundPercent = 50;
    else refundPercent = 0;
  } else if (policy === "strict") {
    if (daysUntilCheckIn >= 7) refundPercent = 50;
    else if (daysUntilCheckIn >= 3) refundPercent = 25;
    else refundPercent = 0;
  } else {
    refundPercent = 0;
  }

  const refundAmount = Math.round((totalAmount * refundPercent) / 100);
  const deductionAmount = totalAmount - refundAmount;

  return { refundAmount, deductionAmount };
};
