import { MessageBoxClient } from '@bsv/message-box-client';
import { IdentityClient, LookupResolver, RegistryClient, WalletInterface } from '@bsv/sdk';
import type { WalletPermissionsManager } from '@bsv/wallet-toolbox-client';

type RegistrySource =
  | WalletPermissionsManager
  | WalletInterface;

const registryClientCache = new WeakMap<object, RegistryClient>();
const identityClientCache = new WeakMap<
  WalletPermissionsManager,
  Map<string, IdentityClient>
>();
const messageBoxClientCache = new WeakMap<
  WalletPermissionsManager,
  Map<string, MessageBoxClient>
>();
const lookupResolverCache = new Map<string, LookupResolver>();

export const getRegistryClient = (
  source?: RegistrySource | null,
  adminOriginator?: string
): RegistryClient | null => {
  if (!source) return null;

  let client = registryClientCache.get(source);
  if (!client) {
    client = new RegistryClient(source, undefined, adminOriginator);
    registryClientCache.set(source, client);
  }
  return client;
};

export const getIdentityClient = (
  manager?: WalletPermissionsManager | null,
  adminOriginator?: string
): IdentityClient | null => {
  if (!manager) return null;
  const cacheKey = adminOriginator ?? '';

  let bucket = identityClientCache.get(manager);
  if (!bucket) {
    bucket = new Map();
    identityClientCache.set(manager, bucket);
  }

  let client = bucket.get(cacheKey);
  if (!client) {
    client = new IdentityClient(manager, undefined, adminOriginator);
    bucket.set(cacheKey, client);
  }
  return client;
};

type MessageBoxConfig = {
  walletClient?: WalletPermissionsManager | null;
  host: string;
  originator?: string;
  enableLogging?: boolean;
};

type LookupResolverConfig = {
  networkPreset: 'mainnet' | 'testnet' | 'local';
}

export const getMessageBoxClient = ({
  walletClient,
  host,
  originator,
  enableLogging = false,
}: MessageBoxConfig): MessageBoxClient | null => {
  if (!walletClient) return null;
  const cacheKey = `${host}|${originator ?? ''}|${enableLogging ? '1' : '0'}`;

  let bucket = messageBoxClientCache.get(walletClient);
  if (!bucket) {
    bucket = new Map();
    messageBoxClientCache.set(walletClient, bucket);
  }

  let client = bucket.get(cacheKey);
  if (!client) {
    client = new MessageBoxClient({
      walletClient,
      host,
      originator,
      enableLogging,
    });
    bucket.set(cacheKey, client);
  }
  return client;
};

export const getLookupResolver = async ({
  networkPreset
}: LookupResolverConfig): Promise<LookupResolver | null> => {
  const cacheKey = networkPreset;

  let resolver = lookupResolverCache.get(cacheKey);
  if (!resolver) {
    resolver = new LookupResolver({
      networkPreset
    });
    lookupResolverCache.set(cacheKey, resolver);
  }

  return resolver;
}
