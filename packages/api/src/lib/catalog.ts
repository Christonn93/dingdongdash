export type CatalogItem =
	| {
			kind: "points_pack";
			productId: string;
			points: number;
			priceCents: number;
			currency: string;
	  }
	| {
			kind: "time_shield";
			productId: string;
			points: number;
			priceCents: number;
			currency: string;
	  }
	| {
			kind: "cosmetic";
			productId: string;
			priceCents: number;
			currency: string;
	  };

export const PURCHASE_CATALOG: CatalogItem[] = [
	{
		currency: "USD",
		kind: "points_pack",
		points: 500,
		priceCents: 299,
		productId: "points_500",
	},
	{
		currency: "USD",
		kind: "points_pack",
		points: 1200,
		priceCents: 599,
		productId: "points_1200",
	},
	{
		currency: "USD",
		kind: "points_pack",
		points: 3500,
		priceCents: 1299,
		productId: "points_3500",
	},
	{
		currency: "USD",
		kind: "time_shield",
		points: 0,
		priceCents: 399,
		productId: "time_shield_3",
	},
];

export function lookupProduct(productId: string): CatalogItem | undefined {
	return PURCHASE_CATALOG.find((item) => item.productId === productId);
}
