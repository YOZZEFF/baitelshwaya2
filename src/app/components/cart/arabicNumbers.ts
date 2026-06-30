const arabicToEnglish: Record<string, string> = {
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
};

const englishToArabic: Record<string, string> = {
  "0": "٠", "1": "١", "2": "٢", "3": "٣", "4": "٤",
  "5": "٥", "6": "٦", "7": "٧", "8": "٨", "9": "٩",
};

export function parseArabicNumber(s: string): number {
  return parseInt(s.replace(/[٠-٩]/g, (d) => arabicToEnglish[d]), 10) || 0;
}

export function toArabicNumber(num: number): string {
  return String(num).replace(/[0-9]/g, (d) => englishToArabic[d]);
}
