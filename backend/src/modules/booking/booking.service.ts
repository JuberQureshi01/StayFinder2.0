import Booking from "./booking.model";

export const checkAvailability = async (
  listingId: string,
  reqCheckIn: Date,
  reqCheckOut: Date
): Promise<boolean> => {
  // checking overlapping bookings
  const bookingOfHotel = await Booking.find({
    listing: listingId,
    checkIn: { $lt: reqCheckOut },
    checkOut: { $gt: reqCheckIn },
    status: { $ne: "cancelled" },
  });

  if (bookingOfHotel.length > 0) {
    return false;
  }

  return true;
};