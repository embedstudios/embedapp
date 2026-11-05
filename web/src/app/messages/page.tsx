'use client';

import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/components/AppProvider';
import { listMessages, sendMessage, subscribeMessages, type Message } from '@/lib/data';
import { Meta } from '@/components/ui';
import { msgTime } from '@/lib/format';

export default function Messages() {
  const { detail, profile, toast } = useApp();
  const d = detail!;
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    listMessages(d.project.id).then(m => alive && setMessages(m)).catch(() => alive && setMessages([]));
    const off = subscribeMessages(d.project.id, m => setMessages(xs => (xs && xs.some(x => x.id === m.id) ? xs : [...(xs || []), m])));
    return () => { alive = false; off(); };
  }, [d.project.id]);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [messages?.length]);

  const send = async () => {
    const t = draft.trim();
    if (!t || sending) return;
    setSending(true); setDraft('');
    try { await sendMessage(d.project.id, t); }
    catch { setDraft(t); toast('Message not sent. Check your connection and try again.'); }
    setSending(false);
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Messages</h1>
          <p>Talk to {d.team.map(t => t.name).join(', ') || 'the team'}. The team replies within a working day; replies show up here as they’re sent.</p>
        </div>
      </div>
      <div className="card card-flush chat">
        <div className="chat-log" aria-live="polite">
          {messages === null && <span className="spinner" style={{ alignSelf: 'center' }} />}
          {messages && !messages.length && <p className="hint center">No messages yet. Say hello — the whole team sees this thread.</p>}
          {messages?.map(m => {
            const me = !!m.authorId && m.authorId === profile?.id;
            return (
              <div key={m.id} className={'bubble' + (me ? ' me' : '')}>
                <p>{m.body}</p>
                <small><Meta parts={[me ? 'You' : m.authorName, msgTime(m.createdAt)]} /></small>
              </div>
            );
          })}
          <div ref={end} />
        </div>
        <div className="composer">
          <textarea rows={1} value={draft} aria-label="Message the team" placeholder="Message the team"
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
          <button className="btn" onClick={send} disabled={sending || !draft.trim()}>Send</button>
        </div>
      </div>
      <p className="hint">Enter sends. Shift + Enter adds a line.</p>
    </div>
  );
}
