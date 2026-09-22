import {
	Fields,
	getContactsAsync,
	requestPermissionsAsync,
} from "expo-contacts";
import { CryptoDigestAlgorithm, digestStringAsync } from "expo-crypto";

export function normalizePhoneNumber(raw: string): string {
	return raw.replace(/\D/g, "");
}

export async function hashPhoneNumber(normalized: string): Promise<string> {
	const digest = await digestStringAsync(
		CryptoDigestAlgorithm.SHA256,
		normalized
	);
	return digest.toLowerCase();
}

export async function readContactPhoneHashes(): Promise<string[]> {
	const permission = await requestPermissionsAsync();
	if (!permission.granted) {
		throw new Error("Contacts permission is required to find friends");
	}

	const { data } = await getContactsAsync({
		fields: [Fields.PhoneNumbers],
	});

	const normalizedNumbers = data.flatMap((contact) =>
		(contact.phoneNumbers ?? [])
			.map((phone) => phone.number)
			.filter((number): number is string => Boolean(number))
			.map(normalizePhoneNumber)
			.filter((normalized) => normalized.length > 0)
	);

	const hashes = await Promise.all(normalizedNumbers.map(hashPhoneNumber));
	return [...new Set(hashes)];
}
