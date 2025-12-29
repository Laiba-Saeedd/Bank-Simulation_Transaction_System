// emailLayout.js

export const emailHeader = () => `
    <table width="100%" style="background:#ffffff;border-radius:8px;">
      <tr>
        <td style="padding:20px;text-align:center;">
          <img 
            src="cid:hblLogo" 
            alt="HBL Bank" 
            style="height:50px; display:block; margin:0 auto 10px auto;"
            />

          <h2 style="margin:0;color:#1a73e8;  align="center" ">HBL Bank Notification</h2>
          <p style="margin:5px 0;color:#666;font-size:14px;  align="center" ">
            Secure & Trusted Banking Services
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:20px;">
`;

export const emailFooter = () => `
        </td>
      </tr>
      <tr>
        <td style="padding:20px;background:#f5f7fa;text-align:center;font-size:12px;color:#777;">
          <p style="margin:4px 0;">
            📍 HBL Bank, Main Branch, Islamabad, Pakistan
          </p>
          <p style="margin:4px 0;">
            📧 support@hblbank.com | ☎ +92-300-1234567
          </p>
          <p style="margin-top:10px;color:#999;">
            This is an automated email. Please do not reply.
          </p>
        </td>
      </tr>
    </table>
`;
