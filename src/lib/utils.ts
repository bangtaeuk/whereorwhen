/**
 * 국가 코드를 이모지 플래그로 변환
 * @example countryCodeToEmoji("JP") → "🇯🇵"
 */
export function countryCodeToEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

/**
 * 월 번호를 한국어 월 이름으로 변환
 * @example getMonthName(3) → "3월"
 */
export function getMonthName(month: number): string {
  return `${month}월`;
}
