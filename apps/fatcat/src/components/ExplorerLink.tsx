"use client";

export function ellipsify(str = "", len = 4) {
  if (str.length > 30) {
    return (
      str.substring(0, len) + ".." + str.substring(str.length - len, str.length)
    );
  }
  return str;
}

export function ExplorerLink({
  path,
  label,
  className,
  explorer,
}: {
  path: string;
  label: string;
  className?: string;
  explorer?: string;
}) {
  let href = `https://solscan.io/${path}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        e.stopPropagation();
      }}
      className={className ? className : `link font-mono`}
    >
      {ellipsify(label)}
    </a>
  );
}
