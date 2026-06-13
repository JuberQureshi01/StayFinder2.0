import { Response } from "express";
import Listing from "./listing.model";
import { AIService } from "../../services/ai.service";
import { asyncHandler } from "../../middlewares/async.middleware";
import { AuthenticatedRequest, UploadedFile } from "../../middlewares/auth.middleware";
import {
  createListingService,
  buildSearchQuery,
  buildCountQuery,
  buildSmartSearchQuery,
  buildSimilarListingsQuery,
  toggleBlockDateService,
  getAvailabilityService,
  getHostEarningsService,
  updateListingService,
} from "../../services/listing.service";

export const createListing = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const listing = await createListingService(req.body, req.files as UploadedFile[], req.user._id);
  return res.status(201).json({ message: "Listing created successfully.", listing });
});

export const getAllListings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { lng, lat, radius = "50000", page = "1", pageSize = "20" } = req.query as any;

  const query = buildSearchQuery(req.query);
  const countQuery = lng !== undefined && lat !== undefined
    ? buildCountQuery(query, lng as string, lat as string, radius as string)
    : { ...query };

  const skipAmount = (Number(page) - 1) * Number(pageSize);
  const limitAmount = Number(pageSize);

  const [listingsCount, listingsResults] = await Promise.all([
    Listing.countDocuments(countQuery),
    Listing.find(query)
      .populate("host", "profile.name email")
      .skip(skipAmount)
      .limit(limitAmount)
      .lean(),
  ]);

  return res.status(200).json({
    message: "Listings retrieved successfully.",
    pagination: { totalResults: listingsCount, page: Number(page), pageSize: limitAmount },
    listings: listingsResults,
  });
});

export const getListingById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const listing = await Listing.findById(req.params.id).populate("host", "profile.name email");
  if (!listing) return res.status(404).json({ message: "Listing not found." });
  return res.status(200).json({ message: "Listing retrieved successfully.", listing });
});

export const generateAIFormDescription = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { title, location, amenities, hints } = req.body;

  if (!title || !location || !amenities || !Array.isArray(amenities) || amenities.length === 0) {
    return res.status(400).json({ message: "Title, location, and amenities are required." });
  }

  const description = await AIService.generateDescription(title, location, amenities, hints);
  if (!description) {
    return res.status(500).json({ message: "AI generation failed." });
  }

  return res.status(200).json({ message: "AI description generated.", description });
});

export const smartSearchListings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ message: "Search prompt is required." });

  const searchParams = await AIService.parseSmartSearch(prompt);
  if (!searchParams) {
    return res.status(400).json({ message: "Could not understand your search query." });
  }

  const query = buildSmartSearchQuery(searchParams);
  const listings = await Listing.find(query).limit(10).lean();

  return res.status(200).json({
    message: "Smart search completed.",
    aiInterpretedParams: searchParams,
    listings,
  });
});

export const getSimilarListings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const targetListing = await Listing.findById(req.params.id).lean();
  if (!targetListing) return res.status(404).json({ message: "Listing not found." });

  const query = buildSimilarListingsQuery(targetListing);
  const listings = await Listing.find(query).limit(4).populate("host", "profile.name").lean();

  return res.status(200).json({ message: "Similar listings retrieved.", listings });
});

export const getBlockedDates = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return res.status(404).json({ message: "Listing not found" });
  return res.status(200).json({ blockedDates: listing.blockedDates });
});

export const toggleBlockDate = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await toggleBlockDateService(req.params.id as string, req.user._id.toString(), req.body.date);
  return res.status(200).json(result);
});

export const getAvailability = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await getAvailabilityService(req.params.id as string);
  return res.status(200).json(result);
});

export const getHostEarnings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const earnings = await getHostEarningsService(req.user._id.toString());
  return res.status(200).json(earnings);
});

export const getHostListings = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const listings = await Listing.find({ host: req.user._id }).sort({ createdAt: -1 });
  return res.status(200).json({ message: "Host listings retrieved.", count: listings.length, listings });
});

export const updateListing = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const listing = await updateListingService(req.params.id as string, req.user._id.toString(), req.body, req.files as UploadedFile[]);
  return res.status(200).json({ message: "Listing updated.", listing });
});

export const deleteListing = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) return res.status(404).json({ message: "Listing not found." });
  if (listing.host.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: "Not authorized." });
  }
  await listing.deleteOne();
  return res.status(200).json({ message: "Listing deleted." });
});
