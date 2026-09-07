import { SERVERDB } from '@carrismetropolitana/api-services';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { TopDemandLinesByAgency } from '@carrismetropolitana/api-types/metrics';
import { DemandByLineByDay } from '@tmlmobilidade/go-types-performance';

export async function getDemandByLine(lineId: string) {
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.METRICS.DEMAND.BY_LINE) as string;
	if (!allItemsTxt) return null;
	const allItems = JSON.parse(allItemsTxt);
	return allItems.filter((item: DemandByLineByDay) => item.properties.line_id === lineId);
}

export async function getTopDemandLinesByAgency() {
	const topN = 3;
	const allItemsTxt = await SERVERDB.get(SERVERDB_KEYS.METRICS.DEMAND.BY_LINE) as string;
	if (!allItemsTxt) return null;

	const allItems: DemandByLineByDay[] = JSON.parse(allItemsTxt);
	const agencies = ['41', '42', '43', '44'];

	const result: TopDemandLinesByAgency = {
		lastUpdated: allItems?.[0]?.generated_at ?? null,
		topLinesByAgency: {},
	};

	for (const prefix of agencies) {
		const agencyLines = allItems.filter(m =>
			m.properties?.line_id?.startsWith(prefix.charAt(1)),
		);

		if (!agencyLines.length) {
			result.topLinesByAgency[prefix] = { lines: [] };
			continue;
		}

		const withTotals: { line: DemandByLineByDay, totalQty: number }[] = agencyLines.map((line) => {
			const entries = Object.values(line.data || {});
			const totalQty = entries.reduce((sum, info: { qty: number }) => sum + (info.qty ?? 0), 0);
			return { line, totalQty };
		});

		const topLines: DemandByLineByDay[] = withTotals
			.sort((a, b) => b.totalQty - a.totalQty)
			.slice(0, topN)
			.map(x => x.line);

		result.topLinesByAgency[prefix] = { lines: topLines };
	}

	return result;
}
