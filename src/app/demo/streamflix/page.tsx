"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/recur-ds/Nav";
import { CheckoutFlow } from "@/components/streamflix/CheckoutFlow";

export default function StreamflixPage() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <div style={{ fontFamily: "var(--f-ui)", color: "#1A1410", background: "#0F0908" }}>
      <TopBar />

      <section
        style={{
          background: "#1A0F0F",
          color: "#F4ECDA",
          position: "relative",
          overflow: "hidden",
          minHeight: 780,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "22px 56px",
          }}
        >
          <div
            style={{
              fontFamily: "var(--f-display)",
              fontWeight: 400,
              fontStyle: "italic",
              color: "#C44A3F",
              fontSize: 30,
              letterSpacing: "-.02em",
            }}
          >
            streamflix.
          </div>
          <span
            className="chip"
            style={{ background: "rgba(244,236,218,.95)", color: "#1A1410", padding: "7px 13px" }}
          >
            <span className="wordmark" style={{ fontSize: 13 }}>
              Recur
            </span>
            <span style={{ fontSize: 11, color: "var(--text-2)" }}>· powered by</span>
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr",
            gap: 56,
            padding: "40px 56px 64px",
            alignItems: "center",
            maxWidth: 1440,
            margin: "0 auto",
          }}
        >
          <div>
            <span
              className="chip"
              style={{
                background: "rgba(196,74,63,.18)",
                color: "#E8A89B",
                padding: "7px 14px",
                fontSize: 12,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                border: "1px solid rgba(196,74,63,.25)",
              }}
            >
              Mock product · for hackathon demo
            </span>
            <h1
              className="t-display"
              style={{
                fontSize: 80,
                lineHeight: 0.95,
                letterSpacing: "-.03em",
                margin: "18px 0 16px",
                color: "#F4ECDA",
              }}
            >
              Stories worth
              <br />
              <span className="t-display-it" style={{ color: "#E8A89B" }}>
                staying in for.
              </span>
            </h1>
            <p style={{ fontSize: 18, color: "rgba(244,236,218,.7)", lineHeight: 1.55, maxWidth: 480 }}>
              Award-winning films, prestige series, weekly originals — all for 10 USDC a month,
              settled gaslessly from your wallet. No credit card. No auto-charge surprises.
            </p>
            <div style={{ display: "flex", gap: 14, marginTop: 28, alignItems: "center", flexWrap: "wrap" }}>
              <button
                onClick={() => setOpen(true)}
                className="btn btn-lg"
                style={{ background: "#C44A3F", color: "#F4ECDA", fontWeight: 600 }}
              >
                Start subscribing →
              </button>
              <span style={{ fontSize: 13, color: "rgba(244,236,218,.55)" }}>
                Cancel any month · one click
              </span>
            </div>
          </div>

          <div
            style={{
              background: "#FAF7F2",
              color: "#1A1410",
              borderRadius: 28,
              padding: 28,
              boxShadow: "0 24px 56px rgba(0,0,0,.4)",
              position: "relative",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <span
                  className="t-mono"
                  style={{ fontSize: 11, color: "var(--text-3)", letterSpacing: ".12em", textTransform: "uppercase" }}
                >
                  Premium plan
                </span>
                <div className="t-display" style={{ fontSize: 40, margin: "6px 0", lineHeight: 1 }}>
                  10 USDC <span style={{ color: "var(--text-3)", fontSize: 18 }}>/ month</span>
                </div>
              </div>
              <span className="chip" style={{ background: "#1A0F0F", color: "#E8A89B", fontSize: 11 }}>
                4K · HDR
              </span>
            </div>
            <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
              {[
                "4 simultaneous screens",
                "Watch on any device",
                "Cancel any month",
                "Powered by The Compact resource lock",
              ].map((t) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 999,
                      background: "var(--sage)",
                      color: "#1f2c1c",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    ✓
                  </span>
                  {t}
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: 18,
                padding: 14,
                background: "var(--surface-1)",
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ fontSize: 12, color: "var(--text-2)" }}>You&apos;ll pre-sign</div>
                <div style={{ fontWeight: 600 }}>4 monthly intents (demo)</div>
              </div>
              <span className="chip chip-mono" style={{ background: "var(--bg)" }}>
                40 USDC total
              </span>
            </div>
            <button
              onClick={() => setOpen(true)}
              className="btn btn-lg"
              style={{
                background: "#C44A3F",
                color: "#F4ECDA",
                width: "100%",
                justifyContent: "center",
                marginTop: 16,
                fontWeight: 600,
              }}
            >
              Subscribe with Recur →
            </button>
          </div>
        </div>

        <PosterRail />
      </section>

      {open ? (
        <CheckoutFlow
          onCancel={() => setOpen(false)}
          onDone={() => {
            setOpen(false);
            router.push("/app");
          }}
        />
      ) : null}
    </div>
  );
}

const POSTERS: Array<{ title: string; tag: string; src: string; tint: string }> = [
  {
    title: "Dune: Part Two",
    tag: "Sci-Fi · 2024",
    src: "https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
    tint: "#3a1a18",
  },
  {
    title: "Oppenheimer",
    tag: "Drama · 2023",
    src: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    tint: "#4a221c",
  },
  {
    title: "The Last of Us",
    tag: "Series · HBO",
    src: "https://image.tmdb.org/t/p/w500/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg",
    tint: "#5a2a22",
  },
  {
    title: "Severance",
    tag: "Series · Apple",
    src: "https://image.tmdb.org/t/p/w500/lFf6LLrQjYldcZItzOkGmMMigP7.jpg",
    tint: "#3e1f1a",
  },
  {
    title: "Stranger Things",
    tag: "Series · Netflix",
    src: "https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
    tint: "#4a2a22",
  },
  {
    title: "The Bear",
    tag: "Series · FX",
    src: "https://resizing.flixster.com/ythiNysJjlwp5CeMPdjAyK3cWoo=/ems.cHJkLWVtcy1hc3NldHMvdHZzZXJpZXMvZTYzNmVmMjQtZjNmZi00YmYxLTllMGQtYWU3Mjc2MDEwNzMxLmpwZw==",
    tint: "#3a2018",
  },
];

function PosterRail() {
  return (
    <div style={{ padding: "0 56px 48px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div style={{ color: "rgba(244,236,218,.85)", fontSize: 15, fontWeight: 600 }}>
          Trending this week
        </div>
        <span
          style={{
            color: "rgba(244,236,218,.5)",
            fontSize: 12,
            fontFamily: "var(--f-mono)",
            letterSpacing: ".1em",
            textTransform: "uppercase",
          }}
        >
          tmdb · public
        </span>
      </div>
      <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 4 }}>
        {POSTERS.map((p) => (
          <PosterCard key={p.title} poster={p} />
        ))}
      </div>
    </div>
  );
}

function PosterCard({
  poster,
}: {
  poster: { title: string; tag: string; src: string; tint: string };
}) {
  return (
    <div
      style={{
        flex: "0 0 240px",
        position: "relative",
        aspectRatio: "2/3",
        borderRadius: 14,
        overflow: "hidden",
        background: `linear-gradient(160deg, ${poster.tint}, #1A0F0F)`,
        border: "1px solid rgba(244,236,218,.06)",
        boxShadow: "0 12px 28px rgba(0,0,0,.35)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={poster.src}
        alt={poster.title}
        loading="lazy"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
        onError={(e) => {
          (e.target as HTMLImageElement).style.opacity = "0";
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, transparent 55%, rgba(15,9,8,.85) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 14,
          right: 14,
          bottom: 12,
          color: "#F4ECDA",
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.2 }}>{poster.title}</div>
        <div
          style={{
            fontSize: 11,
            color: "rgba(244,236,218,.65)",
            marginTop: 2,
            fontFamily: "var(--f-mono)",
            letterSpacing: ".06em",
            textTransform: "uppercase",
          }}
        >
          {poster.tag}
        </div>
      </div>
    </div>
  );
}
