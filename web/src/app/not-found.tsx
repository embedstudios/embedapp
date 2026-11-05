import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="page">
      <div className="empty">
        <strong>That page doesn’t exist</strong>
        <p><Link className="link" href="/">Back to the overview</Link></p>
      </div>
    </div>
  );
}
