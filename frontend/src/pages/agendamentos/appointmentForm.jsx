import { useState } from 'react';
import { api } from '../../lib/api';
import { businessDateTime, businessDateTimeToIso, nextBusinessHour } from '../../lib/businessDate';
const PRE_REGISTRATION = '__pre_registration__';

export default function AppointmentForm({ clients, clientsLoading, appointment, onClose, onSaved }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [selectedClientId, setSelectedClientId] = useState(appointment?.clientId || (appointment ? PRE_REGISTRATION : ''));
  const selectableClients = clients.filter((client) => client.status !== 'INACTIVE' || client.id === appointment?.clientId);
  const appointmentLocalDateTime = appointment ? businessDateTime(appointment.startsAt) : nextBusinessHour();
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
            guestName: values.guestName.trim().toLocaleUpperCase('pt-BR'),
            guestPhone: values.guestPhone.trim(),
          }
          : { clientId: selectedClientId, guestName: null, guestPhone: null }),
        startsAt: businessDateTimeToIso(values.appointmentDate, values.appointmentTime),
        durationMinutes: Number(values.durationMinutes),
        type: values.type.trim(),
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
    <label className="field appointment-modal-full-field">Aluno
      <select className="appointment-student-select"
        required
        value={selectedClientId}
        disabled={clientsLoading}
        onChange={(event) => setSelectedClientId(event.target.value)}
      >
        <option value="" disabled>{clientsLoading ? 'Carregando alunos…' : 'Selecione um aluno'}</option>
        {selectableClients.map((client) => <option key={client.id} value={client.id}>{client.name}{client.status === 'INACTIVE' ? ' (inativo)' : client.status === 'PRE_REGISTERED' ? ' (pré-cadastro)' : ''}</option>)}
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
      <label className="field full-field">Motivo
        <input name="type" required maxLength={100} defaultValue={appointment?.type || ''} placeholder="Ex.: Treino ou avaliação física" />
      </label>
      {appointment && <label className="field">Status
        <select name="status" defaultValue={appointment.status}>
          <option value="PENDING_CONFIRMATION">Pendente de confirmação</option>
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

