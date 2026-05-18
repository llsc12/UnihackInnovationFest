"use client";

// The in-page compatibility demo from the hero. Faked with hardcoded vehicle rules
// — the real checker lives at /listings/[id] (Stream 2). This is for the pitch.

import { useState } from "react";

type Rule = { model: string; years: string[]; confidence: string };

const RULES: Record<string, Rule> = {
  Nissan:  { model: "Rogue",     years: ["2018", "2019"], confidence: "96%" },
  Ford:    { model: "Fiesta",    years: ["2018"],         confidence: "78%" },
  BMW:     { model: "3 Series",  years: ["2021"],         confidence: "64%" },
  Toyota:  { model: "Corolla",   years: ["2019"],         confidence: "71%" },
};

const TABS = ["Compatibility Check", "Part Details", "Seller Info"] as const;

export function CompatDemo() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Compatibility Check");
  const [make, setMake] = useState("Nissan");
  const [model, setModel] = useState("Rogue");
  const [year, setYear] = useState("2019");
  const [trim, setTrim] = useState("SV");

  const rule = RULES[make];
  const yearMatches = rule && rule.years.includes(year);
  const modelMatches = rule && model === rule.model;

  let verdict: "ok" | "warn" | "bad";
  let title: string;
  let text: string;
  let confidence: string;

  if (modelMatches && yearMatches) {
    verdict = "ok";
    title = "Compatible";
    text = "This part is a confirmed fit for your vehicle.";
    confidence = rule.confidence;
  } else if (modelMatches) {
    verdict = "warn";
    title = "Check Required";
    text = "The model matches, but the year needs seller confirmation.";
    confidence = "62%";
  } else {
    verdict = "bad";
    title = "Not Compatible";
    text = "This part is unlikely to fit your selected vehicle.";
    confidence = "24%";
  }

  const rowClass =
    verdict === "warn" ? "result-row warning-result" : verdict === "bad" ? "result-row bad-result" : "result-row";

  return (
    <div className="hero-demo-card" id="demo">
      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            className={`tab ${t === activeTab ? "active" : ""}`}
            onClick={() => setActiveTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="part-summary">
        <div className="part-image" aria-hidden />
        <div className="part-info">
          <h2>LED Headlight — Left Side</h2>
          <p>OEM Part: 26060-4BA0A</p>
          <p>Condition: Used — Like New</p>
          <p>Fits: Nissan Rogue 2017–2020</p>
        </div>
        <div className="trust-card">
          <p>Trust Score</p>
          <div className="shield">87</div>
          <strong>High Trust</strong>
          <span>Based on seller history, part quality &amp; feedback</span>
        </div>
      </div>

      <div className="compatibility-box">
        <h3>Check compatibility with your vehicle</h3>

        <div className="form-grid">
          <label>
            Make
            <select value={make} onChange={(e) => setMake(e.target.value)}>
              <option>Nissan</option>
              <option>Ford</option>
              <option>BMW</option>
              <option>Toyota</option>
            </select>
          </label>

          <label>
            Model
            <select value={model} onChange={(e) => setModel(e.target.value)}>
              <option>Rogue</option>
              <option>Fiesta</option>
              <option>3 Series</option>
              <option>Corolla</option>
            </select>
          </label>

          <label>
            Year
            <select value={year} onChange={(e) => setYear(e.target.value)}>
              <option>2019</option>
              <option>2018</option>
              <option>2021</option>
              <option>2015</option>
            </select>
          </label>

          <label>
            Trim
            <select value={trim} onChange={(e) => setTrim(e.target.value)}>
              <option>SV</option>
              <option>SE</option>
              <option>M Sport</option>
              <option>Hybrid</option>
            </select>
          </label>
        </div>

        <div className={rowClass}>
          <div className="result-left">
            <div className="check-icon">✓</div>
            <div>
              <h4>{title}</h4>
              <p>{text}</p>
            </div>
          </div>

          <div className="confidence">
            <p>Confidence</p>
            <strong>{confidence}</strong>
          </div>
        </div>
      </div>

      <div className="why-box">
        <div>
          <h3>Why it fits</h3>
          <ul>
            <li>Matches OEM part number</li>
            <li>Fits your selected year, model &amp; trim</li>
            <li>Placement: Front Left Driver Side</li>
            <li>Same connector &amp; mounting points</li>
          </ul>
        </div>
        <div className="car-outline">🚗</div>
      </div>
    </div>
  );
}
