import { useModal } from '../../components/useModal';
import { businessDateKey as dateKey, businessDayLabel as dateLabel, businessTimeLabel as timeLabel } from '../../lib/businessDate';
import AppointmentForm from './appointmentForm';

export function AppointmentDialog({ appointment, clients, clientsLoading, onClose, onSaved }) {
  const dialogRef = useModal();
  return <dialog ref={dialogRef} className="appointment-modal" aria-labelledby="appointment-modal-title" onCancel={onClose}>
    <header className="appointment-modal-heading">
      <span className="appointment-modal-icon" aria-hidden="true">◷</span>
      <h2 id="appointment-modal-title">{appointment ? 'Editar agendamento' : 'Novo agendamento'}</h2>
      <button type="button" className="icon-button appointment-modal-close" aria-label="Fechar" onClick={onClose}>×</button>
    </header>
    <div className="appointment-modal-fields">
      <AppointmentForm clients={clients} clientsLoading={clientsLoading} appointment={appointment} onClose={onClose} onSaved={onSaved} />
    </div>
  </dialog>;
}

export function CancelAppointmentDialog({ appointment, busy, error, onClose, onConfirm }) {
  const dialogRef = useModal();
  return <dialog ref={dialogRef} className="appointment-modal appointment-confirm" aria-labelledby="cancel-appointment-title" aria-describedby="cancel-appointment-description" onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}>
    <div className="appointment-confirm-content">
      <h2 id="cancel-appointment-title">Deseja cancelar este agendamento?</h2>
      <p id="cancel-appointment-description"><strong className="appointment-confirm-name">{appointment.client?.name || appointment.guestName}</strong><span>{dateLabel(dateKey(appointment.startsAt))} às {timeLabel(appointment.startsAt)}</span></p>
      {error && <p role="alert" className="catalog-error">{error}</p>}
    </div>
    <footer className="appointment-modal-footer">
      <button type="button" className="button appointment-modal-cancel" autoFocus disabled={busy} onClick={onClose}>Voltar</button>
      <button type="button" className="button button-primary" disabled={busy} onClick={onConfirm}>{busy ? 'Cancelando…' : 'Sim, cancelar'}</button>
    </footer>
  </dialog>;
}
