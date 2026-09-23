/* * */

import { SERVERDB } from '@carrismetropolitana/api-services/SERVERDB';
import { SERVERDB_KEYS } from '@carrismetropolitana/api-settings';
import { type Date as NetworkDate } from '@carrismetropolitana/api-types/network';
import { sortCollator } from '@carrismetropolitana/api-utils';
import LOGGER from '@helperkits/logger';
import TIMETRACKER from '@helperkits/timer';
import { labDb } from '@tmlmobilidade/go-interfaces-labdb';
import { type DemandByAgencyByDay, type DemandByAgencyByMonth, type DemandByLineByDay, type TopDemandByAgency } from '@tmlmobilidade/go-types-performance';
import { Dates } from '@tmlmobilidade/go-utils-dates';

/* * */

const VALID_APEX_VALIDATION_STATUSES = [0, 4, 5, 6];

const VALID_APEX_VALIDATION_STATUSES_SQL = VALID_APEX_VALIDATION_STATUSES
	.map(String)
	.map(status => `'${status}'`)
	.join(', ');

const CM_AGENCY_IDS = ['LA77N', 'BNA17', 'YA15B', 'A2L1N'] as const;

const CM_AGENCY_IDS_SQL = CM_AGENCY_IDS
	.map(id => `'${id}'`)
	.join(', ');

const AGENCY_ID_TO_CODE: Record<(typeof CM_AGENCY_IDS)[number], string> = {
	A2L1N: '44',
	BNA17: '42',
	LA77N: '41',
	YA15B: '43',
};

const DEMAND_START_DATE = 20240101;

const PASSENGER_DEMAND_DEFINITION = 'passenger-demand-v2';

/* * */

type DayType = '1' | '2' | '3';
type HolidayFlag = '0' | '1';
type PeriodCode = '1' | '2' | '3';

interface DayMeta {
	day_type: DayType
	holiday: HolidayFlag
	notes: string | null
	period: PeriodCode
}

interface AgencyDayRow {
	agency_id: string
	operational_date: number
	qty: number
}

interface LineDayRow {
	line_id: string
	operational_date: number
	qty: number
}

/* * */

const formatDayKey = (operationalDate: number): string => {
	const value = String(operationalDate);
	return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
};

const formatMonthKey = (operationalDate: number): string => {
	const value = String(operationalDate);
	return `${value.slice(0, 4)}-${value.slice(4, 6)}`;
};

const toDayType = (value: string | undefined, operationalDate: number): DayType => {
	if (value === '1' || value === '2' || value === '3') return value;
	if (value === 'weekday') return '1';
	if (value === 'saturday') return '2';
	if (value === 'sunday_holiday') return '3';

	const dayKey = formatDayKey(operationalDate);
	const date = new Date(`${dayKey}T12:00:00`);
	const dayOfWeek = date.getDay();
	if (dayOfWeek === 0) return '3';
	if (dayOfWeek === 6) return '2';
	return '1';
};

const toPeriod = (value: string | undefined): PeriodCode => {
	if (value === '1' || value === '2' || value === '3') return value;
	return '1';
};

const toHoliday = (value: boolean | string | undefined): HolidayFlag => {
	if (value === true || value === '1') return '1';
	return '0';
};

const buildDayMetaLookup = (dates: NetworkDate[]): Map<string, DayMeta> => {
	const lookup = new Map<string, DayMeta>();

	for (const date of dates) {
		const rawId = String(date.id);
		const dayKey = rawId.includes('-')
			? rawId
			: formatDayKey(Number(rawId));
		const operationalDate = Number(dayKey.replaceAll('-', ''));

		lookup.set(dayKey, {
			day_type: toDayType(String(date.day_type), operationalDate),
			holiday: toHoliday(date.holiday),
			notes: date.description || null,
			period: toPeriod(date.period_id),
		});
	}

	return lookup;
};

const getDayMeta = (lookup: Map<string, DayMeta>, operationalDate: number): DayMeta => {
	const dayKey = formatDayKey(operationalDate);
	return lookup.get(dayKey) ?? {
		day_type: toDayType(undefined, operationalDate),
		holiday: '0',
		notes: null,
		period: '1',
	};
};

const findMaxRecord = (entries: Array<{ date: string, qty: number }>): { date: string, qty: number } => {
	let best = entries[0] ?? { date: '', qty: 0 };

	for (const entry of entries) {
		if (entry.qty > best.qty) best = entry;
	}

	return best;
};

/* * */

export const demandMetrics = async () => {
	//

	LOGGER.title(`Sync Demand Metrics`);
	const globalTimer = new TIMETRACKER();

	const generatedAt = new Date(Dates.now('Europe/Lisbon').unix_milliseconds);

	//
	// Load calendar metadata used to enrich day-level demand docs

	const datesTxt = await SERVERDB.get(SERVERDB_KEYS.NETWORK.DATES) as string | null;
	const networkDates: NetworkDate[] = datesTxt ? JSON.parse(datesTxt) : [];
	const dayMetaLookup = buildDayMetaLookup(networkDates);

	if (!networkDates.length) {
		LOGGER.info('No NETWORK.DATES found in SERVERDB; day metadata will use weekday defaults.');
	}

	//
	// Agency demand by operational day (pre-aggregated, CM agencies only)

	LOGGER.info('Querying ClickHouse for demand by agency by day...');
	const agencyTimer = new TIMETRACKER();

	const agencyDayRows = await labDb.queryFromString<AgencyDayRow>(`
		SELECT
			agency_id,
			operational_date,
			qty
		FROM performance.demand_by_agency_by_operational_date FINAL
		WHERE agency_id IN (${CM_AGENCY_IDS_SQL})
			AND operational_date >= ${DEMAND_START_DATE}
		ORDER BY agency_id, operational_date
	`);

	LOGGER.info(`Fetched ${agencyDayRows.length} agency-day rows (${agencyTimer.get()})`);

	const agencyDayDocsByCode = new Map<string, DemandByAgencyByDay>();
	const agencyMonthTotals = new Map<string, Map<string, number>>();
	const totalDayTotals = new Map<string, number>();
	const totalMonthTotals = new Map<string, number>();

	for (const code of Object.values(AGENCY_ID_TO_CODE)) {
		agencyDayDocsByCode.set(code, {
			data: {},
			description: `Aggregated passenger demand for agency ${code}`,
			generated_at: generatedAt,
			metric: 'demand_by_agency_by_day',
			properties: { agency_id: code },
		});
		agencyMonthTotals.set(code, new Map());
	}

	for (const row of agencyDayRows) {
		const agencyCode = AGENCY_ID_TO_CODE[row.agency_id as keyof typeof AGENCY_ID_TO_CODE];
		if (!agencyCode) continue;

		const dayKey = formatDayKey(row.operational_date);
		const monthKey = formatMonthKey(row.operational_date);
		const qty = Number(row.qty);
		const dayMeta = getDayMeta(dayMetaLookup, row.operational_date);

		const dayDoc = agencyDayDocsByCode.get(agencyCode);
		if (dayDoc) {
			dayDoc.data[dayKey] = {
				day_type: dayMeta.day_type,
				holiday: dayMeta.holiday,
				notes: dayMeta.notes,
				period: dayMeta.period,
				qty,
			};
		}

		const monthMap = agencyMonthTotals.get(agencyCode);
		if (monthMap) {
			monthMap.set(monthKey, (monthMap.get(monthKey) ?? 0) + qty);
		}

		totalDayTotals.set(dayKey, (totalDayTotals.get(dayKey) ?? 0) + qty);
		totalMonthTotals.set(monthKey, (totalMonthTotals.get(monthKey) ?? 0) + qty);
	}

	const agencyDayDocs = Array
		.from(agencyDayDocsByCode.values())
		.sort((a, b) => sortCollator.compare(a.properties.agency_id, b.properties.agency_id));

	const agencyMonthDocs: DemandByAgencyByMonth[] = agencyDayDocs.map((dayDoc) => {
		const agencyCode = dayDoc.properties.agency_id;
		const monthMap = agencyMonthTotals.get(agencyCode) ?? new Map();
		const data: DemandByAgencyByMonth['data'] = {};

		for (const [monthKey, qty] of Array.from(monthMap.entries()).sort((a, b) => sortCollator.compare(a[0], b[0]))) {
			data[monthKey] = { qty };
		}

		return {
			data,
			description: `Aggregated passenger demand for agency ${agencyCode}`,
			generated_at: generatedAt,
			metric: 'demand_by_agency_by_month',
			properties: { agency_id: agencyCode },
		};
	});

	const topDemandDoc: TopDemandByAgency = {
		data: {
			agencies: {},
			total: {
				day: findMaxRecord(Array.from(totalDayTotals.entries()).map(([date, qty]) => ({ date, qty }))),
				month: findMaxRecord(Array.from(totalMonthTotals.entries()).map(([date, qty]) => ({ date, qty }))),
			},
		},
		description: 'Top day and month with highest passenger count overall and per agency',
		generated_at: generatedAt,
		metric: 'top_demand_by_agency',
	};

	for (const agencyCode of Object.values(AGENCY_ID_TO_CODE)) {
		const dayDoc = agencyDayDocsByCode.get(agencyCode);
		const monthMap = agencyMonthTotals.get(agencyCode) ?? new Map();

		const dayEntries = Object.entries(dayDoc?.data ?? {}).map(([date, info]) => ({
			date,
			qty: info.qty,
		}));
		const monthEntries = Array.from(monthMap.entries()).map(([date, qty]) => ({ date, qty }));

		topDemandDoc.data.agencies[agencyCode] = {
			day: findMaxRecord(dayEntries),
			month: findMaxRecord(monthEntries),
		};
	}

	//
	// Line demand by operational day (dims aggregate + recent gap from validations)

	LOGGER.info('Querying ClickHouse for demand by line by day...');
	const lineTimer = new TIMETRACKER();

	const lineDayRowsFromDims = await labDb.queryFromString<LineDayRow>(`
		SELECT
			line_id,
			operational_date,
			sum(accepted_validations_qty) AS qty
		FROM performance.passenger_demand_by_dimensions_by_day FINAL
		WHERE agency_id IN (${CM_AGENCY_IDS_SQL})
			AND definition_version = '${PASSENGER_DEMAND_DEFINITION}'
			AND operational_date >= ${DEMAND_START_DATE}
			AND line_id != ''
		GROUP BY line_id, operational_date
		ORDER BY line_id, operational_date
	`);

	const maxDimsOperationalDate = lineDayRowsFromDims.reduce(
		(max: number, row: LineDayRow) => Math.max(max, Number(row.operational_date)),
		0,
	);

	let lineDayRowsFromValidations: LineDayRow[] = [];

	if (maxDimsOperationalDate > 0) {
		lineDayRowsFromValidations = await labDb.queryFromString<LineDayRow>(`
			SELECT
				assumeNotNull(line_id) AS line_id,
				operational_date,
				count() AS qty
			FROM simplified_apex.validations FINAL
			WHERE agency_id IN (${CM_AGENCY_IDS_SQL})
				AND validation_status IN (${VALID_APEX_VALIDATION_STATUSES_SQL})
				AND operational_date > ${maxDimsOperationalDate}
				AND line_id IS NOT NULL
				AND line_id != ''
			GROUP BY line_id, operational_date
			ORDER BY line_id, operational_date
		`);
	}

	LOGGER.info(`Fetched ${lineDayRowsFromDims.length} line-day rows from dims and ${lineDayRowsFromValidations.length} from validations gap (${lineTimer.get()})`);

	const lineDayDocsById = new Map<string, DemandByLineByDay>();

	for (const row of [...lineDayRowsFromDims, ...lineDayRowsFromValidations]) {
		const lineId = String(row.line_id);
		if (!lineId) continue;

		if (!lineDayDocsById.has(lineId)) {
			lineDayDocsById.set(lineId, {
				data: {},
				description: `Aggregated passengers for the line ${lineId}`,
				generated_at: generatedAt,
				metric: 'demand_by_line_by_day',
				properties: { line_id: lineId },
			});
		}

		const dayKey = formatDayKey(Number(row.operational_date));
		const dayMeta = getDayMeta(dayMetaLookup, Number(row.operational_date));
		const lineDoc = lineDayDocsById.get(lineId);

		if (lineDoc) {
			lineDoc.data[dayKey] = {
				day_type: dayMeta.day_type,
				holiday: dayMeta.holiday,
				notes: dayMeta.notes,
				period: dayMeta.period,
				qty: Number(row.qty),
			};
		}
	}

	const lineDayDocs = Array
		.from(lineDayDocsById.values())
		.sort((a, b) => sortCollator.compare(a.properties.line_id, b.properties.line_id));

	//
	// Persist Metric docs in the same shape previously synced from Mongo

	await SERVERDB.set(SERVERDB_KEYS.METRICS.DEMAND.BY_AGENCY.DAY, JSON.stringify(agencyDayDocs));
	LOGGER.success(`Updated ${SERVERDB_KEYS.METRICS.DEMAND.BY_AGENCY.DAY} (${agencyDayDocs.length} agencies)`);

	await SERVERDB.set(SERVERDB_KEYS.METRICS.DEMAND.BY_AGENCY.MONTH, JSON.stringify(agencyMonthDocs));
	LOGGER.success(`Updated ${SERVERDB_KEYS.METRICS.DEMAND.BY_AGENCY.MONTH} (${agencyMonthDocs.length} agencies)`);

	await SERVERDB.set(SERVERDB_KEYS.METRICS.DEMAND.BY_LINE, JSON.stringify(lineDayDocs));
	LOGGER.success(`Updated ${SERVERDB_KEYS.METRICS.DEMAND.BY_LINE} (${lineDayDocs.length} lines)`);

	await SERVERDB.set(SERVERDB_KEYS.METRICS.DEMAND.BY_AGENCY.RECORDS, JSON.stringify([topDemandDoc]));
	LOGGER.success(`Updated ${SERVERDB_KEYS.METRICS.DEMAND.BY_AGENCY.RECORDS}`);

	LOGGER.terminate(`Sync Demand Metrics complete (${globalTimer.get()})`);

	//
};
