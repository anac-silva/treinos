import '../pages/clientForm.css';

export default function ClientPanel({ children }) {
  return <main className="workspace client-editor-page"><div className="client-editor-card client-profile-panel">{children}</div></main>;
}
