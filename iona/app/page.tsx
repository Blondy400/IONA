export default function Home() {
  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#171411]">

      {/* BACKGROUND IMAGE */}
      <img
        src="/iona-welcome.png"
        alt="IONA fashion welcome"
        className="
          absolute inset-0
          h-full w-full
          object-cover
          object-center
        "
      />

      {/* SOFT OVERLAY */}
      <div className="absolute inset-0 bg-black/10" />

      {/* BOTTOM GRADIENT */}
      <div
        className="
          absolute inset-x-0 bottom-0
          h-[38%]
          bg-gradient-to-t
          from-black/45
          via-black/10
          to-transparent
        "
      />

      {/* IONA + TAGLINE */}
      <div
        className="
          absolute
          left-1/2
          top-[55%]
          z-10
          w-full
          max-w-[540px]
          -translate-x-1/2
          px-5
          text-center
        "
      >
        {/* IONA LOGO */}
        <div
          className="
            flex
            items-center
            justify-center
            font-serif
            text-[64px]
            leading-none
            tracking-[0.055em]
            text-[#FFF9F3]
            drop-shadow-sm
          "
        >
          <span>I</span>

          {/* O WITH STAR */}
          <span className="relative inline-flex">
            <span>O</span>

            <span
              className="
                pointer-events-none
                absolute
                left-1/2
                top-1/2
                -translate-x-1/2
                -translate-y-1/2
                font-sans
                text-[14px]
              "
            >
              ✦
            </span>
          </span>

          <span>NA</span>
        </div>

        {/* TAGLINE */}
        <div
          className="
            mt-5
            space-y-1.5
            text-[10px]
            uppercase
            tracking-[0.36em]
            text-[#FFF9F3]/95
          "
        >
          <p>Your wardrobe.</p>
          <p>Your style.</p>
          <p>A more confident you.</p>
        </div>
      </div>

      {/* BOTTOM ACTIONS */}
      <div
        className="
          absolute
          inset-x-0
          bottom-0
          z-10
          px-5
          pb-[max(28px,env(safe-area-inset-bottom))]
        "
      >
        <div className="mx-auto w-full max-w-[540px]">

          {/* GET STARTED */}
          <a
            href="/login"
            className="
              flex
              w-full
              items-center
              justify-center
              rounded-full
              bg-[#F8F1E8]
              px-7
              py-[17px]
              text-[16px]
              font-medium
              tracking-wide
              text-[#1F1F1F]
              shadow-[0_12px_35px_rgba(0,0,0,0.20)]
              transition-all
              duration-300
              active:scale-[0.98]
            "
          >
            <span>Get Started</span>

            <span className="ml-5 text-xl font-light">
              →
            </span>
          </a>

          {/* SIGN IN */}
          <p className="mt-5 text-center text-[14px] text-white/90">
            Already have an account?{" "}
            <a
              href="/login"
              className="
                font-medium
                text-white
                underline
                decoration-white/40
                underline-offset-4
              "
            >
              Sign in
            </a>
          </p>

        </div>
      </div>

    </main>
  );
}