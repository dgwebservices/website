type BrandLogoProps = {
  kind: "combined" | "icon";
  surface: "light" | "dark";
  priority?: boolean;
  decorative?: boolean;
  className?: string;
};

const logoFiles = {
  "combined-light": "/brand/DG-Webservices-Combined-Light-Mode-8192-1.svg",
  "combined-dark": "/brand/DG-Webservices-Combined-Dark-Mode-8192.svg",
  "icon-light": "/brand/DG-Webservices-Icon-Light-Mode-8192.svg",
  "icon-dark": "/brand/DG-Webservices-Icon-Dark-Mode-8192.svg",
} as const;

export function BrandLogo({ kind, surface, priority = false, decorative = false, className }: BrandLogoProps) {
  const combined = kind === "combined";
  return (
    // De officiële SVG-masters moeten rechtstreeks worden geladen en niet door een beeldproxy worden aangepast.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoFiles[`${kind}-${surface}`]}
      width={combined ? 2191 : surface === "light" ? 1095 : 3000}
      height={combined ? 548 : surface === "light" ? 1095 : 3000}
      alt={decorative ? "" : "DG Webservices"}
      aria-hidden={decorative || undefined}
      className={className}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
    />
  );
}
