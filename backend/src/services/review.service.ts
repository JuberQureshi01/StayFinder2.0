import Review from "../modules/review/review.model";
import Listing from "../modules/listing/listing.model";

export const recalculateListingStats = async (listingId: string) => {
  const stats = await Review.aggregate([
    { $match: { listing: listingId } },
    {
      $group: {
        _id: "$listing",
        avgRating: { $avg: "$rating" },
        numReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Listing.findByIdAndUpdate(listingId, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      numReviews: stats[0].numReviews,
    });
  } else {
    await Listing.findByIdAndUpdate(listingId, { rating: 0, numReviews: 0 });
  }
};
