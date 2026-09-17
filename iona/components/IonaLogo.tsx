import Link from "next/link";

type IonaLogoProps = {
  href?: string;
  className?: string;
};

export default function IonaLogo({
  href = "/home",
  className = "",
}: IonaLogoProps) {
  const logo = (
    <span
      className={`
        inline-flex
        items-center
        font-serif
        text-[30px]
        leading-none
        tracking-[0.08em]
        text-[#1F1F1F]
        ${className}
      `}
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
            text-[8px]
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

  return (
    <Link href={href} aria-label="IONA Home">
      {logo}
    </Link>
  );
}