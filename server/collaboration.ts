import { Hono } from 'hono';
import { mergeRequestSchema } from '../src/shared/collaboration-contract';
import { documentSchema } from '../src/shared/schema';
import { mergeDocuments, MergeConflict } from '../src/shared/document-merge';
import { listComments } from '../src/shared/comments';
import { projectRow, saveDocument, serializeProject, writeReceipt } from './projects';
import { origin, fail } from './security';
import type { Env } from './types';
export const collaborationRoutes = new Hono<Env>();
export { mergeRequestSchema } from '../src/shared/collaboration-contract';
collaborationRoutes.post('/:id/merge', async c => {
  const row = await projectRow(c, c.req.param('id'));
  const body = mergeRequestSchema.parse(await c.req.json());
  if (body.baseRevision > row.revision || body.base.id !== row.id || body.base.kind !== row.kind || body.document.id !== row.id || body.document.kind !== row.kind) fail(400, 'invalid_merge_base', 'Merge base must belong to this project and cannot be from a future revision.');
  const current = documentSchema.parse(JSON.parse(row.document));
  if (current.schemaVersion === 2 && body.document.schemaVersion !== 2) fail(409, 'document_upgrade_required', 'This project uses document v2. Upgrade your client and reload before merging.');
  try {
    const next = mergeDocuments(body.base, body.document, current);
    return c.json(writeReceipt(c, current, await saveDocument(c, row.id, next, row.revision)));
  } catch (error) {
    if (error instanceof MergeConflict) return c.json({ error: { code: 'merge_conflict', message: error.message, details: { paths: error.paths } } }, 409);
    throw error;
  }
});
collaborationRoutes.get('/:id/changes', async c => {
  const row = await projectRow(c, c.req.param('id'));
  const since = Number(c.req.query('since') ?? 0);
  return c.json(row.revision === since ? { revision: row.revision, unchanged: true } : { revision: row.revision, project: serializeProject(row, origin(c)) });
});
/** Review comments stored in the document; `?unresolved=1` keeps only open ones. */
collaborationRoutes.get('/:id/comments', async c => {
  const row = await projectRow(c, c.req.param('id'));
  const unresolved = ['1', 'true'].includes(c.req.query('unresolved') ?? '');
  const comments = listComments(documentSchema.parse(JSON.parse(row.document)), { unresolved });
  return c.json({ projectId: row.id, revision: row.revision, comments, counts: { total: comments.length, unresolved: comments.filter(comment => !comment.resolved).length } });
});
