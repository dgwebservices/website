type ResponsiveImageProps = {
  name: "hero-digital-studio" | "sports-platforms" | "connected-business";
  alt: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
};

export function ResponsiveImage({ name, alt, priority = false, sizes = "(max-width: 980px) calc(100vw - 32px), 640px", className }: ResponsiveImageProps) {
  const variants = [640, 960, 1584];
  return (
    <picture className={className}>
      <source type="image/avif" srcSet={variants.map((width) => `/assets/optimized/${name}-${width}.avif ${width}w`).join(", ")} sizes={sizes} />
      <source type="image/webp" srcSet={variants.map((width) => `/assets/optimized/${name}-${width}.webp ${width}w`).join(", ")} sizes={sizes} />
      <img
        src={`/assets/${name}.png`}
        width="1584"
        height="990"
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding={priority ? "sync" : "async"}
      />
    </picture>
  );
}
