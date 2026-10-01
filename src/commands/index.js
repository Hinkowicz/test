import * as giveaway from './giveaway.js';
import * as link from './link.js';

export const commands = new Map([giveaway, link].map((c) => [c.data.name, c]));
