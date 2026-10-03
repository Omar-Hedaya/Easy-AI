export type ThemeCategory = 'light' | 'dark';

export interface ThemeConfig {
  id: string;
  name: string;
  category: ThemeCategory;
  description: string;
  bgHex: string;
  textHex: string;
  headerAccentHex: string;
  cardBgHex: string;
  cardBorderHex: string;
  tableHeaderBgHex: string;
  tableHeaderTextHex: string;
  tableRowEvenHex: string;
  tableRowOddHex: string;
  tableBorderHex: string;
  codeBgHex: string;
  codeTextHex: string;
  codeBorderHex: string;
  katexColorHex: string;
  badgeBgHex: string;
  badgeTextHex: string;
  accentHex: string;
  accentHoverHex: string;
}

export type TargetLanguage = 'ar-EG' | 'ar-SA' | 'en-US' | 'fr-FR' | 'de-DE' | 'es-ES';

export interface LanguageConfig {
  code: TargetLanguage;
  name: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
  flag: string;
  tagline: string;
}

export interface FormulaEntry {
  id: string; // e.g. EQ-1
  name: string;
  latex: string;
  variables: { symbol: string; meaning: string; unit?: string }[];
  context: string;
}

export interface CurriculumAnalysisResult {
  title: string;
  discipline: string;
  targetLanguage: TargetLanguage;
  level: string;
  executiveSummary: string;
  masterFormulaLedger: FormulaEntry[];
  coreTheoremsAndLaws: {
    name: string;
    statement: string;
    formulaRefId?: string;
    intuitiveExplanation: string;
  }[];
  matrixAnalysisTable: {
    headers: string[];
    rows: string[][];
  };
  deepCurriculumContent: string; // Markdown with LaTeX
  uniquenessValidationLedger: {
    totalUniqueFormulasFound: number;
    duplicateFormulasPrevented: number;
    verificationNotice: string;
  };
  groundingSources?: { title: string; uri: string }[];
  scientificVerificationLedger?: {
    verifiedConstants: {
      name: string;
      symbol: string;
      standardValue: string;
      unit: string;
      sourceCitation: string;
      verified: boolean;
    }[];
    verificationSummary: string;
  };
}
