import { useState } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import type { DesignComment } from '../shared/comments';
import { Field } from './ui';

type Props = {
  comments: readonly DesignComment[] | undefined;
  placeholder: string;
  onAdd: (text: string) => void;
  onResolve: (commentId: string, resolved: boolean) => void;
};
/** Review thread for one layer or page; comments live in the document. */
export function CommentsPanel({ comments = [], placeholder, onAdd, onResolve }: Props) {
  const [draft, setDraft] = useState('');
  const open = comments.filter(comment => !comment.resolved).length;
  const submit = () => { const text = draft.trim(); if (!text) return; onAdd(text); setDraft(''); };
  return (
    <section className="comments-panel">
      <h3>Comments{open ? ` (${open} open)` : ''}</h3>
      {comments.length > 0 && (
        <ul className="comment-list">
          {comments.map(comment => (
            <li key={comment.id} className={`comment ${comment.resolved ? 'resolved' : ''}`}>
              <div className="comment-meta"><span className={`comment-author ${comment.author}`}>{comment.author}</span><time dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleString()}</time></div>
              <p>{comment.text}</p>
              <button type="button" className="button small" onClick={() => onResolve(comment.id, !comment.resolved)} title={comment.resolved ? 'Reopen comment' : 'Resolve comment'}>
                {comment.resolved ? <><RotateCcw size={14} /> Reopen</> : <><Check size={14} /> Resolve</>}
              </button>
            </li>
          ))}
        </ul>
      )}
      <Field label="New comment">
        <textarea value={draft} placeholder={placeholder} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') { event.preventDefault(); submit(); } }} />
      </Field>
      <div className="button-row"><button type="button" className="button small" disabled={!draft.trim()} onClick={submit}>Add comment</button></div>
    </section>
  );
}
