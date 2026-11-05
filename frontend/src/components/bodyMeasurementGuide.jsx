export default function BodyMeasurementGuide({ sex }) {
  const female = sex === 'FEMALE';
  return <figure className="assessment-body-guide">
    <img className="assessment-body-image" src={female ? '/images/body-measurements-female.png' : '/images/body-measurements.png'} width="1024" height="1536" alt={`Ilustração do corpo ${female ? 'feminino' : 'masculino'} de frente e de costas em cinza, com linhas em coral indicando as regiões de medição.`} />
    <figcaption>Referência das regiões de medição</figcaption>
  </figure>;
}
