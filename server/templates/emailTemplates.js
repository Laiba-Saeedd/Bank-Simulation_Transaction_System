export const welcomeEmailTemplate = (user, account) => `
    <h2 style="color: #1a73e8;">Welcome to HBL Bank, ${user.name}!</h2>
    <p>We are delighted to have you as our customer. Your account has been successfully created with the following details:</p>
    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">Account Number</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${account.account_number}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">Account Type</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${account.account_type}</td>
      </tr>
       <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">Balance</td>
        <td style="padding: 8px; border: 1px solid #ddd;">Rs.${account.balance}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">Email</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${user.contact}</td>
      </tr>
    </table>
    <p style="margin-top: 15px;">Thank you for choosing HBL Bank. We look forward to serving you!</p>
`;

export const registerEmailTemplate = (user) => {
  return `
      <h2 style="color: #007bff;">Welcome to HBL Bank, ${user.name}!</h2>
      <p>Your registration has been successfully completed.</p>
      <table style="border-collapse: collapse; margin-top: 10px;">
        <tr>
          <td style="padding: 6px; font-weight: bold;">Username:</td>
          <td style="padding: 6px;">${user.username}</td>
        </tr>
        <tr>
          <td style="padding: 6px; font-weight: bold;">Role:</td>
          <td style="padding: 6px;">${user.role}</td>
        </tr>
        <tr>
          <td style="padding: 6px; font-weight: bold;">Status:</td>
          <td style="padding: 6px;">${user.status}</td>
        </tr>
      </table>
      <p style="margin-top: 20px;">
        Your registration with HBL Bank has been completed successfully.
        To begin using our banking services, please log in & visit branch to create an account.
      </p>
  `;
};

export const depositEmailTemplate = (account, amount) => `
    <h3 style="color: #1a73e8;">Deposit Confirmation</h3>
    <p>Dear ${account.name},</p>
    <p>We are pleased to inform you that a deposit of <strong>Rs.${amount}</strong> has been successfully made to your account.</p>
    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">Date/Time</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${new Date().toLocaleString()}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">Updated Balance</td>
        <td style="padding: 8px; border: 1px solid #ddd;">Rs.${account.balance}</td>
      </tr>
    </table>
    <p style="margin-top: 15px;">Thank you for banking with us.</p>
`;

export const withdrawalEmailTemplate = (account, amount) => `
    <h3 style="color: #1a73e8;">Withdrawal Confirmation</h3>
    <p>Dear ${account.name},</p>
    <p>A withdrawal of <strong>Rs.${amount}</strong> has been successfully made from your account.</p>
    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">Date/Time</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${new Date().toLocaleString()}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">Updated Balance</td>
        <td style="padding: 8px; border: 1px solid #ddd;">Rs.${account.balance}</td>
      </tr>
    </table>
    <p style="margin-top: 15px;">Thank you for banking with us.</p>
`;

export const transferSenderTemplate = (sender, amount, receiver) => `
    <h3 style="color: #1a73e8;">Transfer Successful</h3>
    <p>Dear ${sender.name},</p>
    <p>You have successfully transferred <strong>Rs.${amount}</strong> to <strong>${receiver.name}</strong> (Account: ${receiver.accountNumber}).</p>
    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">Date/Time</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${new Date().toLocaleString()}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">Updated Balance</td>
        <td style="padding: 8px; border: 1px solid #ddd;">Rs.${sender.balance}</td>
      </tr>
    </table>
    <p style="margin-top: 15px;">Thank you for banking with us.</p>
`;

export const transferReceiverTemplate = (receiver, amount, sender) => `
    <h3 style="color: #1a73e8;">Transfer Received</h3>
    <p>Dear ${receiver.name},</p>
    <p>You have received <strong>Rs.${amount}</strong> from <strong>${sender.name}</strong> (Account: ${sender.accountNumber}).</p>
    <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">Date/Time</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${new Date().toLocaleString()}</td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">Updated Balance</td>
        <td style="padding: 8px; border: 1px solid #ddd;">Rs.${receiver.balance}</td>
      </tr>
    </table>
    <p style="margin-top: 15px;">Thank you for banking with us.</p>
`;
export const statementEmailTemplate = ({
  userName,
  month,
}) => {
  return `
    <h2 style="color:#004b8d">Monthly Bank Statement</h2>

    <p>Dear <b>${userName}</b>,</p>

    <p>
      Please find attached your <b>bank statement</b> for the period of
      <b>${month}</b>.
    </p>

    <p>
      If you have any questions, feel free to contact our support team.
    </p>

    <br/>

    <p>Best Regards,</p>
    <p><b>HBL Digital Banking</b></p>

    <img src="cid:hblLogo" width="120" />
  `;
};
