// server/utils/headline.ts

/**
 * ヘッドラインから【ボートレース】プレフィックスを削除する
 * @param headline 元のヘッドライン
 * @returns 【ボートレース】が削除されたヘッドライン
 */
export function removeBoatracePrefix(headline: string): string {
  if (!headline) return headline
  
  // 文頭の【ボートレース】を削除
  return headline.replace(/^【ボートレース】/, '').trim()
}
