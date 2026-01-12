/**
 * Server Config Interface
 * 
 * This defines the shape of configuration returned by /.netlify/functions/config
 * and ensures type safety across the app.
 */

export interface ServerConfig {
  // Meta Pixel Configuration
  metaPixelId: string;
  headerCodeBlock: string;
  capiEnabled: boolean;
  
  // MailerLite Configuration
  mailerLiteApiKeyPresent: boolean;
  mailerLiteGroupId?: string;
  
  // Wistia and Cal.com (could be extended to server-side in future)
  wistiaEmbedCode?: string;
  calComBookingSlug?: string;
  
  // Thumbnail URL for global control
  homeThumbnailUrl?: string;
  
  // Additional metadata
  version?: string;
}

export const defaultServerConfig: ServerConfig = {
  metaPixelId: '',
  headerCodeBlock: '',
  capiEnabled: false,
  mailerLiteApiKeyPresent: false,
  mailerLiteGroupId: undefined,
  wistiaEmbedCode: undefined,
  calComBookingSlug: undefined,
  homeThumbnailUrl: undefined,
};

export class ConfigError extends Error {
  constructor(message: string, public code: string = 'CONFIG_ERROR') {
    super(message);
    this.name = 'ConfigError';
  }
}

export function validateServerConfig(data: unknown): ServerConfig {
  if (!data || typeof data !== 'object') {
    throw new ConfigError('Invalid config: expected an object', 'INVALID_TYPE');
  }

  const config = data as Record<string, unknown>;

  // Validate required fields
  if (typeof config.metaPixelId !== 'string') {
    throw new ConfigError('metaPixelId must be a string', 'INVALID_FIELD');
  }

  if (typeof config.headerCodeBlock !== 'string') {
    throw new ConfigError('headerCodeBlock must be a string', 'INVALID_FIELD');
  }

  if (typeof config.capiEnabled !== 'boolean') {
    throw new ConfigError('capiEnabled must be a boolean', 'INVALID_FIELD');
  }

  if (typeof config.mailerLiteApiKeyPresent !== 'boolean') {
    throw new ConfigError('mailerLiteApiKeyPresent must be a boolean', 'INVALID_FIELD');
  }

  return {
    metaPixelId: config.metaPixelId,
    headerCodeBlock: config.headerCodeBlock,
    capiEnabled: config.capiEnabled,
    mailerLiteApiKeyPresent: config.mailerLiteApiKeyPresent,
    mailerLiteGroupId: config.mailerLiteGroupId as string | undefined,
    wistiaEmbedCode: config.wistiaEmbedCode as string | undefined,
    calComBookingSlug: config.calComBookingSlug as string | undefined,
    homeThumbnailUrl: config.homeThumbnailUrl as string | undefined,
    version: config.version as string | undefined,
  };
}
