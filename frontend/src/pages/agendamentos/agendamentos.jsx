import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, allPages } from '../../lib/api';
import { useRemote } from '../../lib/useRemote';

const today = () => formatLocalDate(new Date());
function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
function shiftDate(value, days) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
}
function dayBounds(value, end = false) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day, end ? 23 : 0, end ? 59 : 0, end ? 59 : 0, end ? 999 : 0);
  return date.toISOString();
}
function localDateTime(value) {
  const date = new Date(value);
  return `${formatLocalDate(date)}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
function newDateTime() {
  const date = new Date();
  date.setMinutes(0, 0, 0);
  date.setHours(date.getHours() + 1);
  return localDateTime(date);
}
function dateKey(value) {
  const date = new Date(value);
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date);
}
function dateLabel(value) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full', timeZone: 'America/Sao_Paulo' }).format(new Date(`${value}T12:00:00-03:00`));
}
function timeLabel(value) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }).format(new Date(value));
}
const statusLabels = { SCHEDULED: 'Agendado', COMPLETED: 'Concluído', CANCELLED: 'Cancelado' };
const statusClasses = { SCHEDULED: 'status-booked', COMPLETED: 'status-done', CANCELLED: 'status-pending' };

const PRE_REGISTRATION = '__pre_registration__';

function AppointmentForm({ clients, clientsLoading, appointment, onClose, onSaved }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [selectedClientId, setSelectedClientId] = useState(appointment?.clientId || (appointment ? PRE_REGISTRATION : ''));
  const selectableClients = clients.filter((client) => client.status === 'ACTIVE' || client.id === appointment?.clientId);
  const appointmentLocalDateTime = appointment ? localDateTime(appointment.startsAt) : newDateTime();
  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    setBusy(true);
    setError('');
    try {
      const body = {
        ...(selectedClientId === PRE_REGISTRATION
          ? {
            clientId: null,
            guestName: values.guestName.trim(),
            guestPhone: values.guestPhone.trim(),
          }
          : { clientId: selectedClientId, guestName: null, guestPhone: null }),
        startsAt: new Date(`${values.appointmentDate}T${values.appointmentTime}`).toISOString(),
        durationMinutes: Number(values.durationMinutes),
        type: values.type,
        notes: values.notes || null,
        ...(appointment ? { status: values.status } : {}),
      };
      await api(appointment ? `/appointments/${appointment.id}` : '/appointments', {
        method: appointment ? 'PATCH' : 'POST',
        body,
      });
      onSaved();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }
  return <form onSubmit={submit} className="appointment-form">
    {error && <p role="alert" className="catalog-error">{error}</p>}
    <label className="field appointment-modal-full-field">Cliente
      <select
        required
        value={selectedClientId}
        disabled={clientsLoading}
        onChange={(event) => setSelectedClientId(event.target.value)}
      >
        <option value="" disabled>{clientsLoading ? 'Carregando clientes…' : 'Selecione um cliente'}</option>
        {selectableClients.map((client) => <option key={client.id} value={client.id}>{client.name}{client.status === 'INACTIVE' ? ' (inativo)' : ''}</option>)}
        <option value={PRE_REGISTRATION}>Pré-cadastro (nome e telefone)</option>
      </select>
    </label>
    {selectedClientId === PRE_REGISTRATION && <div className="form-layout appointment-pre-registration">
      <label className="field">Nome
        <input name="guestName" required maxLength={100} defaultValue={appointment?.guestName || ''} />
      </label>
      <label className="field">Telefone
        <input name="guestPhone" type="tel" required maxLength={40} defaultValue={appointment?.guestPhone || ''} />
      </label>
    </div>}
    <div className="form-layout">
      <label className="field">Data
        <input type="date" name="appointmentDate" required defaultValue={appointmentLocalDateTime.split('T')[0]} />
      </label>
      <label className="field">Horário
        <input type="time" name="appointmentTime" required defaultValue={appointmentLocalDateTime.split('T')[1]} />
      </label>
      <label className="field">Duração (minutos)
        <input type="number" name="durationMinutes" min="5" max="480" step="5" required defaultValue={appointment?.durationMinutes ?? 60} />
      </label>
      <label className="field full-field">Tipo de atendimento
        <input name="type" required maxLength={100} defaultValue={appointment?.type || ''} placeholder="Ex.: Treino ou avaliação física" />
      </label>
      {appointment && <label className="field">Status
        <select name="status" defaultValue={appointment.status}>
          <option value="SCHEDULED">Agendado</option>
          <option value="COMPLETED">Concluído</option>
          <option value="CANCELLED">Cancelado</option>
        </select>
      </label>}
      <label className="field full-field">Observações
        <textarea name="notes" maxLength={5000} rows="3" defaultValue={appointment?.notes || ''} />
      </label>
    </div>
    <footer className="appointment-modal-footer">
      <button type="button" className="button appointment-modal-cancel" onClick={onClose}>Fechar</button>
      <button type="submit" className="button button-primary" disabled={busy || clientsLoading || !selectedClientId}>
        {busy ? 'Salvando…' : appointment ? 'Salvar alterações' : selectedClientId === PRE_REGISTRATION ? 'Criar pré-agendamento' : 'Criar agendamento'}
      </button>
    </footer>
  </form>;
}

function AppointmentDialog({ appointment, clients, clientsLoading, onClose, onSaved }) {
  const dialogRef = useRef(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => { if (dialog?.open) dialog.close(); };
  }, []);
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

function CancelAppointmentDialog({ appointment, busy, error, onClose, onConfirm }) {
  const dialogRef = useRef(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => { if (dialog.open) dialog.close(); };
  }, []);
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
function AppointmentList({ path, revision, onEdit, onCancel, busyId, setPage }) {
  const { data, loading, error } = useRemote(path, revision);
  if (loading) return <p role="status">Carregando agendamentos…</p>;
  if (error) return <p role="alert" className="catalog-error">{error}</p>;
  if (!data.items.length) return <section className="settings-section"><p className="catalog-empty">Nenhum agendamento neste período.</p></section>;

  const days = data.items.reduce((groups, appointment) => {
    const key = dateKey(appointment.startsAt);
    (groups[key] ||= []).push(appointment);
    return groups;
  }, {});
  return <>
    {Object.entries(days).map(([day, appointments]) => <section className="settings-section schedule-day" key={day}>
      <h2 className="schedule-day-label">{dateLabel(day)}</h2>
      <div className="table-wrap schedule-table-wrap">
        <table className="data-table schedule-table">
          <thead><tr><th>Horário</th><th>Cliente</th><th>Atendimento</th><th>Duração</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody>{appointments.map((appointment) => <tr key={appointment.id}>
            <td data-label="Horário">{timeLabel(appointment.startsAt)}</td>
            <td data-label="Cliente">{appointment.client
              ? <Link to={`/clientes/${appointment.clientId}/visaogeral`}>{appointment.client.name}</Link>
              : <>{appointment.guestName}<small className="appointment-notes">Pré-cadastro · {appointment.guestPhone}</small></>}</td>
            <td data-label="Atendimento">{appointment.type}{appointment.notes && <small className="appointment-notes">{appointment.notes}</small>}</td>
            <td data-label="Duração">{appointment.durationMinutes} min</td>
            <td data-label="Status"><span className={`status ${statusClasses[appointment.status]}`}>{statusLabels[appointment.status]}</span></td>
            <td data-label="Ações"><div className="appointment-actions">
              <button type="button" className="button button-outline" onClick={() => onEdit(appointment)}>Editar</button>
              {appointment.status === 'SCHEDULED' && <button type="button" className="button button-outline" disabled={busyId === appointment.id} onClick={() => onCancel(appointment)}>{busyId === appointment.id ? 'Cancelando…' : 'Cancelar'}</button>}
            </div></td>
          </tr>)}</tbody>
        </table>
      </div>
    </section>)}
    <footer className="table-footer"><span>{data.total} agendamento(s) · Página {data.page}</span><div className="pagination">
      <button type="button" disabled={data.page === 1} onClick={() => setPage(data.page - 1)}>Anterior</button>
      <button type="button" disabled={data.page * data.pageSize >= data.total} onClick={() => setPage(data.page + 1)}>Próxima</button>
    </div></footer>
  </>;
}

export default function Agendamentos() {
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(() => shiftDate(today(), 30));
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [dialog, setDialog] = useState(null);
  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelError, setCancelError] = useState('');


  useEffect(() => {
    const controller = new AbortController();
    allPages('/clients', controller.signal).then(setClients).catch((requestError) => {
      if (requestError.name !== 'AbortError') setClientsError(requestError.message);
    }).finally(() => { if (!controller.signal.aborted) setClientsLoading(false); });
    return () => controller.abort();
  }, []);

  const params = new URLSearchParams({ page: String(page), pageSize: '100' });
  if (from) params.set('from', dayBounds(from));
  if (to) params.set('to', dayBounds(to, true));

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
      <div><h1>Agendamentos</h1><p>Crie, consulte e atualize os atendimentos dos seus clientes.</p></div>
      <button type="button" className="button button-primary" onClick={() => setDialog({ appointment: null })}>+ Novo agendamento</button>
    </header>
    <form className="toolbar appointment-filters" onSubmit={(event) => event.preventDefault()}>
      <label className="field">De<input type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} /></label>
      <label className="field">Até<input type="date" value={to} min={from || undefined} onChange={(event) => { setTo(event.target.value); setPage(1); }} /></label>
      <button type="button" className="button button-outline" onClick={() => { setFrom(today()); setTo(shiftDate(today(), 30)); setPage(1); }}>Próximos 30 dias</button>
    </form>
    {clientsError && <p role="alert" className="catalog-error">{clientsError}</p>}

    <AppointmentList path={`/appointments?${params}`} revision={revision} onEdit={(appointment) => setDialog({ appointment })} onCancel={(appointment) => { setCancelError(''); setCancelTarget(appointment); }} busyId={busyId} setPage={setPage} />
    {cancelTarget && <CancelAppointmentDialog appointment={cancelTarget} busy={Boolean(busyId)} error={cancelError} onClose={() => setCancelTarget(null)} onConfirm={() => cancel(cancelTarget)} />}
    {dialog && <AppointmentDialog
      key={dialog.appointment?.id || 'new'}
      appointment={dialog.appointment}
      clients={clients}
      clientsLoading={clientsLoading}
      onClose={() => setDialog(null)}
      onSaved={() => { setDialog(null); setRevision((value) => value + 1); }}
    />}
  </main>;
}



