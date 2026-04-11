/**
 * AEM environment configuration.
 * Maps hostnames to their corresponding AEM Cloud Service publish URLs.
 *
 * To add a new environment: push a new entry with its hostnames and publish URL.
 * To add a new hostname to an existing env: add to the corresponding hostnames array.
 */

export enum ENV {
  PROD = 'prod',
  STAGE = 'stage',
  DEV = 'dev',
  RDE = 'rde',
}

export type EnvConfig = {
  /** List of exact hostnames that map to this environment. Empty array = fallback (last entry only). */
  env: ENV;
  publishUrl: string;
  hostnames: string[];
};

/**
 * Centralised environment config.
 * Each entry maps a set of hostnames to an environment and its AEM publish base URL.
 * Entries are checked in order — first match wins. The last entry (hostnames: []) is the fallback.
 */
export const ENV_CONFIG: EnvConfig[] = [
  {
    // TODO: replace with actual prod hostnames and publish URL when provisioned
    env: ENV.PROD,
    publishUrl: 'https://publish-p000000-e0000000.adobeaemcloud.com',
    hostnames: [
      // 'www.example.com',
      // 'main--<repo>--<org>.aem.live',
      // 'main--<repo>--<org>.aem.page',
    ],
  },
  {
    // TODO: replace with actual stage hostnames and publish URL when provisioned
    env: ENV.STAGE,
    publishUrl: 'https://publish-p000000-e0000000.adobeaemcloud.com',
    hostnames: [
      // 'stage--<repo>--<org>.aem.page',
      // 'stage--<repo>--<org>.aem.live',
    ],
  },
  {
    // TODO: replace with actual dev hostnames and publish URL when provisioned
    env: ENV.DEV,
    publishUrl: 'https://publish-p000000-e0000000.adobeaemcloud.com',
    hostnames: [
      // 'dev--<repo>--<org>.aem.live',
      // 'dev--<repo>--<org>.aem.page',
    ],
  },
  {
    env: ENV.RDE,
    publishUrl: 'https://publish-p152536-e2003150.adobeaemcloud.com',
    hostnames: [
      'localhost',
      'author-p152536-e2003150.adobeaemcloud.com',
      'main--capella-hotel-group-poc--capella-hotel-group.aem.live',
      'main--capella-hotel-group-poc--capella-hotel-group.aem.page',
    ],
  },
  {
    // Fallback: unknown hostname → warn and use RDE publish
    env: ENV.RDE,
    publishUrl: 'https://publish-p152536-e2003150.adobeaemcloud.com',
    hostnames: [],
  },
];
