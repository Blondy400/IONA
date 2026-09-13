export default function HomePage() {
  return (
    <main className="min-h-[100dvh] bg-[#F7F2EA] text-[#1F1F1F]">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[430px] flex-col px-4 pb-24 pt-5">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[15px] text-[#77716A]">
              Good morning,
            </p>

            <h1 className="font-serif text-[30px] leading-tight">
              Ionela 👋
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button
              aria-label="Notifications"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#DED5C9] bg-[#FBF8F3]"
            >
              ♡
            </button>

            {/* Profile image */}
            <a
              href="/profile"
              aria-label="Profile"
              className="h-10 w-10 overflow-hidden rounded-full border border-[#D9CFC2] bg-[#E8DED1]"
            >
              <div className="flex h-full w-full items-center justify-center text-sm">
                I
              </div>
            </a>
          </div>
        </div>

        {/* SEARCH */}
        <div className="mt-5 flex items-center gap-2">
          <div className="flex h-12 flex-1 items-center rounded-full bg-[#EFE9E1] px-4">
            <span className="mr-3 text-lg">⌕</span>

            <input
              type="text"
              placeholder="Search your wardrobe..."
              className="w-full bg-transparent text-[14px] outline-none placeholder:text-[#9D968D]"
            />
          </div>

          <button
            aria-label="Search"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1F1F1F] text-white"
          >
            ⌕
          </button>
        </div>

        {/* CATEGORIES */}
        <div className="mt-5 grid grid-cols-5 gap-2">
          {[
            ["♙", "Outfits"],
            ["♧", "Clothes"],
            ["⌁", "Shoes"],
            ["▢", "Bags"],
            ["◫", "Accessories"],
          ].map(([icon, label]) => (
            <button
              key={label}
              className="flex flex-col items-center gap-2"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EFE9E1] text-[19px]">
                {icon}
              </div>

              <span className="text-[10px]">
                {label}
              </span>
            </button>
          ))}
        </div>

        {/* TODAY LOOK */}
        <section className="mt-6 rounded-[26px] bg-[#EDE3D6] p-5">
          <div className="grid grid-cols-[1fr_150px] gap-4">
            <div>
              <h2 className="font-serif text-[29px] leading-[0.95]">
                Your look
                <br />
                for today
              </h2>

              <p className="mt-4 text-[12px] text-[#6C665F]">
                Partly cloudy · 24°C
              </p>

              <p className="mt-1 text-[12px]">
                Casual Chic
              </p>

              <a
                href="/ai-stylist"
                className="mt-5 inline-flex items-center rounded-full bg-[#1F1F1F] px-5 py-3 text-[13px] font-medium text-white"
              >
                Style me
                <span className="ml-2 text-[#D6BE86]">✦</span>
              </a>
            </div>

            {/* Outfit preview */}
            <div className="relative flex min-h-[185px] items-center justify-center rounded-[20px] bg-[#F7F2EA]">
              <div className="text-center">
                <div className="text-[52px]">🧥</div>
                <div className="-mt-3 ml-12 text-[40px]">👖</div>
                <div className="-mt-2 mr-14 text-[34px]">👟</div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1F1F1F]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#BDB4A9]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#BDB4A9]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#BDB4A9]" />
          </div>
        </section>

        {/* RECENTLY ADDED */}
        <section className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-[22px]">
              Recently added
            </h2>

            <a
              href="/wardrobe"
              className="text-[12px] text-[#625D57]"
            >
              View all →
            </a>
          </div>

          <div className="mt-3 grid grid-cols-4 gap-3">
            {["Dress", "Jeans", "Blazer", "Bag"].map((item) => (
              <div
                key={item}
                className="aspect-[0.78] rounded-[18px] bg-[#ECE5DC] p-2"
              >
                <div className="flex h-full items-center justify-center rounded-[14px] bg-[#F9F6F1] text-[11px] text-[#8B847B]">
                  {item}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* BOTTOM NAVIGATION */}
      <nav
        className="
          fixed
          bottom-0
          left-1/2
          z-50
          flex
          w-full
          max-w-[430px]
          -translate-x-1/2
          items-end
          justify-between
          border-t
          border-[#E1D8CD]
          bg-[#FBF8F3]/95
          px-5
          pb-[max(10px,env(safe-area-inset-bottom))]
          pt-2
          backdrop-blur-md
        "
      >
        <a
          href="/home"
          className="flex w-14 flex-col items-center gap-1 text-[10px]"
        >
          <span className="text-[20px]">⌂</span>
          <span>Home</span>
        </a>

        <a
          href="/wardrobe"
          className="flex w-14 flex-col items-center gap-1 text-[10px] text-[#6E6861]"
        >
          <span className="text-[20px]">♧</span>
          <span>Wardrobe</span>
        </a>

        {/* CENTER AI BUTTON */}
        <a
          href="/ai-stylist"
          aria-label="AI Stylist"
          className="
            -mt-8
            flex
            h-14
            w-14
            items-center
            justify-center
            rounded-full
            border-[5px]
            border-[#FBF8F3]
            bg-[#1F1F1F]
            text-[22px]
            text-[#F6E5C3]
            shadow-lg
          "
        >
          ✦
        </a>

        <a
          href="/calendar"
          className="flex w-14 flex-col items-center gap-1 text-[10px] text-[#6E6861]"
        >
          <span className="text-[20px]">□</span>
          <span>Calendar</span>
        </a>

        <a
          href="/profile"
          className="flex w-14 flex-col items-center gap-1 text-[10px] text-[#6E6861]"
        >
          <span className="text-[20px]">♙</span>
          <span>Profile</span>
        </a>
      </nav>
    </main>
  );
}