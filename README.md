# AutoReviver

AutoReviver is an AI-powered used car parts platform designed to help sellers create better listings and help buyers check whether a part is compatible with their vehicle before purchasing.

The project was created for a 24-hour hackathon challenge focused on improving the used car parts marketplace.

---

## Contents

- [Project Overview](#project-overview)
- [Problem](#problem)
- [Solution](#solution)
- [Key Features](#key-features)
- [Demo Flow](#demo-flow)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [How to Use](#how-to-use)
- [Project Structure](#project-structure)
- [Synthetic Data Notice](#synthetic-data-notice)
- [Compatibility Logic](#compatibility-logic)
- [Trust Score Logic](#trust-score-logic)
- [Team Contributions](#team-contributions)
- [Screenshots](#screenshots)
- [Future Improvements](#future-improvements)

---

## Project Overview

The used car parts market can be difficult for both buyers and sellers.

Sellers often have useful parts available but may struggle to create clear, searchable, trustworthy listings. Buyers often struggle to know whether a part will actually fit their vehicle.

AutoReviver aims to solve this by providing a simple web application that supports:

- Smart listing generation
- Vehicle compatibility checking
- Trust scoring
- Search and discovery

The goal is to reduce wrong purchases, improve listing quality, and make second-hand car parts easier to reuse.

---

## Problem

Buying used car parts online is often confusing because listings can be incomplete, badly written, or missing important details.

Common issues include:

- Missing part numbers
- Unclear vehicle compatibility
- Poor descriptions
- Lack of seller trust signals
- No clear return policy
- Difficult search experience
- Risk of buying the wrong part

This causes wasted time, wasted money, and unnecessary frustration for buyers and sellers.

---

## Solution

AutoReviver provides an intelligent layer for the used car parts market.

Instead of simply listing parts, the platform helps structure the information properly.

A seller can enter basic details about a part, and AutoReviver generates a cleaner listing.

A buyer can enter their car details and check whether the selected part is compatible.

Each listing also receives a trust score to show how reliable or complete it appears.

---

## Key Features

### Smart Listing Generator

The seller enters simple information such as:

- Part type
- Vehicle make
- Vehicle model
- Year range
- Condition
- Part number
- Seller information

AutoReviver then generates a professional listing including:

- Title
- Description
- Condition notes
- Compatibility summary
- Suggested keywords

Example output:

```txt
Genuine Volkswagen Golf Mk7 Left Headlight 2013-2017

Used genuine VW Golf Mk7 left headlight assembly in good working condition.
Suitable for compatible Golf Mk7 models between 2013 and 2017.
Minor cosmetic scratches present but does not affect function.
Please confirm part number before purchase.