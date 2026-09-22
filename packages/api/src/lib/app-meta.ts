export const APP_NAME = "DingDongDitch";

export const AUTHOR_NAME = "Christopher Tønnesland";

export const AUTHOR_EMAIL = "christopher.tonnesland@email.com";

export const APP_FINGERPRINT = "fba6e6e0-8d90-4049-a45b-7db4364eec89";

export const COPYRIGHT_YEAR = 2026;

export const COPYRIGHT = `© ${COPYRIGHT_YEAR} ${AUTHOR_NAME}`;

export const APP_META = {
	author: AUTHOR_NAME,
	authorEmail: AUTHOR_EMAIL,
	copyright: COPYRIGHT,
	fingerprint: APP_FINGERPRINT,
	name: APP_NAME,
} as const;
