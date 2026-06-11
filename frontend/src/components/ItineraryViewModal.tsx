import { X, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ItineraryViewModalProps {
  open: boolean;
  onClose: () => void;
  content: string;
  preferences?: {
    people?: number;
    groupType?: string;
    style?: string;
    budget?: string;
  };
  totalDays?: number;
  // Optional footer action
  footerAction?: {
    label: string;
    onClick: () => void;
  };
  headerBadge?: string;
}

const ItineraryViewModal = ({
  open, onClose, content, preferences, totalDays,
  footerAction, headerBadge,
}: ItineraryViewModalProps) => {
  if (!open) return null;

  const tags: string[] = [];
  if (preferences) {
    if (preferences.people) tags.push(`👥 ${preferences.people} People`);
    if (preferences.groupType) tags.push(`🧳 ${preferences.groupType}`);
    if (preferences.style) tags.push(`✨ ${preferences.style}`);
    if (preferences.budget) tags.push(`💰 ${preferences.budget}`);
  }
  if (totalDays) tags.push(`📅 ${totalDays} Days`);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-20 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 text-white">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold">
              <Sparkles className="h-6 w-6 text-indigo-200" />
              AI Travel Plan
            </h2>
            <p className="mt-0.5 text-sm text-indigo-200">Personalized itinerary for your stay</p>
          </div>
          <div className="flex items-center gap-3">
            {headerBadge && (
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-medium">{headerBadge}</span>
            )}
            <button onClick={onClose} className="rounded-full p-1.5 transition hover:bg-white/20">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {tags.length > 0 && (
          <div className="border-b bg-gray-50 px-6 py-4">
            <div className="flex flex-wrap gap-2 text-sm">
              {tags.map((tag, i) => (
                <span key={tag} className="rounded-full border bg-white px-4 py-2 shadow-sm text-gray-700">{tag}</span>
              ))}
            </div>
          </div>
        )}

        <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
          <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-black prose-li:text-gray-700 prose-h1:mt-8 prose-h1:border-b prose-h1:border-indigo-100 prose-h1:pb-3 prose-h1:text-2xl prose-h1:text-indigo-900 prose-h2:mt-6 prose-h2:text-xl prose-h2:text-gray-800 prose-h3:text-lg prose-h3:text-gray-700 prose-ul:list-disc prose-ol:list-decimal prose-a:text-indigo-600 prose-code:text-indigo-700 prose-code:bg-indigo-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-img:rounded-2xl prose-table:border prose-table:border-gray-200 prose-th:bg-gray-50 prose-th:px-4 prose-th:py-2 prose-th:text-sm prose-th:font-semibold prose-td:px-4 prose-td:py-2 prose-td:text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
          </div>
        </div>

        {footerAction && (
          <div className="sticky bottom-0 border-t bg-gray-50/90 px-6 py-3 backdrop-blur-md">
            <button
              onClick={footerAction.onClick}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:from-indigo-700 hover:to-purple-700 active:scale-[0.98]"
            >
              <Sparkles className="h-4 w-4" />
              {footerAction.label}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItineraryViewModal;
