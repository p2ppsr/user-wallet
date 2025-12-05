type TrustedCertifier = { identityKey: string; trust: number };

/**
 * Picks the registry entry with the highest trust score using the wallet's trusted certifiers.
 */
export function selectMostTrusted<T extends { registryOperator?: string }>(
  results: readonly T[],
  trustedCertifiers: readonly TrustedCertifier[]
): T | null {
  if (!results.length || !trustedCertifiers.length) return results[0] ?? null;

  let winner: T | null = null;
  let topTrust = -Infinity;

  for (const item of results) {
    const trust = trustedCertifiers.find(c => c.identityKey === item.registryOperator)?.trust ?? 0;
    if (!winner || trust > topTrust) {
      winner = item;
      topTrust = trust;
    }
  }

  return winner ?? null;
}
