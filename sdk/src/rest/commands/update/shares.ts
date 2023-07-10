import type { DirectusShare } from '../../../schema/share.js';
import type { ApplyQueryFields, Query } from '../../../types/index.js';
import type { RestCommand } from '../../types.js';
import { queryToParams } from '../../utils/query-to-params.js';

export type UpdateShareOutput<
	Schema extends object,
	TQuery extends Query<Schema, Item>,
	Item = DirectusShare<Schema>
> = ApplyQueryFields<Schema, Item, TQuery['fields']>;

/**
 * Update multiple existing shares.
 * @param keys
 * @param item
 * @param query
 * @returns Returns the share objects for the updated shares.
 */
export const updatedShares =
	<Schema extends object, TQuery extends Query<Schema, DirectusShare<Schema>>>(
		keys: DirectusShare<Schema>['id'][],
		item: Partial<DirectusShare<Schema>>,
		query?: TQuery
	): RestCommand<UpdateShareOutput<Schema, TQuery>[], Schema> =>
	() => ({
		path: `/shares`,
		params: queryToParams(query ?? {}),
		body: JSON.stringify({ keys, data: item }),
		method: 'PATCH',
	});

/**
 * Update an existing share.
 * @param key
 * @param item
 * @param query
 * @returns Returns the share object for the updated share.
 */
export const updateShare =
	<Schema extends object, TQuery extends Query<Schema, DirectusShare<Schema>>>(
		key: DirectusShare<Schema>['id'],
		item: Partial<DirectusShare<Schema>>,
		query?: TQuery
	): RestCommand<UpdateShareOutput<Schema, TQuery>, Schema> =>
	() => ({
		path: `/shares/${key}`,
		params: queryToParams(query ?? {}),
		body: JSON.stringify(item),
		method: 'PATCH',
	});
