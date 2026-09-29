import { common } from './common.js';
import { quiz } from './quiz.js';
import { tools } from './tools.js';
import { graph } from './graph.js';
import { conceptDicts } from '@shared/logic/concepts.js';
import concepts from '../../content/concepts.json';

// câu khái niệm đã duyệt (D27): chữ nằm trong concepts.json, khoá sinh tự động cho cả hai bản
const conceptLabels = Object.fromEntries([...new Set(concepts.map(c => c.chapter))].map(ch => [`c${ch.slice(2)}q.concept`, 'Concepts (why?)']));

export const en = { ...common, ...quiz, ...tools, ...graph, ...conceptLabels, ...conceptDicts(concepts).en };
