import { RegistryRecord, ScraperConfig } from '../types';

/** Live ops start empty. No seeded people or demo offenses. */
export const INITIAL_REGISTRY_RECORDS: RegistryRecord[] = [];

/** Official public search pages only. Selectors are starting points. */
export const INITIAL_SCRAPER_CONFIGS: ScraperConfig[] = [
  {
    id: 'SRC-TX',
    name: 'Texas DPS public search',
    stateCode: 'TX',
    targetUrl: 'https://sor.dps.texas.gov/PublicSite/Search',
    sourceType: 'HTML_TABLE',
    requestIntervalMs: 4000,
    respectRobotsTxt: true,
    userAgent: 'MarcLiveResearch/1.0',
    selectors: {
      recordContainer: 'table tr',
      fullName: 'td',
      phone: 'td',
      address: 'td',
      jurisdiction: 'td',
      tier: 'td',
      offense: 'td',
      convictionYear: 'td',
    },
    ethicalGuardrails: {
      fcraAcknowledged: true,
      autoRedactPhone: true,
      autoRedactAddress: true,
      hashPiiIdentifiers: true,
      maxDepth: 1,
    },
    status: 'Idle',
  },
  {
    id: 'SRC-CA',
    name: "California Megan's Law search",
    stateCode: 'CA',
    targetUrl: 'https://www.meganslaw.ca.gov/Search.aspx',
    sourceType: 'HTML_TABLE',
    requestIntervalMs: 4000,
    respectRobotsTxt: true,
    userAgent: 'MarcLiveResearch/1.0',
    selectors: {
      recordContainer: 'table tr',
      fullName: 'td',
      phone: 'td',
      address: 'td',
      jurisdiction: 'td',
      tier: 'td',
      offense: 'td',
      convictionYear: 'td',
    },
    ethicalGuardrails: {
      fcraAcknowledged: true,
      autoRedactPhone: true,
      autoRedactAddress: true,
      hashPiiIdentifiers: true,
      maxDepth: 1,
    },
    status: 'Idle',
  },
];
