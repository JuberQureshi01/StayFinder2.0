import Listing from "../modules/listing/listing.model";
import Booking from "../modules/booking/booking.model";
import { CloudinaryService } from "./cloudinary.service";
import type { UploadedFile } from "../middlewares/auth.middleware";

export const buildSearchQuery = (params: any) => {
  const { lng, lat, category, radius, minPrice, maxPrice, amenities, search } = params;
  const query: any = {};

  if (category && category !== "Trending") {
    query.category = category;
  }

  if (search) {
    query.title = { $regex: search, $options: "i" };
  }

  if (lng !== undefined && lat !== undefined) {
    query.location = {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
        $maxDistance: parseInt(radius),
      },
    };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {};
    if (minPrice !== undefined) query.price.$gte = Number(minPrice);
    if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);

    if (minPrice !== undefined && maxPrice !== undefined && Number(minPrice) > Number(maxPrice)) {
      throw { statusCode: 400, message: "Minimum price cannot exceed maximum price." };
    }
  }

  if (amenities) {
    query.amenities = { $all: amenities.split(",").map((a: string) => a.trim()) };
  }

  return query;
};

export const buildCountQuery = (query: any, lng: string, lat: string, radius: string) => {
  const countQuery = { ...query };
  if (countQuery.location) {
    countQuery.location = {
      $geoWithin: {
        $centerSphere: [
          [parseFloat(lng), parseFloat(lat)],
          parseInt(radius) / 6378100,
        ],
      },
    };
  }
  return countQuery;
};

export const createListingService = async (data: any, files: UploadedFile[], userId: string) => {
  let imageUrls: string[] = [];
  if (files && files.length > 0) {
    const uploadPromises = files.map((file) =>
      CloudinaryService.uploadImageBuffer(file.buffer, "stayfinder/listings"),
    );
    imageUrls = await Promise.all(uploadPromises);
  }

  let parsedLocation;
  try {
    const coords = typeof data.location === "string" ? JSON.parse(data.location) : data.location;
    parsedLocation = { type: "Point", coordinates: coords };
  } catch (e) {
    throw { statusCode: 400, message: "Invalid location coordinates." };
  }

  const newListing = new Listing({
    title: data.title,
    description: data.description,
    amenities: Array.isArray(data.amenities) ? data.amenities : data.amenities.split(",").map((a: string) => a.trim()),
    price: Number(data.price),
    category: data.category || "Trending",
    locationName: data.locationName || "Unknown Location",
    location: parsedLocation,
    images: imageUrls,
    host: userId,
    checkInTime: data.checkInTime || "3:00 PM",
    checkOutTime: data.checkOutTime || "11:00 AM",
    maxGuests: data.maxGuests ? Number(data.maxGuests) : 4,
    cleaningFee: data.cleaningFee ? Number(data.cleaningFee) : 0,
    rating: 0,
    numReviews: 0,
  });

  await newListing.save();
  return newListing;
};

export const buildSmartSearchQuery = (searchParams: any) => {
  const query: any = {};

  if (searchParams.minPrice || searchParams.maxPrice) {
    query.price = {};
    if (searchParams.minPrice) query.price.$gte = searchParams.minPrice;
    if (searchParams.maxPrice) query.price.$lte = searchParams.maxPrice;
  }

  if (searchParams.amenities && searchParams.amenities.length > 0) {
    query.amenities = {
      $all: searchParams.amenities.map((a: string) => new RegExp(a, "i")),
    };
  }

  return query;
};

export const buildSimilarListingsQuery = (targetListing: any) => {
  const query: any = { _id: { $ne: targetListing._id } };

  if (targetListing.location && targetListing.location.coordinates) {
    query.location = {
      $near: {
        $geometry: targetListing.location,
        $maxDistance: 50000,
      },
    };
  }

  return query;
};

export const toggleBlockDateService = async (listingId: string, userId: string, date: string) => {
  const listing = await Listing.findById(listingId);
  if (!listing) throw { statusCode: 404, message: "Listing not found" };
  if (listing.host.toString() !== userId) {
    throw { statusCode: 403, message: "Not authorized" };
  }

  const blockDate = new Date(date);
  blockDate.setHours(0, 0, 0, 0);

  const isBlocked = listing.blockedDates.some(
    (d) => d.getTime() === blockDate.getTime(),
  );

  if (isBlocked) {
    listing.blockedDates = listing.blockedDates.filter(
      (d) => d.getTime() !== blockDate.getTime(),
    );
  } else {
    listing.blockedDates.push(blockDate);
  }

  await listing.save();

  return {
    message: isBlocked ? "Date unblocked" : "Date blocked",
    blockedDates: listing.blockedDates,
  };
};

export const getAvailabilityService = async (listingId: string) => {
  const listing = await Listing.findById(listingId).select("blockedDates");
  if (!listing) throw { statusCode: 404, message: "Listing not found" };

  const manuallyBlocked = (listing.blockedDates || []).map((d) => new Date(d));

  const confirmedBookings = await Booking.find({
    listing: listingId,
    status: { $in: ["confirmed", "completed"] },
  }).select("checkIn checkOut");

  const bookedDates: Date[] = [];
  for (const booking of confirmedBookings) {
    const start = new Date(booking.checkIn);
    const end = new Date(booking.checkOut);
    const current = new Date(start);
    while (current < end) {
      bookedDates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
  }

  const allUnavailable = [...manuallyBlocked, ...bookedDates];
  const uniqueTimestamps = new Set(allUnavailable.map((d) => d.getTime()));
  const uniqueDates = Array.from(uniqueTimestamps)
    .map((ts) => new Date(ts))
    .sort((a, b) => a.getTime() - b.getTime());

  return {
    unavailableDates: uniqueDates.map((d) => d.toISOString().split("T")[0]),
    manuallyBlocked: manuallyBlocked.map((d) => d.toISOString().split("T")[0]),
  };
};

export const getHostEarningsService = async (hostId: string) => {
  const earnings = await Booking.aggregate([
    { $match: { host: hostId, status: { $in: ["confirmed", "completed"] } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        revenue: { $sum: "$totalPrice" },
        bookings: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $limit: 12 },
  ]);

  const totalEarnings = earnings.reduce((sum, e) => sum + e.revenue, 0);
  const totalHostBookings = await Booking.countDocuments({
    host: hostId,
    status: { $in: ["confirmed", "completed"] },
  });

  return { monthlyEarnings: earnings, totalEarnings, totalBookings: totalHostBookings };
};

export const updateListingService = async (listingId: string, userId: string, data: any, files: UploadedFile[]) => {
  const listing = await Listing.findById(listingId);
  if (!listing) throw { statusCode: 404, message: "Listing not found." };
  if (listing.host.toString() !== userId) {
    throw { statusCode: 403, message: "Not authorized to update this listing." };
  }

  if (data.title) listing.title = data.title;
  if (data.description) listing.description = data.description;
  if (data.price !== undefined) listing.price = Number(data.price);
  if (data.category) listing.category = data.category;
  if (data.locationName) listing.locationName = data.locationName;
  if (data.checkInTime !== undefined) listing.checkInTime = data.checkInTime;
  if (data.checkOutTime !== undefined) listing.checkOutTime = data.checkOutTime;
  if (data.maxGuests !== undefined) listing.maxGuests = Number(data.maxGuests);
  if (data.cleaningFee !== undefined) listing.cleaningFee = Number(data.cleaningFee);

  if (data.amenities) {
    listing.amenities = Array.isArray(data.amenities)
      ? data.amenities
      : data.amenities.split(",").map((a: string) => a.trim());
  }

  if (data.location) {
    try {
      const coords = typeof data.location === "string" ? JSON.parse(data.location) : data.location;
      listing.location = { type: "Point", coordinates: coords };
    } catch (e) {
      throw { statusCode: 400, message: "Invalid location coordinates." };
    }
  }

  if (files && files.length > 0) {
    if (listing.images.length + files.length > 10) {
      throw { statusCode: 400, message: "Cannot exceed 10 images total per listing." };
    }

    const uploadPromises = files.map((file) =>
      CloudinaryService.uploadImageBuffer(file.buffer, "stayfinder/listings"),
    );
    const newImageUrls = await Promise.all(uploadPromises);
    listing.images = [...listing.images, ...newImageUrls];
  }

  const updatedListing = await listing.save();
  return updatedListing;
};
