"use client";

type ProfileNameAvatarProps = {
  name?: string | null;
  image?: string | null;
  alt?: string;
  className?: string;
  textClassName?: string;
};

export default function ProfileNameAvatar({
  name,
  image,
  alt = "프로필 이미지",
  className = "h-12 w-12",
  textClassName = "text-xs",
}: ProfileNameAvatarProps) {
  const displayName = name?.trim() || "사용자";
  const fallbackInitial = Array.from(displayName)[0] ?? "사";

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#eef9f2] text-center font-black leading-tight text-[#2E7D5B] ${className}`}
    >
      {image ? (
        <img src={image} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <span className={textClassName}>
          {fallbackInitial}
        </span>
      )}
    </div>
  );
}
