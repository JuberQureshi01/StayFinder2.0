import { Response } from "express";
import Listing from "./listing.model";
import { AIService } from "../../services/ai.service";
import { CloudinaryService } from "../../services/cloudinary.service";
import { asyncHandler } from "../../middlewares/async.middleware";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import Booking from "../booking/booking.model";

export const createListing = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    // ADDED: category and locationName
    const {
      title,
      description,
      amenities,
      price,
      location,
      category,
      locationName,
      checkInTime,
      checkOutTime,
      maxGuests,
      cleaningFee,
    } = req.body;
    const files = req.files as Express.Multer.File[];
    const user = req.user;

    console.log(req.body);
    let imageUrls: string[] = [];
    if (files && files.length > 0) {
      const uploadPromises = files.map((file) =>
        CloudinaryService.uploadImageBuffer(file.buffer, "stayfinder/listings"),
      );
      imageUrls = await Promise.all(uploadPromises);
    }

    let parsedLocation;
    try {
      const coords =
        typeof location === "string" ? JSON.parse(location) : location;
      parsedLocation = { type: "Point", coordinates: coords };
    } catch (e) {
      return res.status(400).json({ message: "Invalid location coordinates." });
    }

    const newListing = new Listing({
      title,
      description,
      amenities: Array.isArray(amenities)
        ? amenities
        : (amenities as string).split(",").map((a) => a.trim()),
      price: Number(price),
      category: category || "Trending", // ADDED
      locationName: locationName || "Unknown Location",
      location: parsedLocation,
      images: imageUrls,
      host: user._id,
      checkInTime: checkInTime || "3:00 PM",
      checkOutTime: checkOutTime || "11:00 AM",
      maxGuests: maxGuests ? Number(maxGuests) : 4,
      cleaningFee: cleaningFee ? Number(cleaningFee) : 0,
      rating: 0,
      numReviews: 0,
    });
    console.log(newListing);

    await newListing.save();

    return res.status(201).json({
      message: "Property listing created successfully.",
      listing: newListing,
    });
  },
);

export const getAllListings = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    // 1. Safely extract parameters with default fallbacks for pagination & radius
    const {
      lng,
      lat,
      category,
      radius = 50000, // Default 50km search radius if not provided
      minPrice,
      maxPrice,
      amenities,
      search,
      page = 1,
      pageSize = 20,
    } = req.query as any;

    const query: any = {};

    if (category && category !== "Trending") {
      query.category = category;
    }
    // 2. SEARCH BY LISTING TITLE / NAME
    if (search) {
      query.title = {
        $regex: search,
        $options: "i", // case-insensitive
      };
    }

    // 3. GEOSPATIAL SEARCH
    if (lng !== undefined && lat !== undefined) {
      query.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)], // Must coerce to numbers
          },
          $maxDistance: parseInt(radius), // Must be a number (in meters)
        },
      };
    }

    // 4. NUMERIC PRICE FILTERING
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};

      if (minPrice !== undefined) query.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);

      if (
        minPrice !== undefined &&
        maxPrice !== undefined &&
        Number(minPrice) > Number(maxPrice)
      ) {
        return res.status(400).json({
          message: "Minimum price cannot exceed maximum price.",
        });
      }
    }

    // 5. AMENITIES PRECISE MATCHING
    if (amenities) {
      query.amenities = {
        $all: amenities.split(",").map((a: string) => a.trim()),
      };
    }

    // 6. FIX THE MONGODB COUNT CRASH
    // MongoDB throws an error if $near is used inside countDocuments().
    // We clone the query and swap $near for $geoWithin specifically for the counting phase.
    const countQuery = { ...query };
    if (countQuery.location) {
      countQuery.location = {
        $geoWithin: {
          $centerSphere: [
            [parseFloat(lng), parseFloat(lat)],
            parseInt(radius) / 6378100, // Convert meters to radians (Earth radius is ~6,378,100m)
          ],
        },
      };
    }

    // 7. EXECUTE SAFE PARALLEL QUERIES
    const skipAmount = (Number(page) - 1) * Number(pageSize);
    const limitAmount = Number(pageSize);

    const [listingsCount, listingsResults] = await Promise.all([
      Listing.countDocuments(countQuery), // Uses the safe geometry query
      Listing.find(query) // Uses the $near query to automatically sort by closest distance
        .populate("host", "profile.name email")
        .skip(skipAmount)
        .limit(limitAmount)
        .lean(),
    ]);

    return res.status(200).json({
      message: "Listings compiled successfully.",
      pagination: {
        totalResults: listingsCount,
        page: Number(page),
        pageSize: limitAmount,
      },
      listings: listingsResults,
    });
  },
);

export const getListingById = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const listingItem = await Listing.findById(id).populate(
      "host",
      "profile.name email",
    );
    if (!listingItem) {
      return res.status(404).json({
        message: "Requested property listing record data trace missing.",
      });
    }

    return res.status(200).json({
      message: "Property data trace resolved successfully.",
      listing: listingItem,
    });
  },
);

export const generateAIFormDescription = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { title, location, amenities, hints } = req.body;

    if (
      !title ||
      !location ||
      !amenities ||
      !Array.isArray(amenities) ||
      amenities.length === 0
    ) {
      return res.status(400).json({
        message: "Title, location, and amenities parameters are required.",
      });
    }
    // Call our newly updated service
    const description = await AIService.generateDescription(
      title,
      location,
      amenities || [],
      hints,
    );
    if (!description) {
      return res.status(500).json({
        message:
          "AI Content completion worker process structural fault exception.",
      });
    }

    return res.status(200).json({
      message: "AI copy generation completed successfully.",
      description,
    });
  },
);

export const smartSearchListings = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { prompt } = req.body;
    if (!prompt)
      return res.status(400).json({
        message: "Search prompt argument criteria string is mandatory.",
      });

    const searchParams = await AIService.parseSmartSearch(prompt);
    if (!searchParams) {
      return res.status(400).json({
        message:
          "Could not understand structural natural language search phrase criteria.",
      });
    }

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

    const listings = await Listing.find(query).limit(10).lean();

    return res.status(200).json({
      message: "Natural language smart parsing search evaluation loop success.",
      aiInterpretedParams: searchParams,
      listings,
    });
  },
);

/**
 * @desc    Fetches similar listings based on geospatial proximity and overlapping amenities
 * @route   GET /api/listings/:id/similar
 * @access  Public (Cached)
 */
export const getSimilarListings = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // 1. Fetch the baseline property to match against
    const targetListing = await Listing.findById(id).lean();
    if (!targetListing) {
      return res.status(404).json({
        message: "Base listing not found for recommendation algorithm.",
      });
    }

    // 2. Build the MongoDB Aggregation/Match Query
    const query: any = {
      _id: { $ne: id }, // Exclude the current listing from results
    };

    // If the listing has coordinates, find others within a 50km radius
    if (targetListing.location && targetListing.location.coordinates) {
      query.location = {
        $near: {
          $geometry: targetListing.location,
          $maxDistance: 50000, // 50 km radius
        },
      };
    }

    // 3. Execute the search, sorting by matching amenities if possible, limited to 4 results
    const similarListings = await Listing.find(query)
      .limit(4)
      .populate("host", "profile.name")
      .lean();

    return res.status(200).json({
      message: "Recommendation engine compiled successfully.",
      listings: similarListings,
    });
  },
);

// =====================
// BLOCKED DATES
// =====================
export const getBlockedDates = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    return res.status(200).json({ blockedDates: listing.blockedDates });
  },
);

export const toggleBlockDate = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { date } = req.body;

    const listing = await Listing.findById(id);
    if (!listing) return res.status(404).json({ message: "Listing not found" });
    if (listing.host.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
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
    return res.status(200).json({
      message: isBlocked ? "Date unblocked" : "Date blocked",
      blockedDates: listing.blockedDates,
    });
  },
);

// =====================
// AVAILABILITY (guest-facing — blocked + booked dates)
// =====================
export const getAvailability = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const listing = await Listing.findById(id).select("blockedDates");
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    const manuallyBlocked = (listing.blockedDates || []).map(
      (d) => new Date(d),
    );

    const confirmedBookings = await Booking.find({
      listing: id,
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

    return res.status(200).json({
      unavailableDates: uniqueDates.map((d) => d.toISOString().split("T")[0]),
      manuallyBlocked: manuallyBlocked.map(
        (d) => d.toISOString().split("T")[0],
      ),
    });
  },
);

// =====================
// HOST EARNINGS ANALYTICS
// =====================
export const getHostEarnings = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const hostId = req.user._id;

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

    return res.status(200).json({
      monthlyEarnings: earnings,
      totalEarnings,
      totalBookings: totalHostBookings,
    });
  },
);

// hosting controllers

// @desc    Get all listings for the logged-in host
// @route   GET /api/listings/host
// @access  Private (Host only)
export const getHostListings = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    // console.log(req.user._id);
    const listings = await Listing.find({ host: req.user._id }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      message: "Host listings retrieved successfully.",
      count: listings.length,
      listings,
    });
  },
);

// @desc    Update a specific listing
// @route   PUT /api/listings/:id
// @access  Private (Host only)
export const updateListing = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
      return res.status(404).json({ message: "Listing not found." });
    }

    // Security Check: Make sure the logged-in user actually owns this listing
    if (listing.host.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this listing." });
    }

    const {
      title,
      description,
      amenities,
      price,
      location,
      category,
      locationName,
      checkInTime,
      checkOutTime,
      maxGuests,
      cleaningFee,
    } = req.body;

    // Update basic text fields
    if (title) listing.title = title;
    if (description) listing.description = description;
    if (price !== undefined) listing.price = Number(price);
    if (category) listing.category = category;
    if (locationName) listing.locationName = locationName;
    if (checkInTime !== undefined) listing.checkInTime = checkInTime;
    if (checkOutTime !== undefined) listing.checkOutTime = checkOutTime;
    if (maxGuests !== undefined) listing.maxGuests = Number(maxGuests);
    if (cleaningFee !== undefined) listing.cleaningFee = Number(cleaningFee);

    // Update amenities
    if (amenities) {
      listing.amenities = Array.isArray(amenities)
        ? amenities
        : (amenities as string).split(",").map((a) => a.trim());
    }
    // Update location (GeoJSON)
    if (location) {
      try {
        const coords =
          typeof location === "string" ? JSON.parse(location) : location;
        listing.location = { type: "Point", coordinates: coords };
      } catch (e) {
        return res
          .status(400)
          .json({ message: "Invalid location coordinates." });
      }
    }

    // Handle new image uploads (appends to existing images)
    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      // Prevent exceeding the 5 image limit
      if (listing.images.length + files.length > 5) {
        return res
          .status(400)
          .json({ message: "Cannot exceed 5 images total per listing." });
      }

      const uploadPromises = files.map((file) =>
        CloudinaryService.uploadImageBuffer(file.buffer, "stayfinder/listings"),
      );
      const newImageUrls = await Promise.all(uploadPromises);
      listing.images = [...listing.images, ...newImageUrls];
    }

    const updatedListing = await listing.save();

    // console.log("Updated listing:", updatedListing);
    return res.status(200).json({
      message: "Listing updated successfully.",
      listing: updatedListing,
    });
  },
);

// @desc    Delete a listing
// @route   DELETE /api/listings/:id
// @access  Private (Host only)
export const deleteListing = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
      return res.status(404).json({ message: "Listing not found." });
    }

    // Security Check: Ensure the host owns it
    if (listing.host.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this listing." });
    }

    // Remove the listing from the database
    await listing.deleteOne();

    return res.status(200).json({
      message: "Listing deleted successfully.",
    });
  },
);
