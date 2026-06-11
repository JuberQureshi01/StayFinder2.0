import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, CalendarDays } from "lucide-react";
import apiFetch from "../services/apiFetch";

interface AvailabilityCalendarProps {
  listingId: string;
}

const AvailabilityCalendar = ({ listingId }: AvailabilityCalendarProps) => {
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useEffect(() => {
    const fetchBlocked = async () => {
      try {
        const res = await apiFetch.get(`/listings/${listingId}/blocked-dates`);
        setBlockedDates(
          (res.data.blockedDates || []).map(
            (d: string) => new Date(d).toDateString(),
          ),
        );
      } catch {
        toast.error("Failed to load calendar");
      } finally {
        setLoading(false);
      }
    };
    fetchBlocked();
  }, [listingId]);

  const handleToggleDate = async (dateStr: string) => {
    setToggling(dateStr);
    try {
      const res = await apiFetch.post(`/listings/${listingId}/blocked-dates`, {
        date: dateStr,
      });
      setBlockedDates(
        (res.data.blockedDates || []).map(
          (d: string) => new Date(d).toDateString(),
        ),
      );
    } catch {
      toast.error("Failed to update date");
    } finally {
      setToggling(null);
    }
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const prevMonth = () =>
    setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () =>
    setCurrentMonth(new Date(year, month + 1, 1));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">
          <CalendarDays className="h-5 w-5" />
          Availability Calendar
        </h3>
        <p className="text-xs text-gray-500">
          Click dates to block/unblock
        </p>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="rounded-lg px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          ← {new Date(year, month - 1).toLocaleString("default", { month: "short" })}
        </button>
        <span className="text-sm font-bold text-gray-900">
          {new Date(year, month).toLocaleString("default", { month: "long", year: "numeric" })}
        </span>
        <button
          onClick={nextMonth}
          className="rounded-lg px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100"
        >
          {new Date(year, month + 1).toLocaleString("default", { month: "short" })} →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="py-1 text-[11px] font-semibold uppercase text-gray-400">
            {d}
          </div>
        ))}

        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const date = new Date(year, month, day);
          const dateStr = date.toDateString();
          const isBlocked = blockedDates.includes(dateStr);
          const isPast = date < today;
          const isToday = date.toDateString() === today.toDateString();

          return (
            <button
              key={day}
              disabled={isPast}
              onClick={() => handleToggleDate(dateStr)}
              className={`relative rounded-lg py-2 text-sm font-medium transition ${
                isPast
                  ? "cursor-not-allowed text-gray-300"
                  : isBlocked
                    ? "bg-rose-500 text-white hover:bg-rose-600"
                    : isToday
                      ? "bg-gray-100 text-gray-900 ring-1 ring-gray-300"
                      : "text-gray-700 hover:bg-gray-100"
              } ${toggling === dateStr ? "opacity-50" : ""}`}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-rose-500" />
          <span>Blocked</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-gray-100 ring-1 ring-gray-300" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded border border-gray-300" />
          <span>Available</span>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityCalendar;
