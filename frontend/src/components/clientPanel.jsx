import '../pages/clientForm.css';

export default function ClientPanel({ children, className = '' }) {
  return <main className={`workspace client-editor-page ${className}`}><div className="client-editor-card client-profile-panel">{children}</div></main>;
}
