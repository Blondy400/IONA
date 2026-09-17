"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../utils/supabase/client";

const STYLE_OPTIONS = [
  "Minimal",
  "Elegant",
  "Casual",
  "Streetwear",
  "Sporty",
  "Romantic",
  "Business",
  "Glam",
  "Old Money",
  "Classic",
];

const COLOR_OPTIONS = [
  "Black",
  "White",
  "Beige",
  "Brown",
  "Grey",
  "Blue",
  "Green",
  "Red",
  "Pink",
  "Purple",
];

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
};

export default function EditProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");

  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bust, setBust] = useState("");
  const [waist, setWaist] = useState("");
  const [hips, setHips] = useState("");
  const [inseam, setInseam] = useState("");

  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [preferredColors, setPreferredColors] = useState<string[]>([]);
  const [avoidedColors, setAvoidedColors] = useState<string[]>([]);

  const [currentProfilePath, setCurrentProfilePath] =
    useState<string | null>(null);

  const [currentBodyPath, setCurrentBodyPath] =
    useState<string | null>(null);

  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [bodyPhoto, setBodyPhoto] = useState<File | null>(null);

  const [profilePreview, setProfilePreview] =
    useState<string | null>(null);

  const [bodyPreview, setBodyPreview] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw userError;

        if (!user) {
          router.push("/login");
          return;
        }

        setUserId(user.id);

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        const profile = data as Profile;

        setFirstName(profile.first_name || "");
        setLastName(profile.last_name || "");
        setDateOfBirth(profile.date_of_birth || "");
        setGender(profile.gender || "");

        setHeight(numberToInput(profile.height_cm));
        setWeight(numberToInput(profile.weight_kg));
        setBust(numberToInput(profile.bust_cm));
        setWaist(numberToInput(profile.waist_cm));
        setHips(numberToInput(profile.hips_cm));
        setInseam(numberToInput(profile.inseam_cm));

        setSelectedStyles(profile.preferred_styles || []);
        setPreferredColors(profile.preferred_colors || []);
        setAvoidedColors(profile.avoided_colors || []);

        setCurrentProfilePath(profile.profile_photo_url);
        setCurrentBodyPath(profile.avatar_photo_url);

        if (profile.profile_photo_url) {
          const { data: signedData } = await supabase.storage
            .from("profile-images")
            .createSignedUrl(profile.profile_photo_url, 3600);

          if (signedData?.signedUrl) {
            setProfilePreview(signedData.signedUrl);
          }
        }

        if (profile.avatar_photo_url) {
          const { data: signedData } = await supabase.storage
            .from("profile-images")
            .createSignedUrl(profile.avatar_photo_url, 3600);

          if (signedData?.signedUrl) {
            setBodyPreview(signedData.signedUrl);
          }
        }
      } catch (error: any) {
        console.error("Error loading profile:", error);

        setErrorMessage(
          error?.message ||
            error?.details ||
            "We could not load your profile."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  function numberToInput(value: number | null) {
    if (value === null || value === undefined) return "";
    return String(value);
  }

  function inputToNumber(value: string) {
    const cleanValue = value.trim();

    if (!cleanValue) return null;

    const number = Number(cleanValue.replace(",", "."));

    return Number.isFinite(number) ? number : null;
  }

  function toggleItem(
    item: string,
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) {
    if (list.includes(item)) {
      setList(list.filter((value) => value !== item));
    } else {
      setList([...list, item]);
    }
  }

  function togglePreferredColor(color: string) {
    setPreferredColors((current) =>
      current.includes(color)
        ? current.filter((value) => value !== color)
        : [...current, color]
    );

    setAvoidedColors((current) =>
      current.filter((value) => value !== color)
    );
  }

  function toggleAvoidedColor(color: string) {
    setAvoidedColors((current) =>
      current.includes(color)
        ? current.filter((value) => value !== color)
        : [...current, color]
    );

    setPreferredColors((current) =>
      current.filter((value) => value !== color)
    );
  }

  function validateImage(file: File) {
    if (!file.type.startsWith("image/")) {
      return "Please choose an image file.";
    }

    if (file.size > 10 * 1024 * 1024) {
      return "Image must be smaller than 10 MB.";
    }

    return null;
  }

  function handleProfilePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const error = validateImage(file);

    if (error) {
      setErrorMessage(error);
      return;
    }

    setErrorMessage("");
    setProfilePhoto(file);

    setProfilePreview((previous) => {
      if (previous?.startsWith("blob:")) {
        URL.revokeObjectURL(previous);
      }

      return URL.createObjectURL(file);
    });
  }

  function handleBodyPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const error = validateImage(file);

    if (error) {
      setErrorMessage(error);
      return;
    }

    setErrorMessage("");
    setBodyPhoto(file);

    setBodyPreview((previous) => {
      if (previous?.startsWith("blob:")) {
        URL.revokeObjectURL(previous);
      }

      return URL.createObjectURL(file);
    });
  }

  function getExtension(file: File) {
    const extension = file.name.split(".").pop()?.toLowerCase();

    if (extension) return extension;

    if (file.type === "image/png") return "png";
    if (file.type === "image/heic") return "heic";
    if (file.type === "image/heif") return "heif";

    return "jpg";
  }

  async function uploadPhoto(
    file: File,
    type: "profile" | "body"
  ) {
    const extension = getExtension(file);
    const path = `${userId}/${type}.${extension}`;

    const { error } = await supabase.storage
      .from("profile-images")
      .upload(path, file, {
        upsert: true,
        cacheControl: "3600",
        contentType: file.type || undefined,
      });

    if (error) throw error;

    return path;
  }

  async function handleSave() {
    if (!userId) return;

    if (!firstName.trim()) {
      setErrorMessage("Please add your first name.");
      return;
    }

    setSaving(true);
    setErrorMessage("");

    try {
      let profilePath = currentProfilePath;
      let bodyPath = currentBodyPath;

      if (profilePhoto) {
        profilePath = await uploadPhoto(profilePhoto, "profile");
      }

      if (bodyPhoto) {
        bodyPath = await uploadPhoto(bodyPhoto, "body");
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim() || null,
          date_of_birth: dateOfBirth || null,
          gender: gender || null,

          height_cm: inputToNumber(height),
          weight_kg: inputToNumber(weight),
          bust_cm: inputToNumber(bust),
          waist_cm: inputToNumber(waist),
          hips_cm: inputToNumber(hips),
          inseam_cm: inputToNumber(inseam),

          preferred_styles: selectedStyles,
          preferred_colors: preferredColors,
          avoided_colors: avoidedColors,

          profile_photo_url: profilePath,
          avatar_photo_url: bodyPath,

          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) throw error;

      router.push("/profile");
      router.refresh();
    } catch (error: any) {
      console.error("Error saving profile:", error);

      setErrorMessage(
        error?.message ||
          error?.details ||
          error?.hint ||
          "We could not save your changes."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#F8F4EE] text-[#1F1F1F]">
        <div className="text-center">
          <div className="font-serif text-[28px] tracking-[0.08em]">
            I
            <span className="relative inline-flex">
              O
              <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-sans text-[8px]">
                ✦
              </span>
            </span>
            NA
          </div>

          <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-[#91887E]">
            Loading profile
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#F8F4EE] text-[#1F1F1F]">
      <div className="mx-auto w-full max-w-[430px] px-5 pb-[calc(70px+env(safe-area-inset-bottom))] pt-[max(24px,env(safe-area-inset-top))]">

        {/* HEADER */}

        <header className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#DED6CB] bg-[#FCF9F4]"
            aria-label="Back to profile"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M15 5L8 12L15 19"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          <div className="font-serif text-[23px] tracking-[0.08em]">
            I
            <span className="relative inline-flex">
              O
              <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-sans text-[7px]">
                ✦
              </span>
            </span>
            NA
          </div>

          <div className="h-10 w-10" />
        </header>

        {/* INTRO */}

        <div className="mt-9">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#91887E]">
            Your profile
          </p>

          <h1 className="mt-3 font-serif text-[38px]">
            Edit profile
          </h1>

          <p className="mt-2 text-[13px] leading-6 text-[#817970]">
            Keep your details up to date so IONA can style you more personally.
          </p>
        </div>

        {/* PHOTOS */}

        <section className="mt-9">
          <SectionTitle
            title="Photos"
            subtitle="Update the photos used across your IONA profile."
          />

          <div className="mt-5 flex items-start gap-7">
            <label className="cursor-pointer text-center">
              <div className="mx-auto h-[96px] w-[96px] overflow-hidden rounded-full border border-[#D8CEC0] bg-[#E8DED1]">
                {profilePreview ? (
                  <img
                    src={profilePreview}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[24px] text-[#817970]">
                    +
                  </div>
                )}
              </div>

              <p className="mt-2 text-[11px]">
                Profile photo
              </p>

              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePhoto}
                className="hidden"
              />
            </label>

            <label className="cursor-pointer text-center">
              <div className="mx-auto h-[120px] w-[84px] overflow-hidden rounded-[18px] border border-[#D8CEC0] bg-[#E8DED1]">
                {bodyPreview ? (
                  <img
                    src={bodyPreview}
                    alt="Full body"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[24px] text-[#817970]">
                    +
                  </div>
                )}
              </div>

              <p className="mt-2 text-[11px]">
                Full-body photo
              </p>

              <input
                type="file"
                accept="image/*"
                onChange={handleBodyPhoto}
                className="hidden"
              />
            </label>
          </div>
        </section>

        {/* PERSONAL DETAILS */}

        <section className="mt-10">
          <SectionTitle
            title="Personal details"
            subtitle="Your basic profile information."
          />

          <div className="mt-5 space-y-4">
            <InputField
              label="First name"
              value={firstName}
              onChange={setFirstName}
            />

            <InputField
              label="Last name"
              value={lastName}
              onChange={setLastName}
            />

            <div>
              <FieldLabel>Date of birth</FieldLabel>

              <input
                type="date"
                value={dateOfBirth}
                onChange={(event) =>
                  setDateOfBirth(event.target.value)
                }
                className="mt-2 w-full rounded-[18px] border border-[#D8CEC0] bg-[#FCF9F4] px-4 py-4 text-[14px] outline-none focus:border-[#A98D61]"
              />
            </div>

            <div>
              <FieldLabel>Gender</FieldLabel>

              <select
                value={gender}
                onChange={(event) =>
                  setGender(event.target.value)
                }
                className="mt-2 w-full rounded-[18px] border border-[#D8CEC0] bg-[#FCF9F4] px-4 py-4 text-[14px] outline-none focus:border-[#A98D61]"
              >
                <option value="">
                  Prefer not to say
                </option>

                <option value="Female">
                  Female
                </option>

                <option value="Male">
                  Male
                </option>

                <option value="Non-binary">
                  Non-binary
                </option>

                <option value="Other">
                  Other
                </option>
              </select>
            </div>
          </div>
        </section>

        {/* BODY */}

        <section className="mt-10">
          <SectionTitle
            title="Your body"
            subtitle="Measurements used for personalized styling."
          />

          <div className="mt-5 grid grid-cols-2 gap-3">
            <NumberField
              label="Height"
              unit="cm"
              value={height}
              onChange={setHeight}
            />

            <NumberField
              label="Weight"
              unit="kg"
              value={weight}
              onChange={setWeight}
            />

            <NumberField
              label="Bust / Chest"
              unit="cm"
              value={bust}
              onChange={setBust}
            />

            <NumberField
              label="Waist"
              unit="cm"
              value={waist}
              onChange={setWaist}
            />

            <NumberField
              label="Hips"
              unit="cm"
              value={hips}
              onChange={setHips}
            />

            <NumberField
              label="Inside leg"
              unit="cm"
              value={inseam}
              onChange={setInseam}
            />
          </div>
        </section>

        {/* STYLE */}

        <section className="mt-10">
          <SectionTitle
            title="Your style"
            subtitle="Tell IONA what feels most like you."
          />

          <div className="mt-5 rounded-[24px] border border-[#DED6CB] bg-[#FCF9F4] p-5">

            <ChoiceSection
              title="Styles you love"
              options={STYLE_OPTIONS}
              selected={selectedStyles}
              onToggle={(item) =>
                toggleItem(
                  item,
                  selectedStyles,
                  setSelectedStyles
                )
              }
            />

            <Divider />

            <ChoiceSection
              title="Colors you love"
              options={COLOR_OPTIONS}
              selected={preferredColors}
              onToggle={togglePreferredColor}
            />

            <Divider />

            <ChoiceSection
              title="Colors you avoid"
              options={COLOR_OPTIONS}
              selected={avoidedColors}
              onToggle={toggleAvoidedColor}
            />
          </div>
        </section>

        {/* ERROR */}

        {errorMessage && (
          <p className="mt-6 rounded-[18px] bg-[#F4E7E4] px-4 py-3 text-[13px] leading-5 text-[#A34D4D]">
            {errorMessage}
          </p>
        )}

        {/* SAVE */}

        <div className="mt-9">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-full bg-[#1F1F1F] px-6 py-4 text-[14px] font-medium text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/profile")}
            disabled={saving}
            className="mt-3 w-full py-3 text-[13px] text-[#817970] disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </main>
  );
}

/* COMPONENTS */

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <h2 className="font-serif text-[25px]">
        {title}
      </h2>

      <p className="mt-1 text-[12px] leading-5 text-[#8A827A]">
        {subtitle}
      </p>
    </div>
  );
}

function FieldLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <label className="text-[12px] text-[#817970]">
      {children}
    </label>
  );
}

function InputField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>

      <input
        type="text"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="mt-2 w-full rounded-[18px] border border-[#D8CEC0] bg-[#FCF9F4] px-4 py-4 text-[14px] outline-none focus:border-[#A98D61]"
      />
    </div>
  );
}

function NumberField({
  label,
  unit,
  value,
  onChange,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-[20px] border border-[#D8CEC0] bg-[#FCF9F4] p-4">
      <p className="text-[10px] uppercase tracking-[0.12em] text-[#91887E]">
        {label}
      </p>

      <div className="mt-3 flex items-center">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="min-w-0 flex-1 bg-transparent font-serif text-[22px] outline-none"
        />

        <span className="ml-2 text-[11px] text-[#91887E]">
          {unit}
        </span>
      </div>
    </div>
  );
}

function ChoiceSection({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (item: string) => void;
}) {
  return (
    <div>
      <p className="text-[12px] text-[#817970]">
        {title}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);

          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              className={`rounded-full border px-3 py-2 text-[11px] transition ${
                active
                  ? "border-[#1F1F1F] bg-[#1F1F1F] text-white"
                  : "border-[#D8CEC0] bg-[#F8F4EE] text-[#1F1F1F]"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Divider() {
  return <div className="my-6 h-px bg-[#E7E0D7]" />;
}