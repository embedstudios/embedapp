'use client';

import { useEffect, useRef, useState } from 'react';

/* Voice to text with the browser's own speech recognition (Chrome, Edge,
   Safari; Firefox has none, and `supported` is false there). Words appear as
   they are spoken (`onText` gets everything said so far, interim words
   included). It stops by itself after a pause of about two and a half seconds,
   or when stop() is called, and then `onDone` gets the final words. Nothing is
   recorded or stored here: the browser streams the audio to its own speech
   service and hands back text. */
type Rec = { lang: string; continuous: boolean; interimResults: boolean; start(): void; stop(): void; abort(): void;
  onresult: ((e: any) => void) | null; onend: (() => void) | null; onerror: ((e: any) => void) | null };

export function useDictation({ onText, onDone }: { onText: (spoken: string) => void; onDone: (spoken: string) => void }) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const rec = useRef<Rec | null>(null);
  const said = useRef('');
  const quiet = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cb = useRef({ onText, onDone });
  cb.current = { onText, onDone };

  useEffect(() => {
    const w = window as any;
    setSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
    return () => { if (quiet.current) clearTimeout(quiet.current); rec.current?.abort(); };
  }, []);

  const stop = () => { if (quiet.current) clearTimeout(quiet.current); rec.current?.stop(); };
  const start = () => {
    const w = window as any;
    const C = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!C || listening) return;
    const r: Rec = new C();
    r.lang = navigator.language || 'en-IN';
    r.continuous = true;
    r.interimResults = true;
    said.current = '';
    setError('');
    r.onresult = (e: any) => {
      let text = '';
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      said.current = text.replace(/\s+/g, ' ').trim();
      cb.current.onText(said.current);
      if (quiet.current) clearTimeout(quiet.current);
      quiet.current = setTimeout(() => r.stop(), 2500);
    };
    r.onerror = (e: any) => {
      const code = e?.error;
      if (code === 'not-allowed' || code === 'service-not-allowed') setError('The microphone is blocked for this site. Allow it in the browser’s address bar, then try again.');
      else if (code === 'audio-capture') setError('No microphone was found.');
      else if (code !== 'no-speech' && code !== 'aborted') setError('Voice input stopped. Try again, or type instead.');
    };
    r.onend = () => {
      if (quiet.current) clearTimeout(quiet.current);
      setListening(false);
      rec.current = null;
      cb.current.onDone(said.current);
    };
    rec.current = r;
    try { r.start(); setListening(true); quiet.current = setTimeout(() => r.stop(), 8000); }
    catch { setError('Voice input couldn’t start. Try again, or type instead.'); }
  };
  return { supported, listening, error, start, stop };
}
