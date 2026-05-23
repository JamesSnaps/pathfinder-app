interface ChildAvatarProps {
  name: string;
  avatarUrl: string | null | undefined;
  size?: "xs" | "sm" | "md" | "lg";
}

const sizes = {
  xs: { container: "h-6 w-6", text: "text-xs" },
  sm: { container: "h-10 w-10", text: "text-base" },
  md: { container: "h-14 w-14", text: "text-xl" },
  lg: { container: "h-20 w-20", text: "text-3xl" },
};

export function ChildAvatar({ name, avatarUrl, size = "sm" }: ChildAvatarProps) {
  const { container, text } = sizes[size];

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        className={`${container} rounded-full object-cover shrink-0`}
      />
    );
  }

  return (
    <div className={`${container} rounded-full bg-primary/10 flex items-center justify-center shrink-0`}>
      <span className={`${text} font-bold text-primary`}>{name[0]}</span>
    </div>
  );
}
