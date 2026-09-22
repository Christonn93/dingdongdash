export function normalizePhoneNumber(raw: string): string {
	return raw.replace(/\D/g, "");
}

export async function hashPhoneNumber(normalized: string): Promise<string> {
	const data = new TextEncoder().encode(normalized);
	const digest = await crypto.subtle.digest("SHA-256", data);
	return Array.from(new Uint8Array(digest))
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
}

interface ContactsManager {
	select: (
		properties: string[],
		options?: { multiple?: boolean }
	) => Promise<Array<{ tel?: string[]; name?: string }>>;
}

type NavigatorWithContacts = Navigator & {
	contacts?: ContactsManager;
};

function getContactsPicker(): ContactsManager | null {
	return (navigator as NavigatorWithContacts).contacts ?? null;
}

/** Returns hashed phone numbers from the device address book, or null if the
 * Contact Picker API is unavailable (Safari / desktop browsers). */
export async function readContactPhoneHashes(): Promise<string[] | null> {
	const picker = getContactsPicker();
	if (picker === null) {
		return null;
	}

	const contacts = await picker.select(["tel"], {
		multiple: true,
	});

	const normalizedNumbers = contacts.flatMap((contact) =>
		(contact.tel ?? [])
			.map(normalizePhoneNumber)
			.filter((normalized) => normalized.length > 0)
	);

	const hashes = await Promise.all(normalizedNumbers.map(hashPhoneNumber));
	return [...new Set(hashes)];
}
