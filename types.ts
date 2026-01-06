
export interface WebsiteContext {
  url: string;
  timestamp: number;
  platform: 'Shopify' | 'WordPress' | 'Custom' | 'Wix' | 'Magento';
  metrics: {
    lcp: number; // Largest Contentful Paint (ms)
    cls: number; // Cumulative Layout Shift
    inp: number; // Interaction to Next Paint (ms)
    speedScore: number; // 0-100
  };
  seo: {
    metaTags: string;
    headings: string[];
    indexability: 'Indexed' | 'Noindex' | 'Pending';
  };
  usability: {
    mobileFriendly: boolean;
    touchTargets: string;
  };
  traffic: {
    sources: {
      organic: number;
      social: number;
      direct: number;
      paid: number;
    };
    socialBreakdown: {
      meta: number;
      google: number;
      linkedin: number;
      tiktok: number;
      other: number;
    };
    socialQuality: {
      bounceRate: number;
      timeOnSite: string;
      conversions: number;
    };
  };
  detectedIssues: string[];
}

export interface HistoryItem {
  id: string;
  url: string;
  timestamp: number;
  data: WebsiteContext;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export enum Severity {
  P0 = 'P0: Critical',
  P1 = 'P1: Important',
  P2 = 'P2: Nice to have'
}
