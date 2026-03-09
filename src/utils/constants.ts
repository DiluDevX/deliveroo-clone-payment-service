export const VALIDATION_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[A-Z])(?=.*\d).{8,}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
} as const;

export const PRISMA_CODE = {
  NOT_FOUND: 'P2025',
  CONFLICT: 'P2002',
} as const;

export enum EnvironmentEnum {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}
