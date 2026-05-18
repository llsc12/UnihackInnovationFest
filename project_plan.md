# AutoReviver

## Short Description

AutoReviver is an AI-powered platform that helps sellers create better used car part listings and helps buyers check whether a part is compatible with their vehicle before purchasing.

## Project Overview

The used car parts market is often fragmented, confusing, and risky for buyers. Many listings on marketplaces are incomplete, poorly written, or missing key compatibility information such as vehicle model, year range, part number, condition, or seller trust signals.

This can lead to buyers purchasing the wrong part, wasting time and money, while sellers lose potential customers because their listings are unclear or hard to find.

AutoReviver aims to solve this by acting as an intelligent layer between sellers and buyers. Sellers can enter basic information about a used car part and receive a professional, structured listing. Buyers can search for parts and check compatibility against their vehicle details. The platform also includes a trust score system to highlight reliable listings and warn users when important information is missing.

## Problem

Buying used car parts online can be frustrating because:

- Listings are often incomplete or badly formatted.
- Buyers may not know whether a part will fit their vehicle.
- Sellers may not know how to write clear, searchable listings.
- Marketplaces such as eBay or Facebook Marketplace rely heavily on manual searching.
- Trust is limited because many listings lack part numbers, images, condition details, or seller verification.

This creates a messy buying experience where users may have to message multiple sellers, compare vague descriptions, and still risk buying the wrong item.

## Our Solution

AutoReviver provides a guided workflow for both sellers and buyers.

For sellers, the platform helps generate high-quality listings from simple input such as part type, vehicle make, model, year, condition, and part number.

For buyers, the platform provides a compatibility checker that compares their vehicle details against a selected part. The result gives a clear answer: compatible, maybe compatible, or not compatible, along with a confidence score and explanation.

The platform also calculates a trust score for each listing based on factors such as whether a part number is included, whether the seller is verified, whether images are available, and whether the listing includes enough useful detail.

## Key Features

### 1. Smart Listing Generator

Sellers enter basic part details and AutoReviver generates a clean, professional listing.

Generated listing includes:

- Listing title
- Description
- Condition notes
- Compatibility summary
- Suggested keywords

This helps sellers create better listings faster and makes used parts easier to discover.

### 2. Compatibility Checker

Buyers enter their vehicle make, model, and year, then select a part.

AutoReviver checks the part against compatibility data and returns:

- Compatible
- Maybe compatible
- Not compatible
- Confidence score
- Explanation

This helps reduce wrong purchases and improves buyer confidence.

### 3. Trust Score

Each listing receives a trust score out of 100.

The score is based on factors such as:

- Part number included
- Seller verification
- Multiple images
- Return policy
- Complete condition notes
- Reasonable pricing
- Missing or suspicious information

This gives buyers a quick way to judge listing quality.

### 4. Search and Discovery

AutoReviver includes a simple search system that helps users find parts by vehicle model, part type, or keywords.

Example:

> “Ford Fiesta wing mirror 2016”

The system can return relevant matching parts and show whether the part is likely compatible.

## Demo Flow

Our demo shows the full journey of a used car part being listed and checked.

1. A seller enters information about a used part.
2. AutoReviver generates a professional listing.
3. A buyer searches for a part.
4. The buyer enters their vehicle details.
5. AutoReviver checks compatibility.
6. The platform displays a trust score and warnings.
7. The buyer can make a more informed decision.

## Example Scenario

A seller has a used Volkswagen Golf Mk7 headlight.

Instead of manually writing a vague listing, they enter:

- Part type: Headlight
- Make: Volkswagen
- Model: Golf
- Year range: 2013-2017
- Condition: Used, minor scratches
- Part number: 5G1941005

AutoReviver generates:

> Genuine Volkswagen Golf Mk7 Left Headlight 2013-2017  
> Used genuine VW Golf Mk7 left headlight assembly in good working condition. Suitable for compatible Golf Mk7 models between 2013 and 2017. Minor cosmetic scratches present but does not affect function. Please confirm part number before purchase.

A buyer with a 2016 Volkswagen Golf can then check the listing and receive:

> Compatible  
> Confidence: 92%  
> Reason: Vehicle make, model, and year match the known compatibility range.

## Technical Approach

We built AutoReviver as a web application using a frontend interface, mock vehicle compatibility data, and JavaScript/TypeScript logic for compatibility checking and trust scoring.

The project uses synthetic data to simulate real used car parts, sellers, and compatibility rules. This allowed us to focus on demonstrating the core product concept within the 24-hour hackathon timeframe.

In a production version, this could be expanded by integrating real vehicle databases, part databases, seller verification systems, and marketplace APIs.

## Tech Stack

- React / Next.js / Vite
- JavaScript / TypeScript
- Tailwind CSS
- JSON-based synthetic dataset
- Compatibility checker logic
- Trust score algorithm
- Optional AI-generated listing text
- GitHub for version control
- Vercel / Netlify for deployment

## Why This Matters

AutoReviver could help:

- Buyers avoid purchasing incompatible car parts.
- Sellers create better listings faster.
- Marketplaces improve trust and search quality.
- Scrapyards and dismantlers digitise their inventory more easily.
- Used car parts become more accessible and less wasteful.

By improving the second-hand car parts market, AutoReviver also supports sustainability by encouraging reuse instead of unnecessary new part manufacturing.

## Innovation

AutoReviver is not just another marketplace. Instead, it acts as an intelligence layer for the used car part buying process.

The innovative parts are:

- AI-assisted listing creation
- Compatibility checking before purchase
- Listing quality scoring
- Buyer trust signals
- Structured data from messy seller input

This combination directly tackles the real friction in the used parts market: poor listings, weak search, compatibility confusion, and low trust.

## Challenges We Faced

The main challenge was reducing a large marketplace-style problem into something achievable within 24 hours.

Instead of trying to build a full e-commerce platform, we focused on the highest-impact journey:

> Seller lists part → buyer checks compatibility → buyer sees trust score.

Another challenge was vehicle compatibility data. Real compatibility data can be complex and would usually require specialist databases or APIs. For the prototype, we used synthetic data and clearly labelled it as mock data.

## What We Learned

We learned how important it is to narrow scope during a hackathon. The strongest prototype is not always the biggest one. It is the one that explains the problem clearly and demonstrates a focused solution.

We also learned that used car part buying is not just a search problem. It is also a trust, data quality, and compatibility problem.

## Future Improvements

With more time, AutoReviver could include:

- Real DVLA or vehicle lookup integration
- TecDoc or parts database integration
- Image recognition for uploaded part photos
- Automatic part number extraction
- Seller verification
- Duplicate image detection
- Scam warning system
- Buyer-seller messaging
- Saved garage / saved vehicles
- Admin dashboard for scrapyards
- Marketplace API integrations
- Payment or escrow protection

## Final Pitch

AutoReviver helps turn messy used car part listings into structured, searchable, trustworthy data.

It helps sellers list faster, helps buyers avoid wrong purchases, and gives marketplaces a smarter way to handle compatibility and trust.

The used car parts market does not just need more listings.

It needs better intelligence.