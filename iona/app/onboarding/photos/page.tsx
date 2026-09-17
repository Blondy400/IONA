"use client";

import { ChangeEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../utils/supabase/client";

export default function PhotosOnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [bodyPhoto, setBodyPhoto] = useState<File | null>(null);

  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [bodyPreview, setBodyPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function validateImage(file: File) {
    if (!file.type.startsWith("image/")) {
      return "Please choose an image file.";
    }

    const maxSize = 10 * 1024 * 1024;

    if (file.size > maxSize) {
      return "Image must be smaller than 10 MB.";
    }

    return null;
  }

  function handleProfilePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const validationError = validateImage(file);

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setErrorMessage("");
    setProfilePhoto(file);

    if (profilePreview) {
      URL.revokeObjectURL(profilePreview);
    }

    setProfilePreview(URL.createObjectURL(file));
  }

  function handleBodyPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const validationError = validateImage(file);

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setErrorMessage("");
    setBodyPhoto(file);

    if (bodyPreview) {
      URL.revokeObjectURL(bodyPreview);
    }

    setBodyPreview(URL.createObjectURL(file));
  }

  function getFileExtension(file: File) {
    const nameParts = file.name.split(".");

    if (nameParts.length > 1) {
      return nameParts[nameParts.length - 1].toLowerCase();
    }

    if (file.type === "image/png") return "png";
    if (file.type === "image/heic") return "heic";
    if (file.type === "image/heif") return "heif";

    return "jpg";
  }

  async function uploadPhoto(
    userId: string,
    file: File,
    photoType: "profile" | "body"
  ) {
    const extension = getFileExtension(file);

    const filePath = `${userId}/${photoType}.${extension}`;

    const { error } = await supabase.storage
      .from("profile-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type || undefined,
      });

    if (error) {
      throw error;
    }

    return filePath;
  }

  async function handleFinish() {
    setLoading(true);
    setErrorMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error(
          "We could not find your account. Please sign in again."
        );
      }

      let profilePhotoPath: string | null = null;
      let bodyPhotoPath: string | null = null;

      /*
       * UPLOAD PROFILE PHOTO
       */
      if (profilePhoto) {
        profilePhotoPath = await uploadPhoto(
          user.id,
          profilePhoto,
          "profile"
        );
      }

      /*
       * UPLOAD FULL-BODY PHOTO
       */
      if (bodyPhoto) {
        bodyPhotoPath = await uploadPhoto(
          user.id,
          bodyPhoto,
          "body"
        );
      }

      /*
       * BUILD PROFILE UPDATE
       *
       * We only overwrite photo fields if
       * the user actually selected a new photo.
       */
      const profileUpdate: Record<string, unknown> = {
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      };

      if (profilePhotoPath) {
        profileUpdate.profile_photo_url = profilePhotoPath;
      }

      if (bodyPhotoPath) {
        profileUpdate.avatar_photo_url = bodyPhotoPath;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileUpdate)
        .eq("id", user.id);

      if (profileError) {
        throw profileError;
      }

      router.push("/home");
    } catch (error: any) {
      console.error("Error finishing onboarding:", error);

      setErrorMessage(
        error?.message ||
          error?.details ||
          error?.hint ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[100dvh] bg-[#F8F4EE] text-[#1F1F1F]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col px-6 pb-8 pt-[max(24px,env(safe-area-inset-top))]">

        {/* LOGO */}
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

        {/* CONTENT */}
        <div className="mt-12">

          <p className="text-[12px] uppercase tracking-[0.22em] text-[#91887E]">
            Step 4 of 4
          </p>

          <h1 className="mt-4 font-serif text-[40px] leading-[1.05]">
            Make it yours
          </h1>

          <p className="mt-3 max-w-[340px] text-[14px] leading-6 text-[#756E67]">
            Add your photos so IONA can personalize your profile and,
            later, your virtual styling experience.
          </p>

          {/* PROFILE PHOTO */}
          <div className="mt-10">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="font-serif text-[21px]">
                  Profile photo
                </h2>

                <p className="mt-1 text-[12px] text-[#8A827A]">
                  Used on your profile and home screen.
                </p>
              </div>

              <span className="text-[11px] text-[#91887E]">
                Optional
              </span>

            </div>

            <label className="mt-4 flex cursor-pointer items-center gap-4 rounded-[22px] border border-[#DDD5CA] bg-[#FCF9F4] p-4">

              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E8DED1]">

                {profilePreview ? (
                  <img
                    src={profilePreview}
                    alt="Profile preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <svg
                    width="30"
                    height="30"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="8"
                      r="3.2"
                      stroke="#6F675F"
                      strokeWidth="1.5"
                    />

                    <path
                      d="M5.5 19C6.4 15.8 8.6 14 12 14C15.4 14 17.6 15.8 18.5 19"
                      stroke="#6F675F"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                )}

              </div>

              <div className="min-w-0 flex-1">

                <p className="truncate text-[14px] font-medium">
                  {profilePhoto
                    ? profilePhoto.name
                    : "Choose a profile photo"}
                </p>

                <p className="mt-1 text-[12px] text-[#91887E]">
                  JPG, PNG or HEIC
                </p>

              </div>

              <span className="text-[20px] text-[#7C746D]">
                +
              </span>

              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePhoto}
                className="hidden"
              />

            </label>
          </div>

          {/* FULL BODY PHOTO */}
          <div className="mt-8">

            <div className="flex items-center justify-between">

              <div>
                <h2 className="font-serif text-[21px]">
                  Full-body photo
                </h2>

                <p className="mt-1 max-w-[280px] text-[12px] leading-5 text-[#8A827A]">
                  Helps prepare your future IONA avatar and virtual try-on.
                </p>
              </div>

              <span className="text-[11px] text-[#91887E]">
                Optional
              </span>

            </div>

            <label className="mt-4 flex cursor-pointer items-center gap-4 rounded-[22px] border border-[#DDD5CA] bg-[#FCF9F4] p-4">

              <div className="flex h-28 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[16px] bg-[#E8DED1]">

                {bodyPreview ? (
                  <img
                    src={bodyPreview}
                    alt="Body preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <svg
                    width="34"
                    height="50"
                    viewBox="0 0 34 50"
                    fill="none"
                  >
                    <circle
                      cx="17"
                      cy="7"
                      r="5"
                      stroke="#6F675F"
                      strokeWidth="1.5"
                    />

                    <path
                      d="M17 12V29"
                      stroke="#6F675F"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />

                    <path
                      d="M9 20L17 15L25 20"
                      stroke="#6F675F"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />

                    <path
                      d="M17 29L10 44"
                      stroke="#6F675F"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />

                    <path
                      d="M17 29L24 44"
                      stroke="#6F675F"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                )}

              </div>

              <div className="min-w-0 flex-1">

                <p className="truncate text-[14px] font-medium">
                  {bodyPhoto
                    ? bodyPhoto.name
                    : "Choose a full-body photo"}
                </p>

                <p className="mt-1 text-[12px] leading-5 text-[#91887E]">
                  Front-facing, full body, good lighting.
                </p>

              </div>

              <span className="text-[20px] text-[#7C746D]">
                +
              </span>

              <input
                type="file"
                accept="image/*"
                onChange={handleBodyPhoto}
                className="hidden"
              />

            </label>
          </div>

          {/* PRIVACY NOTE */}
          <div className="mt-7 rounded-[20px] bg-[#EFE8DF] px-4 py-4">

            <div className="flex gap-3">

              <span className="text-[#A98D61]">
                ✦
              </span>

              <p className="text-[12px] leading-5 text-[#726A63]">
                Photos are optional. You can add or change them later
                from your profile.
              </p>

            </div>

          </div>

          {/* ERROR */}
          {errorMessage && (
            <p className="mt-5 text-[13px] leading-5 text-[#A34D4D]">
              {errorMessage}
            </p>
          )}

          {/* FINISH */}
          <div className="mt-9">

            <button
              type="button"
              onClick={handleFinish}
              disabled={loading}
              className="flex w-full items-center justify-center rounded-full bg-[#1F1F1F] px-6 py-4 text-[15px] font-medium text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                "Finishing..."
              ) : (
                <>
                  Enter IONA

                  <span className="ml-3 text-[#D8C3A5]">
                    ✦
                  </span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleFinish}
              disabled={loading}
              className="mt-3 w-full py-3 text-[13px] text-[#807870] disabled:opacity-50"
            >
              Skip photos for now
            </button>

          </div>

        </div>

      </div>
    </main>
  );
}