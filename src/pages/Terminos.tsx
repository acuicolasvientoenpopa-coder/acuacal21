export default function Terminos() {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "20px 0" }}>
      <h2>📜 Términos y Condiciones</h2>
      <p style={{ fontSize: 12, color: "var(--text2)", marginBottom: 24 }}>
        Versión: 1.0 — 9 de junio de 2026 &middot; Responsable: Acuícolas Viento en Popa
      </p>

      <Section title="1. Aceptación de los Términos">
        Al acceder, registrarse o utilizar la plataforma AcuiCal (en adelante, "la Plataforma"), el usuario acepta los
        presentes Términos y Condiciones de Uso. Si no está de acuerdo, no debe utilizar la Plataforma.
      </Section>

      <Section title="2. Definiciones">
        <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.8 }}>
          <li><strong>Plataforma</strong>: aplicación web AcuiCal, incluyendo todas sus funcionalidades, API, contenido y documentación asociada.</li>
          <li><strong>Usuario</strong>: persona física o jurídica que se registra y utiliza la Plataforma.</li>
          <li><strong>Suscripción</strong>: plan de pago recurrente (mensual o anual) que otorga acceso a funcionalidades premium.</li>
          <li><strong>Datos del Usuario</strong>: toda información ingresada por el Usuario en la Plataforma.</li>
          <li><strong>Contenido</strong>: fórmulas, tablas, referencias científicas, textos y material informativo provisto por la Plataforma.</li>
        </ul>
      </Section>

      <Section title="3. Registro y Cuenta">
        3.1. Para utilizar la Plataforma, el Usuario debe registrarse proporcionando información veraz y completa.<br />
        3.2. El Usuario es responsable de mantener la confidencialidad de sus credenciales de acceso.<br />
        3.3. El Usuario es responsable de toda actividad que ocurra bajo su cuenta.<br />
        3.4. El Usuario debe notificar inmediatamente cualquier uso no autorizado de su cuenta.
      </Section>

      <Section title="4. Planes y Suscripciones">
        <p><strong>4.1. Plan Free</strong> — Acceso gratuito a funcionalidades básicas. Limitado a 1 finca, 1 usuario y 3 estanques. Sin exportaciones avanzadas.</p>
        <p><strong>4.2. Plan Professional</strong> — $20 USD/mes o $200 USD/año. Fincas ilimitadas, estanques ilimitados. Exportaciones PDF y Excel. Soporte por correo.</p>
        <p><strong>4.3. Plan Enterprise</strong> — $50 USD/mes o $500 USD/año. Hasta 5 usuarios. Soporte prioritario. API pública.</p>
        <p><strong>4.4. Facturación</strong> — Pagos via ONVO Pay. Renovación automática. Cancelación desde el panel.</p>
        <p><strong>4.5. Reembolsos</strong> — Reembolso completo dentro de los primeros 14 días. Sin reembolsos prorrateados después.</p>
      </Section>

      <Section title="5. Propiedad Intelectual">
        La Plataforma, su código fuente, diseño y marca son propiedad exclusiva de Acuícolas Viento en Popa. Las fórmulas y
        contenido técnico están basados en fuentes académicas (FAO, Boyd, Timmons, Noga, entre otras). Los Datos del Usuario
        son propiedad exclusiva del Usuario.
      </Section>

      <Section title="6. Privacidad y Protección de Datos">
        6.1. La Plataforma almacena datos localmente y en servidores designados.<br />
         6.2. Los datos de pago son procesados exclusivamente por ONVO Pay.<br />
        6.3. No vendemos, alquilamos ni compartimos datos con terceros sin consentimiento.<br />
        6.4. Utilizamos cookies funcionales necesarias para el servicio.
      </Section>

      <Section title="7. Limitación de Responsabilidad">
        <p style={{ color: "var(--danger)", fontWeight: 700 }}>IMPORTANTE: La Plataforma es una herramienta de asistencia técnica. No reemplaza el criterio profesional.</p>
        No nos responsabilizamos por pérdidas económicas, muertes de animales, pérdida de cosechas o decisiones basadas
        exclusivamente en los datos de la Plataforma. La Plataforma se proporciona "tal cual".
      </Section>

      <Section title="8. Uso Aceptable">
        El Usuario se compromete a no utilizar la Plataforma para actividades ilegales, no acceder a cuentas ajenas,
        no realizar ingeniería inversa ni almacenar información que viole derechos de terceros.
      </Section>

      <Section title="9. Suspensión y Cancelación">
        Podemos suspender o cancelar cuentas que violen estos Términos. El Usuario puede cancelar su cuenta en cualquier
        momento. Los datos serán eliminados en un plazo máximo de 30 días.
      </Section>

      <Section title="10. Modificaciones de los Términos">
        Estos Términos pueden ser modificados. Los usuarios activos serán notificados por correo con al menos 15 días de
        anticipación. El uso continuado constituye aceptación.
      </Section>

      <Section title="11. Legislación Aplicable">
        Para usuarios en América Latina: se rigen por las leyes del país del Usuario. En ausencia de legislación específica,
        se aplicarán las leyes de la República Argentina.
      </Section>

      <Section title="12. Contacto">
        Correo: <a href="mailto:acuicolasvientoenpopa@gmail.com">acuicolasvientoenpopa@gmail.com</a><br />
        WhatsApp: disponible para usuarios con suscripción activa
      </Section>

      <p style={{ fontSize: 11, color: "var(--text3)", textAlign: "center", marginTop: 40 }}>
        Acuícolas Viento en Popa — Construyendo el ecosistema tecnológico para la acuicultura latinoamericana.
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 15, marginBottom: 8 }}>{title}</h3>
      <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}
