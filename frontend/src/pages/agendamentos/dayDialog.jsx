import { Link } from 'react-router-dom';
import { useModal } from '../../components/useModal';
import { businessDayLabel as label, businessTimeLabel as time, appointmentPeriod } from '../../lib/businessDate';
import { appointmentStatusLabels as statuses, appointmentStatusClasses as classes } from './appointmentStatus';

export default function DayDialog({ day, items, onClose, onEdit, onCancel, onConfirm, busyId, error }) {
  const ref = useModal();
  return <dialog ref={ref} className="appointment-modal day-appointments-modal" aria-labelledby="day-dialog-title" onCancel={onClose}>
    <header className="appointment-modal-heading"><h2 id="day-dialog-title">{label(day)}</h2><button type="button" className="icon-button" aria-label="Fechar" onClick={onClose}>×</button></header>
    <div className="appointment-modal-fields table-wrap">{error && <p role="alert" className="catalog-error">{error}</p>}<table className="data-table day-appointments-table">
      <thead><tr>{['Horário', 'Aluno', 'Motivo', 'Período', 'Status', 'Ações'].map((title) => <th scope="col" key={title}>{title}</th>)}</tr></thead>
      <tbody>{items.map((item) => <tr key={item.id}>
        <td>{time(item.startsAt)}</td>
        <td className="student-name">{item.client ? <Link to={'/clientes/' + item.clientId + '/visaogeral'}>{item.client.name}</Link> : item.guestName}{item.guestPhone && <small className="appointment-notes">{item.guestPhone}</small>}</td>
        <td><span className="appointment-reason">{item.type}</span>{item.notes && <small className="appointment-notes">{item.notes}</small>}</td>
        <td className="appointment-period">{appointmentPeriod(item.startsAt, item.durationMinutes)}</td>
        <td><span className={'status ' + classes[item.status]}>{statuses[item.status]}</span></td>
        <td><div className="appointment-actions"><button type="button" className="button button-outline" onClick={() => onEdit(item)}>Editar</button>
          {item.status === 'PENDING_CONFIRMATION' && <button type="button" className="button button-primary" disabled={Boolean(busyId)} onClick={() => onConfirm(item)}>Confirmar</button>}
          {['SCHEDULED', 'PENDING_CONFIRMATION'].includes(item.status) && <button type="button" className="button button-outline" disabled={Boolean(busyId)} onClick={() => onCancel(item)}>Cancelar</button>}
        </div></td>
      </tr>)}</tbody>
    </table>{!items.length && <p className="catalog-empty">Nenhum agendamento neste dia.</p>}</div>
  </dialog>;
}
