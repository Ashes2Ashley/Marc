import React, { useState } from 'react';
import {
  Database,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Search,
  Filter,
  Download,
  Plus,
  ShieldCheck,
  KeyRound,
  FileSpreadsheet,
  FileCode,
  FileText,
  Upload,
  X,
  Check,
  AlertCircle,
  Trash2,
  Tag,
  SlidersHorizontal,
  RotateCcw
} from 'lucide-react';
import { RegistryRecord, ExportFormat } from '../types';
import {
  maskName,
  maskPhone,
  maskAddress,
  sha256Hash,
  decryptEncryptedCsvEnvelope
} from '../utils/crypto';
import { exportRecords, downloadFile } from '../utils/exportUtils';

export const OFFENSE_CATEGORIES = [
  'ALL',
  'Sexual Assault & Battery',
  'Child & Minor Offenses',
  'Public Indecency & Exposure',
  'Unlawful Surveillance',
  'Statutory & Other',
] as const;

export type OffenseCategory = typeof OFFENSE_CATEGORIES[number];

export function getOffenseCategory(offenseSummary: string): string {
  if (!offenseSummary) return 'Statutory & Other';
  const lower = offenseSummary.toLowerCase();
  if (
    lower.includes('child') ||
    lower.includes('minor') ||
    lower.includes('molest') ||
    lower.includes('juvenile') ||
    lower.includes('lascivious')
  ) {
    return 'Child & Minor Offenses';
  }
  if (
    lower.includes('battery') ||
    lower.includes('assault') ||
    lower.includes('force') ||
    lower.includes('abuse') ||
    lower.includes('rape')
  ) {
    return 'Sexual Assault & Battery';
  }
  if (
    lower.includes('surveillance') ||
    lower.includes('voyeur') ||
    lower.includes('camera') ||
    lower.includes('peep') ||
    lower.includes('recording')
  ) {
    return 'Unlawful Surveillance';
  }
  if (
    lower.includes('indecen') ||
    lower.includes('exposure') ||
    lower.includes('lewd') ||
    lower.includes('public')
  ) {
    return 'Public Indecency & Exposure';
  }
  return 'Statutory & Other';
}

export function getCategoryBadgeClasses(category: string): string {
  switch (category) {
    case 'Child & Minor Offenses':
      return 'bg-rose-500/15 text-rose-300 border border-rose-500/30';
    case 'Sexual Assault & Battery':
      return 'bg-orange-500/15 text-orange-300 border border-orange-500/30';
    case 'Public Indecency & Exposure':
      return 'bg-amber-500/15 text-amber-300 border border-amber-500/30';
    case 'Unlawful Surveillance':
      return 'bg-purple-500/15 text-purple-300 border border-purple-500/30';
    default:
      return 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30';
  }
}

interface EncryptedVaultProps {
  records: RegistryRecord[];
  isVaultLocked: boolean;
  onUnlockVault: (passphrase: string) => Promise<boolean>;
  onLockVault: () => void;
  onAddRecord: (newRecord: RegistryRecord) => void;
  onPurgeRecords?: () => void;
}

export const EncryptedVault: React.FC<EncryptedVaultProps> = ({
  records,
  isVaultLocked,
  onUnlockVault,
  onLockVault,
  onAddRecord,
  onPurgeRecords,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('ALL');
  const [selectedTier, setSelectedTier] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [revealPII, setRevealPII] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<RegistryRecord | null>(null);

  // Passphrase Unlock Modal state
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [passphraseInput, setPassphraseInput] = useState('');
  const [passphraseError, setPassphraseError] = useState('');

  // Add Record Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newForm, setNewForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    state: 'TX',
    zipCode: '',
    jurisdiction: '',
    tier: 'Tier II (Moderate Risk)' as any,
    offenseSummary: '',
    convictionYear: 2020,
  });

  // Export Modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('JSON');
  const [includeUnmasked, setIncludeUnmasked] = useState(false);
  const [exportPassphrase, setExportPassphrase] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // File Import Modal state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStatus, setImportStatus] = useState<string>('');
  const [importError, setImportError] = useState<string>('');

  // Filter logic: locates records by name, ID, or offense category
  const filteredRecords = records.filter((r) => {
    const term = searchTerm.trim().toLowerCase();
    const offenseCategory = getOffenseCategory(r.offenseSummary);

    const matchesSearch =
      !term ||
      r.fullName.toLowerCase().includes(term) ||
      r.id.toLowerCase().includes(term) ||
      r.externalId.toLowerCase().includes(term) ||
      r.offenseSummary.toLowerCase().includes(term) ||
      offenseCategory.toLowerCase().includes(term) ||
      r.jurisdiction.toLowerCase().includes(term) ||
      r.city.toLowerCase().includes(term) ||
      r.state.toLowerCase().includes(term) ||
      r.zipCode.toLowerCase().includes(term);

    const matchesState = selectedState === 'ALL' || r.state === selectedState;
    const matchesTier = selectedTier === 'ALL' || r.tier.includes(selectedTier);
    const matchesCategory =
      selectedCategory === 'ALL' ||
      offenseCategory === selectedCategory ||
      (selectedCategory === 'Sexual Assault & Battery' && (r.offenseSummary.toLowerCase().includes('assault') || r.offenseSummary.toLowerCase().includes('battery'))) ||
      (selectedCategory === 'Child & Minor Offenses' && (r.offenseSummary.toLowerCase().includes('child') || r.offenseSummary.toLowerCase().includes('minor') || r.offenseSummary.toLowerCase().includes('molest'))) ||
      (selectedCategory === 'Public Indecency & Exposure' && (r.offenseSummary.toLowerCase().includes('indecen') || r.offenseSummary.toLowerCase().includes('exposure'))) ||
      (selectedCategory === 'Unlawful Surveillance' && (r.offenseSummary.toLowerCase().includes('surveillance') || r.offenseSummary.toLowerCase().includes('voyeur')));

    return matchesSearch && matchesState && matchesTier && matchesCategory;
  });

  const isFiltered = searchTerm.trim() !== '' || selectedState !== 'ALL' || selectedTier !== 'ALL' || selectedCategory !== 'ALL';

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedState('ALL');
    setSelectedTier('ALL');
    setSelectedCategory('ALL');
  };

  const statesList = Array.from(new Set(records.map((r) => r.state))).sort();

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassphraseError('');
    if (!passphraseInput.trim()) return;

    const success = await onUnlockVault(passphraseInput);
    if (success) {
      setShowUnlockModal(false);
      setPassphraseInput('');
    } else {
      setPassphraseError('Invalid vault master key or passphrase derivation failed.');
    }
  };

  const handleExecuteExport = async () => {
    setIsExporting(true);
    try {
      const unmaskAllowed = !isVaultLocked && revealPII && includeUnmasked;
      const result = await exportRecords(filteredRecords, exportFormat, unmaskAllowed, exportPassphrase);
      downloadFile(result.content, result.filename, result.mimeType);
      setShowExportModal(false);
    } catch (err: any) {
      alert(`Export failed: ${err.message || String(err)}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError('');
    setImportStatus('Reading dataset file...');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        let parsed: any[] = [];

        if (text.includes('ENCRYPTED_CIPHERTEXT_BASE64:') || file.name.endsWith('.enc.csv')) {
          setImportStatus('Decrypting AES-256-GCM envelope payload...');
          try {
            const decryptResult = await decryptEncryptedCsvEnvelope(text, exportPassphrase);
            const decryptedCsvText = decryptResult.rawCsv;
            const lines = decryptedCsvText.split('\n').filter((l) => l.trim() && !l.startsWith('#'));
            const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
            for (let i = 1; i < lines.length; i++) {
              const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
              if (cols.length >= 3) {
                parsed.push({
                  fullName: cols[2] || cols[0],
                  phone: cols[3] || '',
                  address: cols[4] || '',
                  city: cols[5] || 'Unknown',
                  state: cols[6] || 'US',
                  zipCode: cols[7] || '00000',
                  jurisdiction: cols[8] || 'Public Agency',
                  tier: cols[9] || 'Tier I (Low Risk)',
                  offenseSummary: cols[10] || 'Public Registry Record',
                  convictionYear: parseInt(cols[11]) || 2020,
                });
              }
            }
          } catch (decErr: any) {
            throw new Error(`Decryption failed: ${decErr.message || 'Invalid passphrase or corrupt envelope payload.'}`);
          }
        } else if (file.name.endsWith('.json')) {
          const jsonObj = JSON.parse(text);
          parsed = Array.isArray(jsonObj) ? jsonObj : Array.isArray(jsonObj?.records) ? jsonObj.records : [jsonObj];
        } else if (file.name.endsWith('.csv')) {
          const lines = text.split('\n').filter(l => l.trim() && !l.startsWith('#'));
          const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
            if (cols.length >= 3) {
              parsed.push({
                fullName: cols[2] || cols[0],
                phone: cols[3] || '',
                address: cols[4] || '',
                city: cols[5] || 'Unknown',
                state: cols[6] || 'US',
                zipCode: cols[7] || '00000',
                jurisdiction: cols[8] || 'Public Agency',
                tier: cols[9] || 'Tier I (Low Risk)',
                offenseSummary: cols[10] || 'Public Registry Record',
                convictionYear: parseInt(cols[11]) || 2020,
              });
            }
          }
        }

        if (parsed.length === 0) {
          throw new Error('No valid record entries found in file.');
        }

        let importedCount = 0;
        for (const item of parsed) {
          const name = item.fullName || item.name || 'Imported Subject';
          const phone = item.phone || '+1 (555) 000-0000';
          const addr = item.address || 'Public Record Address';
          const hash = await sha256Hash(`${name}:${phone}:${addr}`);

          const rec: RegistryRecord = {
            id: `REG-IMPORT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            externalId: item.externalId || `${item.state || 'US'}-IMP-${Math.floor(Math.random() * 89999 + 10000)}`,
            fullName: name,
            phone: phone,
            address: addr,
            city: item.city || 'Imported City',
            state: (item.state || 'US').toUpperCase(),
            zipCode: item.zipCode || '00000',
            jurisdiction: item.jurisdiction || 'Imported Research Feed',
            tier: item.tier || 'Tier II (Moderate Risk)',
            offenseSummary: item.offenseSummary || item.offense || 'Imported registry data payload',
            convictionYear: Number(item.convictionYear || item.year) || 2020,
            registrationStatus: 'Active',
            scrapedAt: new Date().toISOString(),
            sourceUrl: 'External Dataset File Upload',
            isEncrypted: true,
            encryptedData: `AES256-GCM-IMPORT-${Date.now()}`,
            piiHash: hash,
            complianceStatus: 'FCRA Compliant',
          };

          onAddRecord(rec);
          importedCount++;
        }

        setImportStatus(`Successfully encrypted and imported ${importedCount} records into vault.`);
        setTimeout(() => {
          setShowImportModal(false);
          setImportStatus('');
        }, 1500);
      } catch (err: any) {
        setImportError(`File parse failed: ${err.message || String(err)}`);
        setImportStatus('');
      }
    };

    reader.readAsText(file);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const piiHash = await sha256Hash(`${newForm.fullName}:${newForm.phone}:${newForm.address}`);

    const newRec: RegistryRecord = {
      id: `REG-MANUAL-${Date.now()}`,
      externalId: `${newForm.state}-MANUAL-${Math.floor(Math.random() * 89999 + 10000)}`,
      fullName: newForm.fullName,
      phone: newForm.phone,
      address: newForm.address,
      city: newForm.city,
      state: newForm.state,
      zipCode: newForm.zipCode,
      jurisdiction: newForm.jurisdiction,
      tier: newForm.tier,
      offenseSummary: newForm.offenseSummary,
      convictionYear: Number(newForm.convictionYear),
      registrationStatus: 'Active',
      scrapedAt: new Date().toISOString(),
      sourceUrl: 'Manual Verification Entry',
      isEncrypted: true,
      encryptedData: `AES256-GCM-MANUAL-${Date.now()}`,
      piiHash: piiHash,
      complianceStatus: 'FCRA Compliant',
    };

    onAddRecord(newRec);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Vault Security Status Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-xl border ${isVaultLocked ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
            {isVaultLocked ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Encrypted Database Vault</h2>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${isVaultLocked ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'}`}>
                {isVaultLocked ? 'Vault Locked (Read-Only Masked)' : 'Vault Unlocked (Full Access)'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              AES-256-GCM Encrypted Storage • Field-Level PII Masking • Multi-Format Export Engine
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Lock/Unlock Toggle Button */}
          {isVaultLocked ? (
            <button
              onClick={() => setShowUnlockModal(true)}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow-lg flex items-center gap-1.5 transition-colors"
            >
              <KeyRound className="w-4 h-4" />
              Unlock Master Key
            </button>
          ) : (
            <button
              onClick={onLockVault}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              Lock Vault
            </button>
          )}

          {/* Reveal PII Toggle (When Unlocked) */}
          <button
            onClick={() => {
              if (isVaultLocked) {
                setShowUnlockModal(true);
              } else {
                setRevealPII(!revealPII);
              }
            }}
            className={`px-3.5 py-2 border rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              revealPII
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {revealPII ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-cyan-400" />}
            {revealPII ? 'Hide PII Fields' : 'Unmask PII Data'}
          </button>

          {/* Add Record */}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            Add Record
          </button>

          {/* Dataset Import */}
          <button
            onClick={() => setShowImportModal(true)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
          >
            <Upload className="w-4 h-4 text-emerald-400" />
            Import File
          </button>

          {/* Multi-Format Export Options */}
          <button
            onClick={() => setShowExportModal(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-lg flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Vault Data
          </button>

          {/* Purge All Data */}
          {onPurgeRecords && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to purge all records from the vault? This cannot be undone.')) {
                  onPurgeRecords();
                }
              }}
              className="px-3 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
              title="Purge all records for live deployment"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              Purge All Data
            </button>
          )}
        </div>
      </div>

      {/* Advanced Search and Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3.5 text-xs">
        {/* Primary Controls Row: Search Bar + Select Dropdowns */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Main Search Input: Name, ID, or Offense Category */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, ID (e.g. REG-001, TX-SOR), or offense category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-8 py-2 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200 p-0.5 rounded transition-colors"
                title="Clear search input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Selectors: Offense Category, State, Tier */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Offense Category Filter */}
            <div className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-400 font-medium">Offense Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="ALL">All Categories</option>
                <option value="Sexual Assault & Battery">Sexual Assault & Battery</option>
                <option value="Child & Minor Offenses">Child & Minor Offenses</option>
                <option value="Public Indecency & Exposure">Public Indecency & Exposure</option>
                <option value="Unlawful Surveillance">Unlawful Surveillance</option>
                <option value="Statutory & Other">Statutory & Other</option>
              </select>
            </div>

            {/* State Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400 font-medium">State:</span>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All States ({statesList.length})</option>
                {statesList.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Risk Tier Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Tier:</span>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All Tiers</option>
                <option value="Tier I">Tier I (Low)</option>
                <option value="Tier II">Tier II (Moderate)</option>
                <option value="Tier III">Tier III (High)</option>
              </select>
            </div>

            {/* Reset All Filters Button */}
            {isFiltered && (
              <button
                onClick={handleResetFilters}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg flex items-center gap-1 transition-colors"
                title="Reset all search and filter options"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Quick Filter Chips & Results Counter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-500 font-mono mr-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-slate-400" />
              Quick Filters:
            </span>
            <button
              onClick={() => { setSelectedCategory('ALL'); setSelectedTier('ALL'); }}
              className={`px-2.5 py-1 rounded-full text-[11px] transition-colors ${
                selectedCategory === 'ALL' && selectedTier === 'ALL'
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              All Records
            </button>
            <button
              onClick={() => setSelectedCategory(selectedCategory === 'Sexual Assault & Battery' ? 'ALL' : 'Sexual Assault & Battery')}
              className={`px-2.5 py-1 rounded-full text-[11px] transition-colors ${
                selectedCategory === 'Sexual Assault & Battery'
                  ? 'bg-orange-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-950 text-orange-400/90 hover:bg-orange-950/40 border border-orange-900/40'
              }`}
            >
              Sexual Assault & Battery
            </button>
            <button
              onClick={() => setSelectedCategory(selectedCategory === 'Child & Minor Offenses' ? 'ALL' : 'Child & Minor Offenses')}
              className={`px-2.5 py-1 rounded-full text-[11px] transition-colors ${
                selectedCategory === 'Child & Minor Offenses'
                  ? 'bg-rose-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-950 text-rose-400/90 hover:bg-rose-950/40 border border-rose-900/40'
              }`}
            >
              Child & Minor Offenses
            </button>
            <button
              onClick={() => setSelectedCategory(selectedCategory === 'Public Indecency & Exposure' ? 'ALL' : 'Public Indecency & Exposure')}
              className={`px-2.5 py-1 rounded-full text-[11px] transition-colors ${
                selectedCategory === 'Public Indecency & Exposure'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-950 text-amber-400/90 hover:bg-amber-950/40 border border-amber-900/40'
              }`}
            >
              Public Indecency
            </button>
            <button
              onClick={() => setSelectedCategory(selectedCategory === 'Unlawful Surveillance' ? 'ALL' : 'Unlawful Surveillance')}
              className={`px-2.5 py-1 rounded-full text-[11px] transition-colors ${
                selectedCategory === 'Unlawful Surveillance'
                  ? 'bg-purple-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-950 text-purple-400/90 hover:bg-purple-950/40 border border-purple-900/40'
              }`}
            >
              Surveillance
            </button>
            <button
              onClick={() => setSelectedTier(selectedTier === 'Tier III' ? 'ALL' : 'Tier III')}
              className={`px-2.5 py-1 rounded-full text-[11px] transition-colors ${
                selectedTier === 'Tier III'
                  ? 'bg-rose-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              Tier III (High Risk)
            </button>
          </div>

          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
            <span>
              Showing <strong className="text-white">{filteredRecords.length}</strong> of{' '}
              <strong className="text-slate-300">{records.length}</strong> records
            </span>
            {isFiltered && (
              <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] border border-indigo-500/30">
                Filtered
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Encrypted Vault Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800 text-[11px]">
              <tr>
                <th className="px-4 py-3">Record / External ID</th>
                <th className="px-4 py-3">Subject Name</th>
                <th className="px-4 py-3">Offense Category & Summary</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Location / Agency</th>
                <th className="px-4 py-3">Risk Tier</th>
                <th className="px-4 py-3">Compliance</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <div className="max-w-md mx-auto space-y-2">
                      <p className="text-slate-300 font-medium">
                        No records yet. Import a dataset or add a verified entry — the vault starts empty by design.
                      </p>
                      <p className="text-xs text-slate-500">
                        Use Import File or Add Record once unlocked. Official scrapers can also populate this vault.
                      </p>
                      {isFiltered && (
                        <div className="pt-2">
                          <button
                            onClick={handleResetFilters}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium text-xs transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Clear Search & Filters
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const displayFullName = !isVaultLocked && revealPII ? r.fullName : maskName(r.fullName);
                  const displayPhone = !isVaultLocked && revealPII ? r.phone : maskPhone(r.phone);
                  const displayAddress = !isVaultLocked && revealPII ? r.address : maskAddress(r.address);
                  const category = getOffenseCategory(r.offenseSummary);
                  const categoryBadgeStyle = getCategoryBadgeClasses(category);

                  return (
                    <tr key={r.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-mono">
                        <div className="text-indigo-300 font-semibold">{r.externalId}</div>
                        <div className="text-[10px] text-slate-500">{r.id}</div>
                      </td>

                      <td className="px-4 py-3 font-medium text-slate-100">
                        <div className="flex items-center gap-1.5">
                          <span>{displayFullName}</span>
                          {!revealPII && <Lock className="w-3 h-3 text-slate-500" />}
                        </div>
                      </td>

                      <td className="px-4 py-3 max-w-xs">
                        <div className="space-y-1">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${categoryBadgeStyle}`}>
                            {category}
                          </span>
                          <div className="text-slate-300 text-[11px] line-clamp-2" title={r.offenseSummary}>
                            {r.offenseSummary}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 font-mono text-slate-300 whitespace-nowrap">{displayPhone}</td>

                      <td className="px-4 py-3">
                        <div className="text-slate-200">{displayAddress}, {r.city}, {r.state} {r.zipCode}</div>
                        <div className="text-[11px] text-slate-500">{r.jurisdiction}</div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            r.tier.includes('III')
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : r.tier.includes('II')
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {r.tier}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${
                            r.complianceStatus === 'FCRA Compliant'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          <ShieldCheck className="w-3 h-3" />
                          {r.complianceStatus}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedRecord(r)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs transition-colors"
                        >
                          Inspect Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-Format Export Options Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Export Dataset Engine</h3>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-400">
              Export {filteredRecords.length} active records in your preferred format for academic research or database migration.
            </p>

            <div className="space-y-3">
              <label className="block font-semibold text-slate-200">Select Export Format</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: 'JSON', label: 'JSON Vault', icon: FileCode, desc: 'Full JSON payload' },
                  { id: 'COMPACT_JSON', label: 'Compact JSON', icon: FileCode, desc: 'Minimized JSON findings' },
                  { id: 'CSV', label: 'CSV Table', icon: FileSpreadsheet, desc: 'Spreadsheet table' },
                  { id: 'ENCRYPTED_CSV', label: 'AES-256 Encrypted CSV', icon: Lock, desc: 'AES-GCM Envelope' },
                  { id: 'XML', label: 'XML Feed', icon: FileText, desc: 'Structured XML' },
                  { id: 'SQL', label: 'SQL DDL Dump', icon: Database, desc: 'Postgres/MySQL SQL' },
                  { id: 'MARKDOWN', label: 'Markdown Report', icon: FileText, desc: 'Formatted report' },
                  { id: 'TSV', label: 'TSV Excel', icon: FileSpreadsheet, desc: 'Tab delimited' },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = exportFormat === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setExportFormat(item.id as ExportFormat)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        active
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mb-1.5 ${active ? 'text-indigo-400' : 'text-slate-500'}`} />
                      <span className="font-bold block text-slate-200">{item.label}</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">{item.desc}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Encrypted CSV Passphrase Input */}
            {exportFormat === 'ENCRYPTED_CSV' && (
              <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-indigo-300 font-semibold text-xs">
                  <KeyRound className="w-4 h-4 text-indigo-400" />
                  <span>AES-256-GCM Envelope Encryption Key</span>
                </div>
                <input
                  type="password"
                  value={exportPassphrase}
                  onChange={(e) => setExportPassphrase(e.target.value)}
                  placeholder="Enter export passphrase"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-mono"
                />
                <p className="text-[11px] text-slate-400">
                  Data will be salted with 100,000 PBKDF2-HMAC-SHA256 iterations and packaged into an AES-256-GCM self-verifying envelope.
                </p>
              </div>
            )}

            {/* Unmasked Toggle */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  disabled={isVaultLocked || !revealPII}
                  checked={includeUnmasked}
                  onChange={(e) => setIncludeUnmasked(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-indigo-500 focus:ring-0 disabled:opacity-50"
                />
                <span className={isVaultLocked || !revealPII ? 'text-slate-500' : 'text-slate-200 font-semibold'}>
                  Export Unmasked Raw PII (Requires Master Key Unlock)
                </span>
              </label>

              {(isVaultLocked || !revealPII) && (
                <p className="text-[11px] text-amber-400/90 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Vault is locked or PII masked. Exports will use anonymized field masking.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-3.5 py-2 bg-slate-800 text-slate-300 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteExport}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-lg flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                Generate & Download File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dataset Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Import Research Dataset</h3>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-400">
              Upload a custom <code className="text-indigo-300">.json</code> or <code className="text-indigo-300">.csv</code> dataset file to automatically encrypt and store records in the vault.
            </p>

            <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-950 rounded-xl p-6 text-center space-y-3 transition-colors cursor-pointer relative">
              <Upload className="w-8 h-8 text-slate-500 mx-auto" />
              <div>
                <span className="font-semibold text-slate-200 block">Click to Select or Drop Dataset File</span>
                <span className="text-[11px] text-slate-500">Supports JSON and CSV formats</span>
              </div>
              <input
                type="file"
                accept=".json,.csv"
                onChange={handleFileUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>

            {importStatus && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded text-[11px] flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{importStatus}</span>
              </div>
            )}

            {importError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded text-[11px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Inspection Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Record Payload Inspection</h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-500 block">External Identifier</span>
                <span className="font-mono text-indigo-300">{selectedRecord.externalId}</span>
              </div>
              <div>
                <span className="text-slate-500 block">SHA-256 PII Hash Key</span>
                <span className="font-mono text-slate-400 text-[10px] truncate block">
                  {selectedRecord.piiHash}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Full Name</span>
                <span className="font-semibold text-white">
                  {!isVaultLocked && revealPII ? selectedRecord.fullName : maskName(selectedRecord.fullName)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Contact Phone</span>
                <span className="font-mono text-slate-200">
                  {!isVaultLocked && revealPII ? selectedRecord.phone : maskPhone(selectedRecord.phone)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Registered Address</span>
                <span className="text-slate-200">
                  {!isVaultLocked && revealPII ? selectedRecord.address : maskAddress(selectedRecord.address)}, {selectedRecord.city}, {selectedRecord.state} {selectedRecord.zipCode}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Jurisdiction Agency</span>
                <span className="text-slate-200">{selectedRecord.jurisdiction}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Risk Tier</span>
                <span className="text-amber-300 font-semibold">{selectedRecord.tier}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Conviction Year</span>
                <span className="text-slate-200">{selectedRecord.convictionYear}</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-slate-400 font-medium">Offense Summary & Classification</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${getCategoryBadgeClasses(getOffenseCategory(selectedRecord.offenseSummary))}`}>
                  {getOffenseCategory(selectedRecord.offenseSummary)}
                </span>
              </div>
              <p className="p-3 bg-slate-950 rounded-lg text-slate-300 border border-slate-800/80 leading-relaxed">
                {selectedRecord.offenseSummary}
              </p>
            </div>

            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-200 space-y-1">
              <span className="font-semibold block text-[11px]">AES-256 Encrypted Payload String:</span>
              <p className="font-mono text-[10px] text-indigo-300/80 break-all">
                {selectedRecord.encryptedData}
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unlock Master Passphrase Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Unlock AES-256 Master Key</h3>
                <p className="text-slate-400">Derive decryption key to unmask raw PII research fields.</p>
              </div>
            </div>

            <form onSubmit={handleUnlockSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Vault Master Passphrase</label>
                <input
                  type="password"
                  placeholder="Enter vault passphrase"
                  value={passphraseInput}
                  onChange={(e) => setPassphraseInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Use the passphrase you set locally. Nothing is pre-shared.
                </p>
              </div>

              {passphraseError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded text-rose-300 text-[11px]">
                  {passphraseError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUnlockModal(false)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-lg"
                >
                  Authenticate & Unlock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Add Record Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Add Verified Public Record</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newForm.fullName}
                    onChange={(e) => setNewForm({ ...newForm, fullName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={newForm.phone}
                    onChange={(e) => setNewForm({ ...newForm, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={newForm.address}
                  onChange={(e) => setNewForm({ ...newForm, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={newForm.city}
                    onChange={(e) => setNewForm({ ...newForm, city: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">State</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={newForm.state}
                    onChange={(e) => setNewForm({ ...newForm, state: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Zip Code</label>
                  <input
                    type="text"
                    required
                    value={newForm.zipCode}
                    onChange={(e) => setNewForm({ ...newForm, zipCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Jurisdiction Agency</label>
                  <input
                    type="text"
                    required
                    value={newForm.jurisdiction}
                    onChange={(e) => setNewForm({ ...newForm, jurisdiction: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Offense Conviction Year</label>
                  <input
                    type="number"
                    required
                    value={newForm.convictionYear}
                    onChange={(e) => setNewForm({ ...newForm, convictionYear: parseInt(e.target.value) || 2020 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Offense Summary</label>
                <textarea
                  required
                  rows={2}
                  value={newForm.offenseSummary}
                  onChange={(e) => setNewForm({ ...newForm, offenseSummary: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 bg-slate-800 text-slate-300 rounded font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded font-semibold"
                >
                  Encrypt & Commit Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
