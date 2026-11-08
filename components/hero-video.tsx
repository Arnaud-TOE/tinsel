import Image from 'next/image';

// The product at work, as a short silent loop recorded from the real app with the real model.
// People who prefer less motion see its last frame instead.
export function HeroVideo() {
  return (
    <>
      <video
        className="hero-video block w-full"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/hero-poster.jpg"
        width={1440}
        height={810}
        aria-label="Tinsel at work: it draws the names, searches real stores for gifts that fit each person and buys them inside the budgets PayPal holds"
      >
        <source src="/hero.mp4" type="video/mp4" />
      </video>
      <Image className="hero-still hidden w-full" src="/hero-poster.jpg" width={1440} height={810} alt="Tinsel at work: it draws the names, searches real stores for gifts that fit each person and buys them inside the budgets PayPal holds" />
    </>
  );
}
