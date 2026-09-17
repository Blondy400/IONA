"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import IonaLogo from "../../components/IonaLogo";
import { createClient } from "../../utils/supabase/client";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEK_DAYS = ["M", "T", "W", "T", "F", "S", "S"];

type PlannedOutfit = {
  id: string;
  user_id: string;
  planned_date: string;
  name: string | null;
  occasion: string | null;
  notes: string | null;
  wardrobe_item_ids: number[] | null;
  created_at: string;
  updated_at: string;
};

type WardrobeItem = {
  id: number;
  image_url: string | null;
  category: string | null;
  type: string | null;
  color: string | null;
  brand: string | null;
};

function isSameDate(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatSelectedDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatDatabaseDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDatabaseDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(year, month - 1, day);
}

export default function CalendarPage() {
  const router = useRouter();

  const supabase = useMemo(() => createClient(), []);

  const today = useMemo(() => new Date(), []);

  const [visibleDate, setVisibleDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const [selectedDate, setSelectedDate] = useState(today);

  const [plannedOutfits, setPlannedOutfits] = useState<PlannedOutfit[]>([]);
  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const year = visibleDate.getFullYear();
  const month = visibleDate.getMonth();

  useEffect(() => {
    async function loadCalendar() {
      try {
        setLoading(true);
        setErrorMessage("");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          router.push("/login");
          return;
        }

        const { data: outfitData, error: outfitError } = await supabase
          .from("planned_outfits")
          .select(
            `
              id,
              user_id,
              planned_date,
              name,
              occasion,
              notes,
              wardrobe_item_ids,
              created_at,
              updated_at
            `
          )
          .eq("user_id", user.id)
          .order("planned_date", { ascending: true });

        if (outfitError) {
          throw outfitError;
        }

        const outfits = (outfitData || []) as PlannedOutfit[];

        setPlannedOutfits(outfits);

        const wardrobeIds = Array.from(
          new Set(
            outfits.flatMap((outfit) => outfit.wardrobe_item_ids || [])
          )
        );

        if (wardrobeIds.length > 0) {
          const { data: wardrobeData, error: wardrobeError } = await supabase
            .from("wardrobe_items")
            .select(
              `
                id,
                image_url,
                category,
                type,
                color,
                brand
              `
            )
            .eq("user_id", user.id)
            .in("id", wardrobeIds);

          if (wardrobeError) {
            throw wardrobeError;
          }

          setWardrobeItems((wardrobeData || []) as WardrobeItem[]);
        } else {
          setWardrobeItems([]);
        }
      } catch (error: any) {
        console.error("Calendar loading error:", error);

        setErrorMessage(
          error?.message ||
            error?.details ||
            error?.hint ||
            "IONA could not load your planned looks."
        );
      } finally {
        setLoading(false);
      }
    }

    loadCalendar();
  }, [router, supabase]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Convert JS Sunday-first system to Monday-first.
    const firstWeekDay = (firstDay.getDay() + 6) % 7;

    const days: Array<{
      date: Date;
      currentMonth: boolean;
    }> = [];

    // Previous month days
    for (let i = firstWeekDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month, -i),
        currentMonth: false,
      });
    }

    // Current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push({
        date: new Date(year, month, day),
        currentMonth: true,
      });
    }

    // Complete final calendar row
    const remaining = (7 - (days.length % 7)) % 7;

    for (let day = 1; day <= remaining; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        currentMonth: false,
      });
    }

    return days;
  }, [year, month]);

  const selectedDateKey = formatDatabaseDate(selectedDate);

  const selectedOutfit = useMemo(() => {
    return (
      plannedOutfits.find(
        (outfit) => outfit.planned_date === selectedDateKey
      ) || null
    );
  }, [plannedOutfits, selectedDateKey]);

  const selectedOutfitItems = useMemo(() => {
    if (!selectedOutfit?.wardrobe_item_ids) {
      return [];
    }

    return selectedOutfit.wardrobe_item_ids
      .map((id) => wardrobeItems.find((item) => item.id === id))
      .filter((item): item is WardrobeItem => Boolean(item));
  }, [selectedOutfit, wardrobeItems]);

  const upcomingOutfits = useMemo(() => {
    const todayKey = formatDatabaseDate(today);

    return plannedOutfits
      .filter((outfit) => outfit.planned_date >= todayKey)
      .slice(0, 5);
  }, [plannedOutfits, today]);

  function previousMonth() {
    setVisibleDate(
      new Date(
        visibleDate.getFullYear(),
        visibleDate.getMonth() - 1,
        1
      )
    );
  }

  function nextMonth() {
    setVisibleDate(
      new Date(
        visibleDate.getFullYear(),
        visibleDate.getMonth() + 1,
        1
      )
    );
  }

  function selectDate(date: Date) {
    setSelectedDate(date);

    if (
      date.getMonth() !== visibleDate.getMonth() ||
      date.getFullYear() !== visibleDate.getFullYear()
    ) {
      setVisibleDate(
        new Date(date.getFullYear(), date.getMonth(), 1)
      );
    }
  }

  function hasPlannedOutfit(date: Date) {
    const key = formatDatabaseDate(date);

    return plannedOutfits.some(
      (outfit) => outfit.planned_date === key
    );
  }

  function getItemsForOutfit(outfit: PlannedOutfit) {
    if (!outfit.wardrobe_item_ids) {
      return [];
    }

    return outfit.wardrobe_item_ids
      .map((id) => wardrobeItems.find((item) => item.id === id))
      .filter((item): item is WardrobeItem => Boolean(item));
  }

  function handleAddLook() {
    router.push(
      `/ai-stylist?date=${formatDatabaseDate(selectedDate)}`
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#F8F4EE] text-[#1F1F1F]">
      <div className="mx-auto w-full max-w-[430px] px-5 pb-[calc(115px+env(safe-area-inset-bottom))] pt-[max(24px,env(safe-area-inset-top))]">

        {/* HEADER */}

        <header className="flex items-center justify-between">
          <IonaLogo />

          <button
            type="button"
            onClick={handleAddLook}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#DED6CB] bg-[#FCF9F4] text-[21px] font-light"
            aria-label="Add planned outfit"
          >
            +
          </button>
        </header>

        {/* HERO */}

        <section className="mt-10">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[#A98D61]">
            YOUR STYLE CALENDAR
          </p>

          <h1 className="mt-3 font-serif text-[38px] leading-[1.08]">
            Plan your
            <br />
            looks ahead.
          </h1>

          <p className="mt-4 max-w-[340px] text-[13px] leading-6 text-[#817970]">
            Plan what you'll wear for the days, events and moments
            that matter.
          </p>
        </section>

        {/* ERROR */}

        {errorMessage && (
          <section className="mt-6">
            <div className="rounded-[22px] border border-[#DCCFC0] bg-[#FCF9F4] px-5 py-4">
              <p className="text-[12px] leading-5 text-[#756E67]">
                {errorMessage}
              </p>
            </div>
          </section>
        )}

        {/* CALENDAR */}

        <section className="mt-9 overflow-hidden rounded-[28px] border border-[#DED6CB] bg-[#FCF9F4]">

          {/* MONTH HEADER */}

          <div className="flex items-center justify-between px-5 pb-5 pt-5">
            <button
              type="button"
              onClick={previousMonth}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E2DAD0] text-[#625B54]"
              aria-label="Previous month"
            >
              <ChevronLeftIcon />
            </button>

            <div className="text-center">
              <p className="font-serif text-[22px]">
                {MONTHS[month]}
              </p>

              <p className="mt-1 text-[10px] tracking-[0.16em] text-[#91887E]">
                {year}
              </p>
            </div>

            <button
              type="button"
              onClick={nextMonth}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E2DAD0] text-[#625B54]"
              aria-label="Next month"
            >
              <ChevronRightIcon />
            </button>
          </div>

          {/* WEEK DAYS */}

          <div className="grid grid-cols-7 border-t border-[#E9E2D9] px-3 pt-4">
            {WEEK_DAYS.map((day, index) => (
              <div
                key={`${day}-${index}`}
                className="text-center text-[9px] font-medium uppercase tracking-[0.12em] text-[#AAA199]"
              >
                {day}
              </div>
            ))}
          </div>

          {/* DAYS */}

          <div className="grid grid-cols-7 gap-y-2 px-3 pb-5 pt-3">
            {calendarDays.map(({ date, currentMonth }) => {
              const selected = isSameDate(
                date,
                selectedDate
              );

              const currentDay = isSameDate(
                date,
                today
              );

              const planned = hasPlannedOutfit(date);

              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => selectDate(date)}
                  className="relative flex h-[42px] items-center justify-center"
                >
                  <span
                    className={`relative flex h-9 w-9 items-center justify-center rounded-full text-[12px] transition ${
                      selected
                        ? "bg-[#1F1F1F] text-white"
                        : currentMonth
                        ? "text-[#4F4943]"
                        : "text-[#C5BDB4]"
                    }`}
                  >
                    {date.getDate()}

                    {planned && (
                      <span
                        className={`absolute -bottom-[4px] text-[8px] leading-none ${
                          selected
                            ? "text-[#D4C1A6]"
                            : "text-[#A98D61]"
                        }`}
                      >
                        ✦
                      </span>
                    )}

                    {currentDay && !selected && !planned && (
                      <span className="absolute bottom-[3px] h-[3px] w-[3px] rounded-full bg-[#A98D61]" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* SELECTED DATE */}

        <section className="mt-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[#A98D61]">
                Selected day
              </p>

              <h2 className="mt-2 font-serif text-[25px]">
                {formatSelectedDate(selectedDate)}
              </h2>
            </div>
          </div>
        </section>

        {/* LOADING */}

        {loading && (
          <section className="mt-5">
            <div className="rounded-[26px] border border-[#DED6CB] bg-[#FCF9F4] p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ECE4D9] text-[#A98D61]">
                  ✦
                </div>

                <div>
                  <p className="font-serif text-[18px]">
                    Loading your looks
                  </p>

                  <p className="mt-1 text-[11px] text-[#91887E]">
                    IONA is checking your style calendar.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SELECTED OUTFIT */}

        {!loading && selectedOutfit && (
          <section className="mt-5">
            <div className="overflow-hidden rounded-[26px] border border-[#DED6CB] bg-[#FCF9F4]">

              {selectedOutfitItems.length > 0 && (
                <div className="grid min-h-[190px] grid-cols-2 gap-px bg-[#E5DDD3]">
                  {selectedOutfitItems
                    .slice(0, 4)
                    .map((item) => (
                      <div
                        key={item.id}
                        className="flex min-h-[145px] items-center justify-center bg-[#F2ECE4] p-4"
                      >
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.type || "Wardrobe item"}
                            className="h-full max-h-[150px] w-full object-contain"
                          />
                        ) : (
                          <span className="text-[11px] text-[#91887E]">
                            {item.type || item.category || "Item"}
                          </span>
                        )}
                      </div>
                    ))}
                </div>
              )}

              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    {selectedOutfit.occasion && (
                      <p className="text-[9px] uppercase tracking-[0.18em] text-[#A98D61]">
                        {selectedOutfit.occasion}
                      </p>
                    )}

                    <h3 className="mt-2 font-serif text-[24px]">
                      {selectedOutfit.name || "Your planned look"}
                    </h3>
                  </div>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ECE4D9] text-[#A98D61]">
                    ✦
                  </div>
                </div>

                {selectedOutfit.notes && (
                  <p className="mt-3 text-[12px] leading-5 text-[#817970]">
                    {selectedOutfit.notes}
                  </p>
                )}

                {selectedOutfitItems.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {selectedOutfitItems.map((item) => (
                      <span
                        key={item.id}
                        className="rounded-full border border-[#DED6CB] bg-[#F8F4EE] px-3 py-1.5 text-[10px] text-[#625B54]"
                      >
                        {item.type ||
                          item.category ||
                          "Wardrobe item"}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* EMPTY LOOK */}

        {!loading && !selectedOutfit && (
          <section className="mt-5">
            <div className="rounded-[26px] border border-[#DED6CB] bg-[#FCF9F4] p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ECE4D9] text-[15px] text-[#A98D61]">
                ✦
              </div>

              <h3 className="mt-5 font-serif text-[22px]">
                No look planned yet
              </h3>

              <p className="mt-2 max-w-[290px] text-[12px] leading-5 text-[#817970]">
                Style a look with IONA and save it here so you
                always know what you're wearing.
              </p>

              <Link
                href={`/ai-stylist?date=${selectedDateKey}`}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#1F1F1F] px-6 py-3.5 text-[12px] font-medium text-white"
              >
                Style a look

                <span className="text-[#D4C1A6]">
                  ✦
                </span>
              </Link>
            </div>
          </section>
        )}

        {/* UPCOMING */}

        <section className="mt-9">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-serif text-[23px]">
                Upcoming looks
              </p>

              <p className="mt-1 text-[12px] text-[#91887E]">
                Your planned outfits will appear here.
              </p>
            </div>
          </div>

          {!loading && upcomingOutfits.length === 0 ? (
            <div className="mt-5 rounded-[24px] border border-dashed border-[#D8CEC0] px-5 py-7 text-center">
              <CalendarSmallIcon />

              <p className="mt-3 text-[12px] text-[#817970]">
                Nothing planned yet.
              </p>

              <p className="mx-auto mt-1 max-w-[250px] text-[10px] leading-4 text-[#AAA199]">
                Your future looks and outfit plans will live here.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {upcomingOutfits.map((outfit) => {
                const outfitDate = parseDatabaseDate(
                  outfit.planned_date
                );

                const items = getItemsForOutfit(outfit);

                return (
                  <button
                    key={outfit.id}
                    type="button"
                    onClick={() => selectDate(outfitDate)}
                    className="flex w-full items-center gap-4 rounded-[22px] border border-[#DED6CB] bg-[#FCF9F4] p-3 text-left"
                  >
                    <div className="flex h-[70px] w-[70px] shrink-0 items-center justify-center overflow-hidden rounded-[17px] bg-[#EEE6DC]">
                      {items[0]?.image_url ? (
                        <img
                          src={items[0].image_url}
                          alt={items[0].type || "Planned look"}
                          className="h-full w-full object-contain p-2"
                        />
                      ) : (
                        <span className="text-[14px] text-[#A98D61]">
                          ✦
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] uppercase tracking-[0.14em] text-[#A98D61]">
                        {outfitDate.toLocaleDateString(
                          "en-US",
                          {
                            day: "numeric",
                            month: "short",
                          }
                        )}
                      </p>

                      <p className="mt-1 truncate font-serif text-[17px]">
                        {outfit.name || "Planned look"}
                      </p>

                      {outfit.occasion && (
                        <p className="mt-1 truncate text-[10px] text-[#91887E]">
                          {outfit.occasion}
                        </p>
                      )}
                    </div>

                    <ChevronRightIcon />
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* BOTTOM NAVIGATION */}

      <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-[430px] -translate-x-1/2 border-t border-[#E1D9CF] bg-[#F8F4EE]/95 px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
        <div className="grid grid-cols-5 items-end">
          <NavItem
            href="/home"
            label="Home"
            icon={<HomeIcon />}
          />

          <NavItem
            href="/wardrobe"
            label="Wardrobe"
            icon={<WardrobeIcon />}
          />

          <Link
            href="/ai-stylist"
            className="flex flex-col items-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1F1F1F] text-[18px] text-[#D8C3A5] shadow-sm">
              ✦
            </div>

            <span className="mt-1 text-[10px] text-[#756E67]">
              Stylist
            </span>
          </Link>

          <NavItem
            href="/calendar"
            label="Calendar"
            active
            icon={<CalendarIcon />}
          />

          <NavItem
            href="/profile"
            label="Profile"
            icon={<ProfileIcon />}
          />
        </div>
      </nav>
    </main>
  );
}

/* -------------------------------- */
/* NAVIGATION                       */
/* -------------------------------- */

function NavItem({
  href,
  label,
  icon,
  active = false,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-1 ${
        active
          ? "text-[#1F1F1F]"
          : "text-[#91887E]"
      }`}
    >
      {icon}

      <span
        className={`text-[10px] ${
          active ? "font-medium" : ""
        }`}
      >
        {label}
      </span>
    </Link>
  );
}

/* -------------------------------- */
/* ICONS                            */
/* -------------------------------- */

function ChevronLeftIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M15 18L9 12L15 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M9 6L15 12L9 18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarSmallIcon() {
  return (
    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#ECE4D9] text-[#A98D61]">
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
      >
        <rect
          x="4"
          y="5.5"
          width="16"
          height="14"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.4"
        />

        <path
          d="M8 3V7M16 3V7M4 10H20"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function HomeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M4 10.5L12 4L20 10.5V20H14.5V14H9.5V20H4V10.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WardrobeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M8 6C8 3.8 9.3 2.5 12 2.5C14.2 2.5 15.5 3.6 15.5 5.2C15.5 6.4 14.8 7.2 13.5 7.8L20 12.5L17.5 15.5L12 11.5L6.5 15.5L4 12.5L10.5 7.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
    >
      <rect
        x="4"
        y="5.5"
        width="16"
        height="14"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.4"
      />

      <path
        d="M8 3V7M16 3V7M4 10H20"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="8"
        r="3.2"
        stroke="currentColor"
        strokeWidth="1.4"
      />

      <path
        d="M5.5 20C6.3 16.5 8.5 14.5 12 14.5C15.5 14.5 17.7 16.5 18.5 20"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}