"use client";

import { useCluster } from "@/components/solana-cluster-provider";

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
  const cluster = useCluster();
  console.log(cluster);
  let href = cluster.getExplorerUrl(path);
  if (explorer == "solana.fm") {
    href = href
      .replace("explorer.solana.com", "solana.fm")
      .replace("cluster=devnet", "cluster=devnet-alpha");
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className ? className : `link font-mono`}
    >
      {ellipsify(label)}
    </a>
  );
}
