import { useEffect, useState } from "react";
import { Sparkles, ThumbsUp, ThumbsDown } from "lucide-react";
import apiFetch from "../services/apiFetch";

interface ReviewSummaryData {
  loves: string[];
  complaints: string[];
  sentiment: "positive" | "mixed" | "negative";
  summaryScore: number;
}

interface ReviewSummaryProps {
  listingId: string;
}

const ReviewSummary = ({ listingId }: ReviewSummaryProps) => {
  const [summary, setSummary] = useState<ReviewSummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await apiFetch.get(`/reviews/listing/${listingId}/summary`);
        setSummary(res.data.summary);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [listingId]);

  if (loading) return null;
  if (!summary) return null;

  return (
    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-6">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-indigo-500" />
        <h3 className="text-lg font-bold text-indigo-900">AI Review Summary</h3>
        <span className="ml-auto text-xs text-gray-400">Powered by Gemini</span>
      </div>

      {summary.sentiment && (
        <div className="mb-4 flex items-center gap-2">
          {summary.sentiment === "positive" ? (
            <ThumbsUp className="h-4 w-4 text-green-500" />
          ) : summary.sentiment === "negative" ? (
            <ThumbsDown className="h-4 w-4 text-red-500" />
          ) : (
            <ThumbsUp className="h-4 w-4 text-yellow-500" />
          )}
          <span className="text-sm font-medium capitalize text-gray-700">
            Overall Sentiment: {summary.sentiment}
          </span>
          {summary.summaryScore && (
            <span className="ml-auto text-sm font-bold text-gray-900">
              {summary.summaryScore.toFixed(1)} / 5
            </span>
          )}
        </div>
      )}

      {summary.loves && summary.loves.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 text-sm font-semibold text-green-700">
            Guests love:
          </p>
          <ul className="space-y-1">
            {summary.loves.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="mt-0.5 text-green-500">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary.complaints && summary.complaints.length > 0 && (
        <div>
          <p className="mb-1 text-sm font-semibold text-red-700">
            Guests complain about:
          </p>
          <ul className="space-y-1">
            {summary.complaints.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="mt-0.5 text-red-500">✗</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ReviewSummary;
