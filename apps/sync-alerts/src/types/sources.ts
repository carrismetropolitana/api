/* * */

import { type Alert } from '@carrismetropolitana/api-types/alerts';

/* * */

export type AlertInformedEntitySource = Alert['informed_entity'][number] & { line_id?: string };

export type BackofficeAlertSource = Omit<Alert, 'id' | 'informed_entity'> & {
	alert_id: string
	informed_entity: AlertInformedEntitySource[]
};
