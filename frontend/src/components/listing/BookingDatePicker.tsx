import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Loader2, CalendarDays } from "lucide-react";
import apiFetch from "@/services/apiFetch";

interface BookingDatePickerProps {
  listingId: string;
  checkIn: string;
  checkOut: string;
  onCheckInChange: (date: string) => void;
  onCheckOutChange: (date: string) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const BookingDatePicker = ({
  listingId,
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange,
}: BookingDatePickerProps) => {
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  const [baseMonth, setBaseMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectingCheckOut, setSelectingCheckOut] = useState(false);

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const [availRes, blockedRes] = await Promise.all([
          apiFetch.get(`/listings/${listingId}/availability`),
          apiFetch.get(`/listings/${listingId}/blocked-dates`).catch(() => ({ data: { blockedDates: [] } })),
        ]);
        setUnavailableDates(availRes.data.unavailableDates || []);
        setBlockedDates(
          (blockedRes.data.blockedDates || []).map((d: any) => new Date(d).toISOString().split("T")[0]),
        );
      } catch {
        setUnavailableDates([]);
        setBlockedDates([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAvailability();
  }, [listingId]);

  const allBlocked = [...new Set([...unavailableDates, ...blockedDates])];
  const formatDate = (d: Date) => d.toISOString().split("T")[0];
  const isBlocked = (s: string) => allBlocked.includes(s);
  const isPast = (s: string) => s < todayStr;
  const isInRange = (s: string) => checkIn && checkOut && s > checkIn && s < checkOut;

  const canSelect = (s: string) => !isPast(s) && !isBlocked(s) && (!checkIn || selectingCheckOut || s > checkIn);

  const handleDateClick = (dateStr: string) => {
    if (!canSelect(dateStr)) return;
    if (!checkIn || (checkIn && checkOut)) {
      onCheckInChange(dateStr);
      onCheckOutChange("");
      setSelectingCheckOut(true);
    } else if (selectingCheckOut) {
      if (dateStr <= checkIn) {
        onCheckInChange(dateStr);
        onCheckOutChange("");
        return;
      }
      let cursor = new Date(checkIn);
      cursor.setDate(cursor.getDate() + 1);
      while (formatDate(cursor) < dateStr) {
        if (allBlocked.includes(formatDate(cursor))) {
          onCheckInChange(dateStr);
          onCheckOutChange("");
          return;
        }
        cursor.setDate(cursor.getDate() + 1);
      }
      onCheckOutChange(dateStr);
      setSelectingCheckOut(false);
    }
  };

  const renderMonth = (year: number, month: number) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const label = `${MONTHS[month]} ${year}`;

    const cells: React.ReactNode[] = [];

    WEEKDAYS.forEach((d) => {
      cells.push(
        <div key={`h-${d}`} className="py-1 text-center text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          {d}
        </div>,
      );
    });

    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`e-${i}`} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = formatDate(date);
      const blocked = isBlocked(dateStr);
      const past = isPast(dateStr);
      const inRange = isInRange(dateStr);
      const isStart = dateStr === checkIn;
      const isEnd = dateStr === checkOut;
      const selectable = canSelect(dateStr);
      const isToday = dateStr === todayStr;

      let cls = "relative h-10 w-full text-sm font-medium transition select-none";

      if (isStart || isEnd) {
        cls += " bg-gray-900 text-white font-semibold z-10";
      } else if (inRange) {
        cls += " bg-gray-100 text-gray-900";
      } else if (blocked || past) {
        cls += " text-gray-300 cursor-default";
      } else {
        cls += " text-gray-700 hover:bg-gray-100 cursor-pointer rounded-full";
      }

      if (isToday && !isStart && !isEnd) {
        cls += " ring-2 ring-gray-300 ring-inset";
      }

      if (isStart && !isEnd) {
        cls += " rounded-l-full";
      } else if (isEnd && !isStart) {
        cls += " rounded-r-full";
      } else if (isStart && isEnd) {
        cls += " rounded-full";
      }

      cells.push(
        <button
          key={day}
          type="button"
          disabled={!selectable}
          onClick={() => handleDateClick(dateStr)}
          className={cls}
        >
          {blocked && !past ? (
            <span className="line-through decoration-gray-300">{day}</span>
          ) : (
            <span>{day}</span>
          )}
        </button>,
      );
    }

    return { label, cells };
  };

  const prevMonth = () => setBaseMonth(new Date(baseMonth.getFullYear(), baseMonth.getMonth() - 1, 1));
  const nextMonth = () => setBaseMonth(new Date(baseMonth.getFullYear(), baseMonth.getMonth() + 1, 1));

  const year = baseMonth.getFullYear();
  const month = baseMonth.getMonth();
  const nextMonthDate = new Date(year, month + 1, 1);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const Summary = () =>
    checkIn ? (
      <div className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 text-sm">
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Check-in</p>
          <p className="mt-0.5 font-semibold text-gray-900">
            {new Date(checkIn).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div className="h-px w-6 bg-gray-300" />
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Check-out</p>
          <p className="mt-0.5 font-semibold text-gray-900">
            {checkOut
              ? new Date(checkOut).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })
              : "Select..."}
          </p>
        </div>
      </div>
    ) : null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-gray-700" />
          <h3 className="text-sm font-semibold text-gray-900">
            {checkIn && checkOut
              ? `${Math.ceil(
                  (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24),
                )} nights`
              : "Select dates"}
          </h3>
        </div>
        <div className="flex gap-1">
          <button type="button" onClick={prevMonth} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 transition">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={nextMonth} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 transition">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:gap-3">
        {[baseMonth, nextMonthDate].map((m, idx) => {
          const { label, cells } = renderMonth(m.getFullYear(), m.getMonth());
          return (
            <div key={idx} className={idx === 1 ? "hidden sm:block" : ""}>
              <div className="mb-1 text-center text-xs font-semibold text-gray-900">{label}</div>
              <div className="grid grid-cols-7">{cells}</div>
            </div>
          );
        })}
      </div>

      <Summary />

      <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-gray-500">
        <div className="flex items-center gap-1">
          <div className="h-2.5 w-2.5 rounded-full border border-gray-300" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2.5 w-2.5 rounded-full bg-gray-100" />
          <span>Range</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2.5 w-2.5 rounded-full bg-gray-900" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2.5 w-2.5 rounded-full bg-gray-200 line-through" />
          <span>Blocked</span>
        </div>
      </div>
    </div>
  );
};

export default BookingDatePicker;
