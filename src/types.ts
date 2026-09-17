export type JurisdictionTier = 'Tier I (Low Risk)' | 'Tier II (Moderate Risk)' | 'Tier III (High Risk)' | 'Unclassified';
export type ExportFormat = 'JSON' | 'COMPACT_JSON' | 'CSV' | 'ENCRYPTED_CSV' | 'XML' | 'SQL' | 'MARKDOWN' | 'TSV';

export interface RegistryRecord {
  id: string;
  externalId: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  jurisdiction: string;
  tier: JurisdictionTier;
  offenseSummary: string;
  convictionYear: number;
  registrationStatus: 'Active' | 'Incarcerated' | 'Deceased' | 'Pending Review';
  photoUrl?: string;
  scrapedAt: string;
  sourceUrl: string;
  isEncrypted: boolean;
  encryptedData?: string;
  piiHash: string;
  complianceStatus: 'FCRA Compliant' | 'Redacted' | 'Audit Pending' | 'Flagged';
  notes?: string;
  parseConfidence?: number;
}

export interface ScraperConfig {
  id: string;
  name: string;
  stateCode: string;
  targetUrl: string;
  sourceType: 'HTML_TABLE' | 'JSON_API' | 'XML_FEED' | 'CUSTOM_DOM';
  requestIntervalMs: number;
  respectRobotsTxt: boolean;
  userAgent: string;
  useCorsProxy?: boolean;
  corsProxyUrl?: string;
  selectors: {
    recordContainer: string;
    fullName: string;
    phone: string;
    address: string;
    jurisdiction: string;
    tier: string;
    offense: string;
    convictionYear: string;
  };
  ethicalGuardrails: {
    fcraAcknowledged: boolean;
    autoRedactPhone: boolean;
    autoRedactAddress: boolean;
    hashPiiIdentifiers: boolean;
    maxDepth: number;
  };
  lastRun?: string;
  status: 'Idle' | 'Running' | 'Paused' | 'Error';
}

export interface HttpTestResult {
  url: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  byteSize: number;
  contentType: string;
  rawBody: string;
  corsBlocked: boolean;
  parsedRecordsCount?: number;
}

export interface ScraperLogEntry {
  id: string;
  timestamp: string;
  scraperId: string;
  scraperName: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  message: string;
  statusCode?: number;
  bytesReceived?: number;
  recordsExtracted?: number;
}

export interface EncryptionVaultState {
  isLocked: boolean;
  masterKeyDerived: boolean;
  algorithm: string;
  totalRecordsCount: number;
  encryptedRecordsCount: number;
  maskedFieldsActive: { fullName: boolean; phone: boolean; address: boolean };
}

export interface ComplianceAuditRule {
  id: string;
  category: 'FCRA' | 'GDPR_CCPA' | 'ETHICAL_RESEARCH' | 'DATA_SECURITY';
  title: string;
  description: string;
  status: 'COMPLIANT' | 'WARNING' | 'ACTION_REQUIRED';
  detail: string;
}

export interface AnalyticsSummary {
  totalRecords: number;
  totalJurisdictions: number;
  tierDistribution: { name: string; value: number }[];
  stateDistribution: { state: string; count: number }[];
  temporalTrend: { year: number; count: number }[];
  complianceBreakdown: { status: string; count: number }[];
}

export type ThreatSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
export type ThreatCategory = 'ANTI_BOT_BYPASS' | 'DOM_SCHEMA_SHIFT' | 'RATE_LIMIT_SPIKE' | 'WAF_CHALLENGE' | 'CORS_POLICY_CHANGE' | 'APT_REGISTRY_TREND';

export interface ThreatIntelItem {
  id: string;
  timestamp: string;
  title: string;
  indicatorType: 'IP_BLOCKLIST' | 'USER_AGENT_FILTER' | 'RATE_LIMIT' | 'DOM_SELECTOR' | 'CORS_PROXY' | 'API_KEY_ROTATION';
  category: ThreatCategory;
  severity: ThreatSeverity;
  targetStateCode: string;
  targetScraperId?: string;
  confidence: number;
  techniqueId?: string;
  sourceFeed: string;
  description: string;
  iocValue: string;
  recommendedAction: {
    label: string;
    description: string;
    actionType: 'INCREASE_INTERVAL' | 'ROTATE_USER_AGENT' | 'ENABLE_CORS_PROXY' | 'UPDATE_SELECTOR' | 'ENFORCE_ROBOTS_TXT' | 'AUTO_REDACT_PII';
    suggestedValue?: string | number | boolean;
  };
  isApplied: boolean;
}
