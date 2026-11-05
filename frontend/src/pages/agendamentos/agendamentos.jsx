import { useState } from 'react';
import { api } from '../../lib/api';
import { useCollection } from '../../lib/useCollection';
import AppointmentCalendar from './appointmentCalendar';
import { AppointmentDialog, CancelAppointmentDialog } from './appointmentDialogs';

export default function Agendamentos() {
  const [revision, setRevision] = useState(0);
  const [dialog, setDialog] = useState(null);
  const { data: clients = [], loading: clientsLoading, error: clientsError } = useCollection('/clients');
  const [busyId, setBusyId] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelError, setCancelError] = useState('');

  const [confirmError, setConfirmError] = useState('');



  async function confirm(appointment) {
    if (busyId) return;
    setBusyId(appointment.id); setConfirmError('');
    try {
      await api(`/appointments/${appointment.id}`, { method: 'PATCH', body: { status: 'SCHEDULED' } });
      setRevision((value) => value + 1);
    } catch (error) { setConfirmError(error.message); } finally { setBusyId(''); }
  }
  async function cancel(appointment) {
    if (busyId) return;
    setBusyId(appointment.id);
    setCancelError('');
    try {
      await api(`/appointments/${appointment.id}`, { method: 'PATCH', body: { status: 'CANCELLED' } });
      setRevision((value) => value + 1);
      setCancelTarget(null);
    } catch (requestError) {
      setCancelError(requestError.message);
    } finally {
      setBusyId('');
    }
  }

  return <main className="workspace appointments-page">
    <header className="page-heading">
      <div><h1>Agendamentos</h1><p>Crie, consulte e atualize os atendimentos dos seus alunos.</p></div>
      <button type="button" className="button button-primary" onClick={() => setDialog({ appointment: null })}>+ Novo agendamento</button>
    </header>
    {clientsError && <p role="alert" className="catalog-error">{clientsError}</p>}

    <AppointmentCalendar confirmError={confirmError} onClearError={() => setConfirmError('')} revision={revision} onConfirm={confirm} onEdit={(appointment) => setDialog({ appointment })} onCancel={(appointment) => { setCancelError(''); setCancelTarget(appointment); }} busyId={busyId} />
    {cancelTarget && <CancelAppointmentDialog appointment={cancelTarget} busy={Boolean(busyId)} error={cancelError} onClose={() => setCancelTarget(null)} onConfirm={() => cancel(cancelTarget)} />}
    {dialog && <AppointmentDialog
      key={dialog.appointment?.id || 'new'}
      appointment={dialog.appointment}
      clients={clients || []}
      clientsLoading={clientsLoading}
      onClose={() => setDialog(null)}
      onSaved={() => { setDialog(null); setRevision((value) => value + 1); }}
    />}
  </main>;
}
