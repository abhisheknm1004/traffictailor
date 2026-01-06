
import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { WebsiteContext } from "../types";
import { TRAFFIC_TAILOR_SYSTEM_INSTRUCTION } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const startTrafficTailorChat = (context: WebsiteContext): Chat => {
  const contextString = JSON.stringify(context, null, 2);
  
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: `${TRAFFIC_TAILOR_SYSTEM_INSTRUCTION}\n\nWEBSITE CONTEXT:\n${contextString}`,
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
    },
  });
};

export const generateMockWebsiteData = (url: string): WebsiteContext => {
  const isEcommerce = url.includes('shop') || url.includes('store') || url.includes('ecommerce');
  const socialShare = 20 + Math.floor(Math.random() * 30);
  const organicShare = 30 + Math.floor(Math.random() * 20);
  
  const platforms: WebsiteContext['platform'][] = ['Shopify', 'WordPress', 'Custom', 'Wix', 'Magento'];
  const detectedPlatform = platforms[Math.floor(Math.random() * platforms.length)];

  return {
    url,
    timestamp: Date.now(),
    platform: detectedPlatform,
    metrics: {
      lcp: 3200 + Math.random() * 1000,
      cls: 0.15 + Math.random() * 0.1,
      inp: 280 + Math.random() * 50,
      speedScore: 45 + Math.floor(Math.random() * 20),
    },
    seo: {
      metaTags: "Missing Open Graph tags, Title too long (75 chars)",
      headings: ["H1: Welcome to our site", "H2: Our Products", "H3: Quality counts"],
      indexability: 'Indexed',
    },
    usability: {
      mobileFriendly: Math.random() > 0.3,
      touchTargets: "Several links are too close together on mobile viewport.",
    },
    traffic: {
      sources: {
        organic: organicShare,
        social: socialShare,
        direct: 15,
        paid: Math.max(0, 100 - organicShare - socialShare - 15),
      },
      socialBreakdown: {
        meta: 40 + Math.floor(Math.random() * 20),
        google: 15 + Math.floor(Math.random() * 10),
        linkedin: 10 + Math.floor(Math.random() * 10),
        tiktok: 20 + Math.floor(Math.random() * 10),
        other: 5,
      },
      socialQuality: {
        bounceRate: 78 + Math.random() * 10,
        timeOnSite: "0m 42s",
        conversions: 2,
      },
    },
    detectedIssues: [
      "LCP exceeds 2.5s (Poor)",
      "Social traffic bounce rate is critical (78%)",
      "High CLS on product listing pages",
      "Missing schema markup for products",
      "Large unoptimized image assets (>1MB)",
      isEcommerce ? "Cart abandonment rate likely high due to checkout friction" : "No clear CTA on homepage hero"
    ]
  };
};
