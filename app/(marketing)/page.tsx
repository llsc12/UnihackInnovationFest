// Landing page (/). Marketing surface — uses the dark AutoReviver header from
// (marketing)/layout.tsx and the styles in (marketing)/landing.css.

import Link from "next/link";
import { CompatDemo } from "./compat-demo";

export default function LandingPage() {
  return (
    <main>
      <section className="hero">
        <div className="hero-bg-lines" aria-hidden />

        <div className="hero-content">
          <div className="hero-text">
            <p className="eyebrow">✦ AI-powered platform for used car parts</p>

            <h1>
              Smarter used<br />
              car part listings.<br />
              <span>Safer buying decisions.</span>
            </h1>

            <p className="hero-description">
              AutoReviver helps sellers create better listings and helps buyers
              check compatibility before purchase. More confidence. Less doubt.
              Better parts for change.
            </p>

            <div className="hero-actions">
              <Link href="/sell" className="primary-btn">
                I&apos;m a Seller <span>→</span>
              </Link>
              <Link href="/discover" className="secondary-btn">
                I&apos;m a Buyer <span>→</span>
              </Link>
            </div>

            <div className="hero-points">
              <div>
                <span className="point-icon">⚡</span>
                <p><strong>AI-Powered</strong><br />Smarter listings & matches</p>
              </div>
              <div>
                <span className="point-icon">💡</span>
                <p><strong>Trust You Can See</strong><br />Transparent trust scores</p>
              </div>
              <div>
                <span className="point-icon">♻</span>
                <p><strong>Sustainable Choice</strong><br />Reuse parts. Reduce waste.</p>
              </div>
            </div>
          </div>

          <CompatDemo />
        </div>
      </section>

      <section className="features" id="features">
        <article className="feature-card">
          <div className="feature-icon">
            <span style={{ fontSize: "1.9rem", lineHeight: 1 }}>✦</span>
          </div>
          <div>
            <h3>Smart Listing Generator</h3>
            <p>AI creates clean, accurate listings in seconds with optimised titles, descriptions, and fitment details.</p>
          </div>
        </article>

        <article className="feature-card">
          <div className="feature-icon">
            <span style={{ fontSize: "1.9rem", lineHeight: 1 }}>🔍</span>
          </div>
          <div>
            <h3>Compatibility Checker</h3>
            <p>Buyers enter their vehicle and instantly verify fitment with high confidence.</p>
          </div>
        </article>

        <article className="feature-card" id="trust">
          <div className="feature-icon">
            <span style={{ fontSize: "1.9rem", lineHeight: 1 }}>★</span>
          </div>
          <div>
            <h3>Trust Score</h3>
            <p>Every listing gets a transparent score based on seller history, part quality, and feedback.</p>
          </div>
        </article>

        <article className="feature-card">
          <div className="feature-icon">
            <span style={{ fontSize: "1.9rem", lineHeight: 1 }}>⌕</span>
          </div>
          <div>
            <h3>Search &amp; Discovery</h3>
            <p>Find the right part faster with smart filters, AI search, and vehicle-based results.</p>
          </div>
        </article>
      </section>

      <section className="how-section" id="how">
        <div className="section-heading">
          <p className="eyebrow">✦ How it works</p>
          <h2>From messy listing to trusted match.</h2>
        </div>

        <div className="steps">
          <div className="step">
            <span>01</span>
            <h3>Seller uploads part</h3>
            <p>The seller adds a photo, part number, condition and basic information.</p>
          </div>
          <div className="step">
            <span>02</span>
            <h3>AI improves the listing</h3>
            <p>AutoReviver generates a clearer title, description, specs and compatibility data.</p>
          </div>
          <div className="step">
            <span>03</span>
            <h3>Buyer checks fitment</h3>
            <p>The buyer selects their vehicle and sees whether the part is a confirmed match.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
