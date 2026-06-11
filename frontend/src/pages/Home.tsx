import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Sparkles, ChevronRight, TrendingUp } from "lucide-react";
import Categories from "../components/Categories";
import ListingCard from "../components/ListingCard";
import { SkeletonCard } from "../components/ui/skeleton";
import { apiGet } from "../services/apiMethods";
import { PATHS } from "../services/paths";
import type { RootState } from "../app/store";

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Trending");
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [recLoading, setRecLoading] = useState(false);

  const fetchListings = async (categoryLabel: string) => {
    try {
      setLoading(true);
      let queryParams = {};
      if (categoryLabel !== "Trending") {
        queryParams = { category: categoryLabel };
      }
      const response = await apiGet(PATHS.LISTING.GET_ALL, queryParams);
      setListings(response?.listings || []);
    } catch {
      toast.error("Failed to load properties.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings(activeCategory);
  }, [activeCategory]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchRecs = async () => {
      setRecLoading(true);
      try {
        const res = await apiGet("/recommendations/for-you");
        setRecommendations(res?.recommendations || []);
      } catch {
      } finally {
        setRecLoading(false);
      }
    };
    fetchRecs();
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Categories
          selectedCategory={activeCategory}
          onSelect={(label) => setActiveCategory(label)}
        />

        <div className="mt-2">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <p className="py-20 text-center text-gray-500">
              No properties found for "{activeCategory}".
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
              {listings.map((listing: any) => (
                <ListingCard key={listing._id} listing={listing} />
              ))}
            </div>
          )}
        </div>

        {isAuthenticated && recommendations.length > 0 && (
          <section className="mt-12 border-t pt-10 pb-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
                  <TrendingUp className="h-5 w-5 text-indigo-500" />
                  Recommended For You
                </h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  Based on your preferences and past stays
                </p>
              </div>
              <button onClick={() => navigate("/search")} className="hidden md:flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition">
                View all <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {recLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : (
              <div className="relative">
                <div className="flex gap-1 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
                  {recommendations.map((listing: any) => (
                    <div key={listing._id} className="min-w-[280px] sm:min-w-0 sm:w-full snap-start">
                      <ListingCard listing={listing} />
                    </div>
                  ))}
                </div>
                <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none md:hidden" />
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default Home;
