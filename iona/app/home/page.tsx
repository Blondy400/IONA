"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../utils/supabase/client";
import IonaLogo from "../../components/IonaLogo";

type Profile = {
  first_name: string | null;
  profile_photo_url: string | null;
  onboarding_completed: boolean | null;
};

export default function HomePage() {
  const router = useRouter();

  const [greeting, setGreeting] = useState("Good morning");
  const [firstName, setFirstName] = useState("");
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  /*
   * GREETING BASED ON PHONE / DEVICE TIME
   */
  useEffect(() => {
    function updateGreeting() {
      const hour = new Date().getHours();

      if (hour >= 5 && hour < 12) {
        setGreeting("Good morning");
      } else if (hour >= 12 && hour < 18) {
        setGreeting("Good afternoon");
      } else {
        setGreeting("Good evening");
      }
    }

    updateGreeting();

    const interval = setInterval(updateGreeting, 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  /*
   * LOAD PROFILE FROM SUPABASE
   */
  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    async function loadProfile() {
      try {
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

        const { data, error: profileError } = await supabase
          .from("profiles")
          .select(
            "first_name, profile_photo_url, onboarding_completed"
          )
          .eq("id", user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        if (!isMounted) return;

        const profile = data as Profile;

        /*
         * If onboarding is not finished,
         * send user back to onboarding.
         */
        if (profile.onboarding_completed === false) {
          router.push("/onboarding");
          return;
        }

        /*
         * FIRST NAME
         */
        const resolvedFirstName =
          profile.first_name?.trim() || "You";

        setFirstName(resolvedFirstName);

        /*
         * PROFILE PHOTO
         *
         * Bucket is private, so we create
         * a temporary signed URL.
         */
        if (profile.profile_photo_url) {
          const {
            data: signedData,
            error: signedError,
          } = await supabase.storage
            .from("profile-images")
            .createSignedUrl(
              profile.profile_photo_url,
              60 * 60
            );

          if (signedError) {
            console.error(
              "Error creating profile image URL:",
              signedError
            );
          }

          if (
            isMounted &&
            signedData?.signedUrl
          ) {
            setProfileImageUrl(
              signedData.signedUrl
            );
          }
        }
      } catch (error: any) {
        console.error(
          "Error loading Home profile:",
          error?.message || error
        );
      } finally {
        if (isMounted) {
          setLoadingProfile(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [router]);

  /*
   * PROFILE INITIAL FALLBACK
   */
  const profileInitial =
    firstName &&
    firstName !== "You"
      ? firstName.charAt(0).toUpperCase()
      : "✦";

  return (
    <main className="min-h-[100dvh] bg-[#F8F4EE] text-[#1F1F1F]">
      <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] px-5 pb-28 pt-[max(18px,env(safe-area-inset-top))]">

        {/* TOP BAR */}

        <header className="flex items-center justify-between">

          {/* OFFICIAL IONA LOGO */}

          <IonaLogo />

          {/* RIGHT ACTIONS */}

          <div className="flex items-center gap-3">

            {/* CHAT */}

            <Link
              href="/chat"
              aria-label="Chat with IONA"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#DDD5CA] bg-[#FCF9F4] transition active:scale-95"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M21 11.5C21 16.1944 16.9706 20 12 20C10.6904 20 9.44617 19.7358 8.3235 19.2606L3 21L4.48683 16.5395C3.54828 15.1233 3 13.4026 3 11.5C3 6.80558 7.02944 3 12 3C16.9706 3 21 6.80558 21 11.5Z"
                  stroke="#1F1F1F"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                <circle
                  cx="8.5"
                  cy="11.5"
                  r="1"
                  fill="#1F1F1F"
                />

                <circle
                  cx="12"
                  cy="11.5"
                  r="1"
                  fill="#1F1F1F"
                />

                <circle
                  cx="15.5"
                  cy="11.5"
                  r="1"
                  fill="#1F1F1F"
                />
              </svg>
            </Link>

            {/* PROFILE */}

            <Link
              href="/profile"
              aria-label="Profile"
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[#DDD5CA] bg-[#E8DED1] text-sm transition active:scale-95"
            >
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>
                  {loadingProfile
                    ? "✦"
                    : profileInitial}
                </span>
              )}
            </Link>

          </div>
        </header>

        {/* GREETING */}

        <section className="mt-8">

          <p className="font-serif text-[17px] text-[#6D675F]">
            {greeting},
          </p>

          <h1 className="mt-1 font-serif text-[42px] leading-none">
            {loadingProfile
              ? "..."
              : firstName || "You"}{" "}
            ♡
          </h1>

        </section>

        {/* TODAY'S OUTFIT */}

        <section className="mt-7 overflow-hidden rounded-[26px] bg-[#EEE6DC]">

          <div className="relative h-[420px] w-full bg-[#D9CEC0]">

            {/* TEMP PREVIEW */}

            <div className="absolute inset-0 flex items-center justify-center">

              <div className="text-center text-[#7A726B]">

                <div className="text-[48px]">
                  ✦
                </div>

                <p className="mt-3 text-[13px]">
                  Today&apos;s outfit preview
                </p>

              </div>

            </div>

            {/* OUTFIT LABEL */}

            <div className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-[20px] bg-[#F8F4EE]/95 px-4 py-3 backdrop-blur-md">

              <div>

                <p className="font-serif text-[17px]">
                  Today&apos;s outfit
                </p>

                <p className="text-[12px] text-[#726B64]">
                  Effortless & Chic
                </p>

              </div>

              <Link
                href="/ai-stylist"
                aria-label="Open outfit"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition active:scale-95"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M5 12H19"
                    stroke="#1F1F1F"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />

                  <path
                    d="M14 7L19 12L14 17"
                    stroke="#1F1F1F"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>

            </div>
          </div>
        </section>

        {/* STYLE ME */}

        <Link
          href="/ai-stylist"
          className="mt-4 flex w-full items-center justify-center rounded-full bg-[#1F1F1F] px-6 py-4 text-[15px] font-medium text-white transition active:scale-[0.98]"
        >
          Style me today

          <span className="ml-3 text-[#D8C3A5]">
            ✦
          </span>
        </Link>

        {/* WARDROBE */}

        <section className="mt-8">

          <div className="flex items-center justify-between">

            <h2 className="font-serif text-[23px]">
              Your wardrobe
            </h2>

            <Link
              href="/wardrobe"
              className="text-[12px] text-[#777067]"
            >
              View all →
            </Link>

          </div>

          <div className="mt-4 grid grid-cols-4 gap-3">

            {/* OUTFITS */}

            <Link
              href="/wardrobe"
              className="flex aspect-square flex-col items-center justify-center rounded-[22px] bg-[#EFE8DF] transition active:scale-95"
            >
              <svg
                width="23"
                height="23"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M12 3L13.6 8.4L19 10L13.6 11.6L12 17L10.4 11.6L5 10L10.4 8.4L12 3Z"
                  stroke="#1F1F1F"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
              </svg>

              <span className="mt-2 text-[11px]">
                Outfits
              </span>
            </Link>

            {/* CLOTHES */}

            <Link
              href="/wardrobe"
              className="flex aspect-square flex-col items-center justify-center rounded-[22px] bg-[#EFE8DF] transition active:scale-95"
            >
              <svg
                width="23"
                height="23"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M9 4L6 6L3.5 10L6.5 12V20H17.5V12L20.5 10L18 6L15 4C14.3 5.3 13.3 6 12 6C10.7 6 9.7 5.3 9 4Z"
                  stroke="#1F1F1F"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <span className="mt-2 text-[11px]">
                Clothes
              </span>
            </Link>

            {/* SHOES */}

            <Link
              href="/wardrobe"
              className="flex aspect-square flex-col items-center justify-center rounded-[22px] bg-[#EFE8DF] transition active:scale-95"
            >
              <svg
                width="23"
                height="23"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M5 14C7.5 14.5 9.2 14.1 10.5 12.5L12 10.7C12.5 10.1 13.4 10 14 10.5L19.5 15C20.3 15.7 19.8 17 18.7 17H7C5.9 17 5 16.1 5 15V14Z"
                  stroke="#1F1F1F"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <span className="mt-2 text-[11px]">
                Shoes
              </span>
            </Link>

            {/* BAGS */}

            <Link
              href="/wardrobe"
              className="flex aspect-square flex-col items-center justify-center rounded-[22px] bg-[#EFE8DF] transition active:scale-95"
            >
              <svg
                width="23"
                height="23"
                viewBox="0 0 24 24"
                fill="none"
              >
                <rect
                  x="5"
                  y="8"
                  width="14"
                  height="11"
                  rx="2"
                  stroke="#1F1F1F"
                  strokeWidth="1.5"
                />

                <path
                  d="M9 8V7C9 5.3 10.3 4 12 4C13.7 4 15 5.3 15 7V8"
                  stroke="#1F1F1F"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>

              <span className="mt-2 text-[11px]">
                Bags
              </span>
            </Link>

          </div>
        </section>
      </div>

      {/* BOTTOM NAVIGATION */}

      <nav className="fixed bottom-0 left-1/2 z-50 flex w-full max-w-[430px] -translate-x-1/2 items-end justify-between border-t border-[#E2D9CF] bg-[#FCF9F5]/95 px-5 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md">

        {/* HOME */}

        <Link
          href="/home"
          className="flex w-14 flex-col items-center gap-1 text-[10px]"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M3.5 10.5L12 3.5L20.5 10.5V20H14.5V14H9.5V20H3.5V10.5Z"
              stroke="#1F1F1F"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <span>Home</span>
        </Link>

        {/* WARDROBE */}

        <Link
          href="/wardrobe"
          className="flex w-14 flex-col items-center gap-1 text-[10px] text-[#726B64]"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M12 4C10.4 4 9.2 5.1 9.2 6.5C9.2 7.8 10.2 8.8 11.5 8.9V10L5 14.5C4.5 14.8 4.7 15.5 5.3 15.5H18.7C19.3 15.5 19.5 14.8 19 14.5L12.5 10V8.7"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <span>Wardrobe</span>
        </Link>

        {/* AI STYLIST */}

        <Link
          href="/ai-stylist"
          aria-label="AI Stylist"
          className="-mt-7 flex h-14 w-14 items-center justify-center rounded-full border-[5px] border-[#FCF9F5] bg-[#1F1F1F] text-[22px] text-[#E2CFAE] shadow-lg transition active:scale-95"
        >
          ✦
        </Link>

        {/* CALENDAR */}

        <Link
          href="/calendar"
          className="flex w-14 flex-col items-center gap-1 text-[10px] text-[#726B64]"
        >
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
              strokeWidth="1.5"
            />

            <path
              d="M8 3.5V7.5M16 3.5V7.5M4 9.5H20"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>

          <span>Calendar</span>
        </Link>

        {/* PROFILE */}

        <Link
          href="/profile"
          className="flex w-14 flex-col items-center gap-1 text-[10px] text-[#726B64]"
        >
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
              strokeWidth="1.5"
            />

            <path
              d="M5.5 19C6.4 15.8 8.6 14 12 14C15.4 14 17.6 15.8 18.5 19"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>

          <span>Profile</span>
        </Link>

      </nav>
    </main>
  );
}