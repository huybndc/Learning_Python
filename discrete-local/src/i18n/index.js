import { vi } from './vi/index.js';
import { en } from './en/index.js';
import { initI18n } from '@shared/i18n/index.js';

/* Từ điển của app nạp vào lõi dùng chung (shared/i18n). */
initI18n({ vi, en });

export * from '@shared/i18n/index.js';
