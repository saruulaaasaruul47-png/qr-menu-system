const rows = (data) =>
  Object.entries(data)
    .map(([key, value]) => `<tr><td style="padding:6px 10px;color:#667085">${key}</td><td style="padding:6px 10px">${value}</td></tr>`)
    .join("");

export const renderEmail = ({ subject, template, data }) => `
  <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#101828">
    <h2 style="margin:0 0 12px">${subject}</h2>
    <p style="margin:0 0 16px;color:#475467">QR Menu notification: ${template}</p>
    <table style="border-collapse:collapse;width:100%;border:1px solid #eaecf0">
      ${rows(data)}
    </table>
  </div>
`;
