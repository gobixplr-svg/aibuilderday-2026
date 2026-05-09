// Dark navy gradient background that sits BEHIND the tablet in establishing/pull-out shots.
// Includes a subtle dot grid pattern.

export const BackgroundFrame: React.FC = () => {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(ellipse at center, #11264a 0%, #0D1F3C 60%, #050d1c 100%)",
        overflow: "hidden",
      }}
    >
      {/* Dot grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle, rgba(132,170,224,0.10) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 0.6,
        }}
      />
    </div>
  );
};
