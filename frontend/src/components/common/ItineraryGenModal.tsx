import { X, Sparkles, Loader2 } from "lucide-react";

interface ItineraryGenModalProps {
  open: boolean;
  onClose: () => void;
  isGenerating: boolean;
  // Form fields
  people: number;
  groupType: string;
  style: string;
  budget: string;
  days: number;
  onPeopleChange: (v: number) => void;
  onGroupChange: (v: string) => void;
  onStyleChange: (v: string) => void;
  onBudgetChange: (v: string) => void;
  onDaysChange: (v: number) => void;
  onSubmit: () => void;
  // Badge
  badgeText?: string;
  submitLabel?: string;
}

const ItineraryGenModal = ({
  open, onClose, isGenerating,
  people, groupType, style, budget, days,
  onPeopleChange, onGroupChange, onStyleChange, onBudgetChange, onDaysChange,
  onSubmit, badgeText, submitLabel,
}: ItineraryGenModalProps) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-6 text-white">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Sparkles className="h-5 w-5" />
              AI Trip Planner
            </h2>
            <button onClick={onClose} className="rounded-full p-1.5 transition hover:bg-white/20">
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-1 text-sm text-indigo-100">Customize your perfect trip itinerary</p>
          {badgeText && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">
              <Sparkles className="h-3 w-3" />
              {badgeText}
            </div>
          )}
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">People</label>
              <input type="number" min="1" value={people} onChange={(e) => onPeopleChange(parseInt(e.target.value) || 1)} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Group Type</label>
              <select value={groupType} onChange={(e) => onGroupChange(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100">
                <option value="couple">Couple</option>
                <option value="family">Family</option>
                <option value="friends">Friends</option>
                <option value="solo">Solo</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Style</label>
              <select value={style} onChange={(e) => onStyleChange(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100">
                <option value="adventurous">Adventurous</option>
                <option value="relaxed">Relaxed</option>
                <option value="cultural">Cultural</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Budget</label>
              <select value={budget} onChange={(e) => onBudgetChange(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100">
                <option value="budget">Budget Friendly</option>
                <option value="moderate">Moderate</option>
                <option value="luxury">Luxury</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">Duration (days)</label>
              <input type="number" min="1" value={days} onChange={(e) => onDaysChange(parseInt(e.target.value) || 1)} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
            </div>
          </div>

          <button
            onClick={onSubmit}
            disabled={isGenerating}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 transition hover:from-indigo-700 hover:to-purple-700 active:scale-[0.98] disabled:opacity-50"
          >
            {isGenerating ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="h-4 w-4" /> {submitLabel || "Generate AI Itinerary"}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItineraryGenModal;
