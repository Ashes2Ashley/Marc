import { RegistryRecord, ScraperConfig } from '../types';
import { OFFICIAL_SOURCES } from './officialSources';

/** Vault always starts empty — no seeded people or offenses. */
export const INITIAL_REGISTRY_RECORDS: RegistryRecord[] = [];

/** Starter configs for allowlisted official public search pages (no fake rows). */
export const INITIAL_SCRAPER_CONFIGS: ScraperConfig[] = OFFICIAL_SOURCES.slice(0, 2).map((src) => ({
  id: `SRC-${src.code}`,
  name: `${src.name} public search`,
  stateCode: src.code,
  targetUrl: src.url,
  sourceType: 'HTML_TABLE' as const,
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
  status: 'Idle' as const,
}));
