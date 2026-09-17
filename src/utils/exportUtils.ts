import { RegistryRecord, ExportFormat } from '../types';
import { maskName, maskPhone, maskAddress, exportEncryptedCsv } from './crypto';

/**
 * Utility to download formatted string data as a file in the browser
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate formatted export string for records in requested format
 */
export async function exportRecords(
  records: RegistryRecord[],
  format: ExportFormat,
  unmasked: boolean = false,
  passphrase: string = ''
): Promise<{ filename: string; mimeType: string; content: string }> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const sanitizedRecords = records.map((r) => ({
    ...r,
    fullName: unmasked ? r.fullName : maskName(r.fullName),
    phone: unmasked ? r.phone : maskPhone(r.phone),
    address: unmasked ? r.address : maskAddress(r.address),
  }));

  switch (format) {
    case 'ENCRYPTED_CSV': {
      const encryptedPackage = await exportEncryptedCsv(records, passphrase, unmasked);
      return {
        filename: encryptedPackage.filename,
        mimeType: encryptedPackage.mimeType,
        content: encryptedPackage.content,
      };
    }

    case 'JSON': {
      const content = JSON.stringify(
        {
          metadata: {
            exportDate: new Date().toISOString(),
            totalRecords: records.length,
            unmaskedPII: unmasked,
            fcraNotice: 'RESEARCH AND COMPLIANCE AUDIT EXPORT ONLY. NOT FOR EMPLOYMENT/CREDIT SCREENING.',
          },
          records: sanitizedRecords,
        },
        null,
        2
      );
      return {
        filename: `registry_vault_export_${timestamp}.json`,
        mimeType: 'application/json',
        content,
      };
    }

    case 'COMPACT_JSON': {
      const compactFindings = sanitizedRecords.map((r) => ({
        id: r.id,
        ext_id: r.externalId,
        name: r.fullName,
        phone: r.phone,
        addr: r.address,
        city: r.city,
        st: r.state,
        zip: r.zipCode,
        jurisdiction: r.jurisdiction,
        tier: r.tier,
        offense: r.offenseSummary,
        year: r.convictionYear,
        status: r.registrationStatus,
        compliance: r.complianceStatus,
        hash: r.piiHash,
        scraped_at: r.scrapedAt,
        source: r.sourceUrl,
      }));

      const content = JSON.stringify(
        {
          export_ts: new Date().toISOString(),
          total_findings: records.length,
          unmasked_pii: unmasked,
          notice: 'COMPACT SEX OFFENDER FINDINGS - RESEARCH & LIVE OPS EXPORT',
          findings: compactFindings,
        },
        null,
        0
      );
      return {
        filename: `compact_offender_findings_${timestamp}.json`,
        mimeType: 'application/json',
        content,
      };
    }

    case 'CSV': {
      const headers = [
        'ID','External_ID','Full_Name','Phone','Address','City','State','ZipCode',
        'Jurisdiction','Risk_Tier','Offense_Summary','Conviction_Year','Status',
        'Compliance_Status','PII_Hash_SHA256','Source_URL',
      ];
      const rows = sanitizedRecords.map((r) => [
        escapeCsvField(r.id), escapeCsvField(r.externalId), escapeCsvField(r.fullName),
        escapeCsvField(r.phone), escapeCsvField(r.address), escapeCsvField(r.city),
        escapeCsvField(r.state), escapeCsvField(r.zipCode), escapeCsvField(r.jurisdiction),
        escapeCsvField(r.tier), escapeCsvField(r.offenseSummary), r.convictionYear,
        escapeCsvField(r.registrationStatus), escapeCsvField(r.complianceStatus),
        escapeCsvField(r.piiHash), escapeCsvField(r.sourceUrl),
      ]);
      const disclaimer = '# FCRA DISCLAIMER: Official research dataset. Do not use for background checks or housing evaluation.\n';
      const content = disclaimer + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
      return { filename: `registry_vault_export_${timestamp}.csv`, mimeType: 'text/csv', content };
    }

    case 'XML': {
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<PublicRegistryVaultExport>\n  <Metadata>\n';
      xml += `    <ExportTimestamp>${new Date().toISOString()}</ExportTimestamp>\n`;
      xml += `    <RecordCount>${records.length}</RecordCount>\n`;
      xml += `    <UnmaskedPII>${unmasked}</UnmaskedPII>\n  </Metadata>\n  <Records>\n`;
      sanitizedRecords.forEach((r) => {
        xml += '    <Record>\n';
        xml += `      <ID>${escapeXml(r.id)}</ID>\n`;
        xml += `      <ExternalID>${escapeXml(r.externalId)}</ExternalID>\n`;
        xml += `      <FullName>${escapeXml(r.fullName)}</FullName>\n`;
        xml += `      <Phone>${escapeXml(r.phone)}</Phone>\n`;
        xml += `      <Address>${escapeXml(r.address)}</Address>\n`;
        xml += `      <City>${escapeXml(r.city)}</City>\n`;
        xml += `      <State>${escapeXml(r.state)}</State>\n`;
        xml += `      <ZipCode>${escapeXml(r.zipCode)}</ZipCode>\n`;
        xml += `      <Jurisdiction>${escapeXml(r.jurisdiction)}</Jurisdiction>\n`;
        xml += `      <RiskTier>${escapeXml(r.tier)}</RiskTier>\n`;
        xml += `      <OffenseSummary>${escapeXml(r.offenseSummary)}</OffenseSummary>\n`;
        xml += `      <ConvictionYear>${r.convictionYear}</ConvictionYear>\n`;
        xml += `      <ComplianceStatus>${escapeXml(r.complianceStatus)}</ComplianceStatus>\n`;
        xml += `      <PIIHash>${escapeXml(r.piiHash)}</PIIHash>\n    </Record>\n`;
      });
      xml += '  </Records>\n</PublicRegistryVaultExport>';
      return { filename: `registry_vault_export_${timestamp}.xml`, mimeType: 'application/xml', content: xml };
    }

    case 'SQL': {
      let sql = `-- PUBLIC REGISTRY DATABASE DDL & DATA DUMP\n-- Generated: ${new Date().toISOString()}\n-- Total Records: ${records.length}\n\n`;
      sql += `CREATE TABLE IF NOT EXISTS public_registry_records (\n  id VARCHAR(64) PRIMARY KEY,\n  external_id VARCHAR(64) NOT NULL,\n  full_name VARCHAR(128) NOT NULL,\n  phone VARCHAR(32),\n  address VARCHAR(256),\n  city VARCHAR(64),\n  state VARCHAR(8),\n  zip_code VARCHAR(16),\n  jurisdiction VARCHAR(128),\n  tier VARCHAR(64),\n  offense_summary TEXT,\n  conviction_year INT,\n  compliance_status VARCHAR(32),\n  pii_hash CHAR(64),\n  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\n`;
      sanitizedRecords.forEach((r) => {
        sql += `INSERT INTO public_registry_records (id, external_id, full_name, phone, address, city, state, zip_code, jurisdiction, tier, offense_summary, conviction_year, compliance_status, pii_hash) VALUES (\n`;
        sql += `  ${escapeSqlStr(r.id)},\n  ${escapeSqlStr(r.externalId)},\n  ${escapeSqlStr(r.fullName)},\n  ${escapeSqlStr(r.phone)},\n  ${escapeSqlStr(r.address)},\n  ${escapeSqlStr(r.city)},\n  ${escapeSqlStr(r.state)},\n  ${escapeSqlStr(r.zipCode)},\n  ${escapeSqlStr(r.jurisdiction)},\n  ${escapeSqlStr(r.tier)},\n  ${escapeSqlStr(r.offenseSummary)},\n  ${r.convictionYear},\n  ${escapeSqlStr(r.complianceStatus)},\n  ${escapeSqlStr(r.piiHash)}\n) ON CONFLICT (id) DO NOTHING;\n\n`;
      });
      return { filename: `registry_database_dump_${timestamp}.sql`, mimeType: 'text/plain', content: sql };
    }

    case 'MARKDOWN': {
      let md = `# Public Safety Registry Research Report\n\n`;
      md += `**Export Date:** ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
      md += `**Total Records Included:** ${records.length}\n`;
      md += `**Unmasked PII Mode:** \`${unmasked ? 'ACTIVE' : 'MASKED'}\` \n\n`;
      md += `> **FCRA Notice:** This document contains research data extracted from state public registries. It is intended strictly for academic, policy, and legal compliance analysis. Do not use for credit or housing evaluation.\n\n`;
      md += `## Records Dataset\n\n| ID | Full Name | Location | Tier | Year | Compliance | PII Hash |\n|---|---|---|---|---|---|---|\n`;
      sanitizedRecords.forEach((r) => {
        md += `| \`${r.externalId}\` | **${r.fullName}** | ${r.city}, ${r.state} | ${r.tier} | ${r.convictionYear} | \`${r.complianceStatus}\` | \`${r.piiHash.slice(0, 10)}...\` |\n`;
      });
      md += `\n---\n*Generated by Ethical Public Safety Data & Research Vault Engine*`;
      return { filename: `registry_research_report_${timestamp}.md`, mimeType: 'text/markdown', content: md };
    }

    case 'TSV': {
      const headers = ['ID', 'ExternalID', 'FullName', 'Phone', 'Address', 'City', 'State', 'ZipCode', 'Jurisdiction', 'Tier', 'Offense', 'ConvictionYear', 'PIIHash'];
      const rows = sanitizedRecords.map((r) => [
        r.id, r.externalId, r.fullName, r.phone, r.address, r.city, r.state, r.zipCode,
        r.jurisdiction, r.tier, r.offenseSummary.replace(/\t|\n/g, ' '), r.convictionYear, r.piiHash,
      ]);
      const content = [headers.join('\t'), ...rows.map((row) => row.join('\t'))].join('\n');
      return { filename: `registry_vault_export_${timestamp}.tsv`, mimeType: 'text/tab-separated-values', content };
    }

    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

function escapeCsvField(val: string): string {
  if (!val) return '""';
  const clean = val.replace(/"/g, '""');
  return `"${clean}"`;
}

function escapeXml(str: string): string {
  if (!str) return '';
  return str.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"').replace(/'/g, ''');
}

function escapeSqlStr(str: string): string {
  if (!str) return "''";
  return `'${str.replace(/'/g, "''")}'`;
}
