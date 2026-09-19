// Review comments ride inside the document (on nodes and pages) so they share
// the revision, merge and history story of everything else. No database table.
import { z } from 'zod';
import type { DesignDocument } from './schema';

export const commentAuthors = ['human', 'agent'] as const;
export const commentSchema = z.object({
  id: z.string().min(1).max(120).regex(/^[a-zA-Z0-9_-]+$/),
  text: z.string().trim().min(1).max(2000),
  author: z.enum(commentAuthors),
  createdAt: z.iso.datetime(),
  resolved: z.boolean().optional(),
});
export const commentsSchema = z.array(commentSchema).max(50);
export type DesignComment = z.infer<typeof commentSchema>;
export interface CommentLocation extends DesignComment { pageId: string; pageName: string; nodeId?: string; nodeName?: string }

/** Every comment in reading order (page by page, page comments before node comments). */
export function listComments(document: DesignDocument, options: { unresolved?: boolean } = {}): CommentLocation[] {
  const rows: CommentLocation[] = [];
  for (const page of document.pages) {
    for (const comment of page.comments ?? []) rows.push({ ...comment, pageId: page.id, pageName: page.name });
    for (const node of page.nodes) for (const comment of node.comments ?? []) rows.push({ ...comment, pageId: page.id, pageName: page.name, nodeId: node.id, nodeName: node.name });
  }
  return options.unresolved ? rows.filter(comment => !comment.resolved) : rows;
}
export const unresolvedCount = (comments: readonly DesignComment[] | undefined) => comments?.filter(comment => !comment.resolved).length ?? 0;

/** Mutates in place: appends a comment to a node or a page and returns it. */
export function addComment(document: DesignDocument, target: { nodeId?: string; pageId?: string }, input: { id?: string; text: string; author: DesignComment['author']; createdAt?: string }): DesignComment {
  const comment: DesignComment = { id: input.id ?? crypto.randomUUID(), text: input.text.trim(), author: input.author, createdAt: input.createdAt ?? new Date().toISOString() };
  if (!comment.text) throw new Error('Comment text is empty');
  if (listComments(document).some(existing => existing.id === comment.id)) throw new Error(`Comment ${comment.id} already exists`);
  const holder = target.nodeId ? document.pages.flatMap(page => page.nodes).find(node => node.id === target.nodeId) : target.pageId ? document.pages.find(page => page.id === target.pageId) : undefined;
  if (!holder) throw new Error(target.nodeId ? 'Unknown node' : target.pageId ? 'Unknown page' : 'Comment needs a nodeId or a pageId');
  holder.comments = [...(holder.comments ?? []), comment];
  if (holder.comments.length > 50) throw new Error('At most 50 comments per layer or page; resolve and remove old ones');
  return comment;
}
/** Mutates in place: marks a comment resolved (or reopens it) wherever it lives. */
export function setCommentResolved(document: DesignDocument, commentId: string, resolved = true): DesignComment {
  for (const page of document.pages) for (const holder of [page, ...page.nodes]) {
    const comment = holder.comments?.find(item => item.id === commentId);
    if (comment) { if (resolved) comment.resolved = true; else delete comment.resolved; return comment; }
  }
  throw new Error('Unknown comment');
}
