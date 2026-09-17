"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "../../utils/supabase/client";
import IonaLogo from "../../components/IonaLogo";

type Profile = {
  id: string;

  first_name: string | null;
  last_name: string | null;
  date_of_birth: string | null;
  gender: string | null;

  height_cm: number | null;
  weight_kg: number | null;
  bust_cm: number | null;
  waist_cm: number | null;
  hips_cm: number | null;
  inseam_cm: number | null;

  profile_photo_url: string | null;
  avatar_photo_url: string | null;

  preferred_styles: string[] | null;
  preferred_colors: string[] | null;
  avoided_colors: string[] | null;

  onboarding_completed: boolean | null;
};

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
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

        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        const profileData = data as Profile;

        setProfile(profileData);

        if (profileData.profile_photo_url) {
          const { data: signedData, error: signedError } =
            await supabase.storage
              .from("profile-images")
              .createSignedUrl(profileData.profile_photo_url, 60 * 60);

          if (signedError) {
            console.error(
              "Error creating profile photo signed URL:",
              signedError
            );
          } else {
            setProfileImageUrl(signedData.signedUrl);
          }
        }
      } catch (error: any) {
        console.error("Error loading profile:", error);

        setErrorMessage(
          error?.message ||
            error?.details ||
            error?.hint ||
            "We could not load your profile."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  function formatDate(date: string | null) {
    if (!date) return "Not added";

    const parsedDate = new Date(`${date}T00:00:00`);

    return parsedDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  function displayValue(value: number | null, suffix: string) {
    if (value === null || value === undefined) {
      return "—";
    }

    return `${value} ${suffix}`;
  }

  function getInitials() {
    const first = profile?.first_name?.trim()?.[0] || "";
    const last = profile?.last_name?.trim()?.[0] || "";

    return `${first}${last}`.toUpperCase() || "I";
  }

  if (loading) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#F8F4EE] text-[#1F1F1F]">
        <div className="text-center">
          <IonaLogo />

          <p className="mt-4 text-[12px] tracking-[0.16em] text-[#91887E]">
            LOADING YOUR PROFILE
          </p>
        </div>
      </main>
    );
  }

  if (errorMessage || !profile) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#F8F4EE] px-6 text-[#1F1F1F]">
        <div className="w-full max-w-[360px] text-center">
          <IonaLogo />

          <h1 className="mt-8 font-serif text-[30px]">
            We couldn't load your profile
          </h1>

          <p className="mt-3 text-[13px] leading-6 text-[#756E67]">
            {errorMessage || "Please try again."}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-7 rounded-full bg-[#1F1F1F] px-7 py-3 text-[13px] text-white"
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#F8F4EE] text-[#1F1F1F]">
      <div className="mx-auto min-h-[100dvh] w-full max-w-[430px] px-5 pb-[calc(110px+env(safe-area-inset-bottom))] pt-[max(24px,env(safe-area-inset-top))]">

        {/* HEADER */}

        <header className="flex items-center justify-between">
          <IonaLogo />

          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#DED6CB] bg-[#FCF9F4]"
            aria-label="Profile settings"
          >
            <svg
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="12"
                cy="12"
                r="3"
                stroke="currentColor"
                strokeWidth="1.4"
              />

              <path
                d="M19 12C19 11.4 18.9 10.8 18.8 10.3L21 8.7L19 5.3L16.4 6.4C15.5 5.7 14.5 5.1 13.4 4.8L13 2H9L8.6 4.8C7.5 5.1 6.5 5.7 5.6 6.4L3 5.3L1 8.7L3.2 10.3C3.1 10.8 3 11.4 3 12C3 12.6 3.1 13.2 3.2 13.7L1 15.3L3 18.7L5.6 17.6C6.5 18.3 7.5 18.9 8.6 19.2L9 22H13L13.4 19.2C14.5 18.9 15.5 18.3 16.4 17.6L19 18.7L21 15.3L18.8 13.7C18.9 13.2 19 12.6 19 12Z"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </header>

        {/* PROFILE HERO */}

        <section className="mt-9 text-center">
          <div className="relative mx-auto h-[112px] w-[112px]">
            <div className="h-full w-full overflow-hidden rounded-full border border-[#D8CEC0] bg-[#E8DED1]">
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-serif text-[30px] text-[#71685F]">
                  {getInitials()}
                </div>
              )}
            </div>

            <Link
              href="/profile/edit"
              className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-[#F8F4EE] bg-[#1F1F1F] text-white"
              aria-label="Change profile photo"
            >
              +
            </Link>
          </div>

          <h1 className="mt-5 font-serif text-[32px] leading-tight">
            {[profile.first_name, profile.last_name]
              .filter(Boolean)
              .join(" ") || "Your Profile"}
          </h1>

          <p className="mt-2 text-[12px] uppercase tracking-[0.18em] text-[#91887E]">
            Your personal style profile
          </p>

          <Link
            href="/profile/edit"
            className="mt-5 inline-flex rounded-full border border-[#CFC5B8] bg-[#FCF9F4] px-6 py-2.5 text-[13px]"
          >
            Edit profile
          </Link>
        </section>

        {/* PERSONAL DETAILS */}

        <section className="mt-10">
          <SectionHeader
            title="Personal details"
            subtitle="The basics IONA knows about you."
          />

          <div className="mt-4 overflow-hidden rounded-[24px] border border-[#DED6CB] bg-[#FCF9F4]">
            <ProfileRow
              label="First name"
              value={profile.first_name || "—"}
            />

            <Divider />

            <ProfileRow
              label="Last name"
              value={profile.last_name || "—"}
            />

            <Divider />

            <ProfileRow
              label="Date of birth"
              value={formatDate(profile.date_of_birth)}
            />

            <Divider />

            <ProfileRow
              label="Gender"
              value={profile.gender || "Not added"}
            />
          </div>
        </section>

        {/* BODY */}

        <section className="mt-9">
          <SectionHeader
            title="Your body"
            subtitle="Used to make styling more personal."
          />

          <div className="mt-4 grid grid-cols-2 gap-3">
            <MeasurementCard
              label="Height"
              value={displayValue(profile.height_cm, "cm")}
            />

            <MeasurementCard
              label="Weight"
              value={displayValue(profile.weight_kg, "kg")}
            />

            <MeasurementCard
              label="Bust / Chest"
              value={displayValue(profile.bust_cm, "cm")}
            />

            <MeasurementCard
              label="Waist"
              value={displayValue(profile.waist_cm, "cm")}
            />

            <MeasurementCard
              label="Hips"
              value={displayValue(profile.hips_cm, "cm")}
            />

            <MeasurementCard
              label="Inside leg"
              value={displayValue(profile.inseam_cm, "cm")}
            />
          </div>
        </section>

        {/* STYLE */}

        <section className="mt-9">
          <SectionHeader
            title="Your style"
            subtitle="Preferences used by IONA Stylist."
          />

          <div className="mt-4 rounded-[24px] border border-[#DED6CB] bg-[#FCF9F4] p-5">
            <TagSection
              title="Styles you love"
              values={profile.preferred_styles}
            />

            <div className="my-5 h-px bg-[#E7E0D7]" />

            <TagSection
              title="Colors you love"
              values={profile.preferred_colors}
            />

            <div className="my-5 h-px bg-[#E7E0D7]" />

            <TagSection
              title="Colors you avoid"
              values={profile.avoided_colors}
            />
          </div>
        </section>

        {/* PROFILE NOTE */}

        <section className="mt-9">
          <div className="rounded-[24px] bg-[#ECE4D9] p-5">
            <div className="flex gap-3">
              <span className="mt-[3px] text-[#A98D61]">
                ✦
              </span>

              <div>
                <p className="font-serif text-[18px]">
                  Your{" "}
                  <InlineIona className="text-[18px]" />{" "}
                  profile
                </p>

                <p className="mt-2 text-[12px] leading-5 text-[#756E67]">
                  Your measurements and style preferences help{" "}
                  <InlineIona className="text-[12px]" />{" "}
                  make more relevant outfit suggestions for you.
                </p>
              </div>
            </div>
          </div>
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
            icon={<CalendarIcon />}
          />

          <NavItem
            href="/profile"
            label="Profile"
            active
            icon={<ProfileIcon />}
          />
        </div>
      </nav>
    </main>
  );
}

/* ======================================================
   INLINE IONA LOGO
====================================================== */

function InlineIona({
  className = "",
}: {
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-baseline font-serif tracking-[0.04em] ${className}`}
    >
      I
      <span className="relative inline-flex">
        O

        <span
          className="
            pointer-events-none
            absolute
            left-1/2
            top-1/2
            -translate-x-1/2
            -translate-y-1/2
            font-sans
            text-[0.32em]
            leading-none
            tracking-normal
          "
        >
          ✦
        </span>
      </span>
      NA
    </span>
  );
}

/* ======================================================
   COMPONENTS
====================================================== */

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <h2 className="font-serif text-[24px]">
        {title}
      </h2>

      <p className="mt-1 text-[12px] leading-5 text-[#8A827A]">
        {subtitle}
      </p>
    </div>
  );
}

function ProfileRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-5 px-5 py-4">
      <span className="text-[13px] text-[#817970]">
        {label}
      </span>

      <span className="text-right text-[13px] font-medium">
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="mx-5 h-px bg-[#E7E0D7]" />;
}

function MeasurementCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] border border-[#DED6CB] bg-[#FCF9F4] p-4">
      <p className="text-[11px] uppercase tracking-[0.12em] text-[#91887E]">
        {label}
      </p>

      <p className="mt-3 font-serif text-[21px]">
        {value}
      </p>
    </div>
  );
}

function TagSection({
  title,
  values,
}: {
  title: string;
  values: string[] | null;
}) {
  return (
    <div>
      <p className="text-[12px] text-[#817970]">
        {title}
      </p>

      {values && values.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {values.map((value) => (
            <span
              key={value}
              className="rounded-full border border-[#D8CEC0] bg-[#F8F4EE] px-3 py-1.5 text-[11px]"
            >
              {value}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-[12px] text-[#AAA199]">
          Not added yet
        </p>
      )}
    </div>
  );
}

/* ======================================================
   NAVIGATION
====================================================== */

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

      <span className="text-[10px]">
        {label}
      </span>
    </Link>
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