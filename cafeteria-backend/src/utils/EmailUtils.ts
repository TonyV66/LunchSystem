import axios from "axios";
import SchoolEntity from "../entity/SchoolEntity";


interface OutgoingEmail {
  to: string[],
  sender: string,
}

interface ReportEmail extends OutgoingEmail {
  subject: string;
  html_body: string;
  text_body: string;
  attachments: Array<{
    filename: string;
    fileblob: string;
    mimetype: string;
  }>;
}

const SENDER_EMAIL = process.env.SENDER_EMAIL ?? "micscafeteria@micscougars.com";
const EMAIL_API_KEY = process.env.EMAIL_API_KEY;
const LUNCH_SYSTEM_BASE_URL = process.env.LUNCH_SYSTEM_BASE_URL;
const SEND_EMAIL_API_URL = "https://api.smtp2go.com/v3/email/send";


const SEND_EMAIL_HTTP_HEADER = {
  "Content-Type": "application/json",
  Accept: "application/json",
  "X-Smtp2go-Api-Key": EMAIL_API_KEY,
};

export const sendInvitationEmail = async (
  toEmail: string,
  school: SchoolEntity,
  invitationId: string,
) => {
  const registrationUrl = `${LUNCH_SYSTEM_BASE_URL}/register/${invitationId}`;
  const invitationEmail: ReportEmail = {
    to: [toEmail],
    sender: SENDER_EMAIL,
    subject: `Invitation to Join ${school.name} Lunch System`,
    html_body: `
      <html>
        <body>
          <h2>Welcome to the School Lunch System</h2>
          <p>To complete the email verification & registration process, please follow these steps:</p>
          <ol>
            <li>Go to <a href="${registrationUrl}">${registrationUrl}</a></li>
            <li>Set your password</li>
          </ol>
          <p>If you have any questions, please contact the school administration.</p>
          <p>Best regards,<br>${school.name} Administration</p>
        </body>
      </html>
    `,
    text_body: `
      Welcome to the School Lunch System
            
      To complete the email verification & registration process, please follow these steps:
      
      1. Go to ${registrationUrl}
      2. Set your password
      
      If you have any questions, please contact the school administration.
      
      Best regards,
      ${school.name} Administration
    `,
    attachments: []
  };

  return await axios.post(SEND_EMAIL_API_URL, invitationEmail, {
    headers: SEND_EMAIL_HTTP_HEADER,
  });
}

export const sendSchoolAccessGrantedEmail = async (
  toEmail: string,
  school: SchoolEntity,
) => {
  const accessEmail: ReportEmail = {
    to: [toEmail],
    sender: SENDER_EMAIL,
    subject: `Access Granted to ${school.name} Lunch System`,
    html_body: `
      <html>
        <body>
          <h2>Welcome to the School Lunch System</h2>
          <p>Your account has been granted access to the ${school.name} lunch system.</p>
          <p>You can log in at <a href="${LUNCH_SYSTEM_BASE_URL}/login">${LUNCH_SYSTEM_BASE_URL}/login</a> using your existing credentials.</p>
          <p>If you have any questions, please contact the school administration.</p>
          <p>Best regards,<br>${school.name} Administration</p>
        </body>
      </html>
    `,
    text_body: `
      Welcome to the School Lunch System
      
      Your account has been granted access to the ${school.name} lunch system.
      
      You can log in at ${LUNCH_SYSTEM_BASE_URL}/login using your existing credentials.
      
      If you have any questions, please contact the school administration.
      
      Best regards,
      ${school.name} Administration
    `,
    attachments: []
  };

  return await axios.post(SEND_EMAIL_API_URL, accessEmail, {
    headers: SEND_EMAIL_HTTP_HEADER,
  });
};

export const sendForgotPasswordEmail = async (toEmail: string, forgotLoginId: string, firstName: string, lastName: string) => {
  const forgotPasswordEmail: ReportEmail = {
    to: [toEmail],
    sender: SENDER_EMAIL,
    subject: `Lunch System Password Reset Request`,
    html_body: `
      <html>
        <body>
          <h2>Password Reset Request</h2>
          <p>Dear ${firstName} ${lastName},</p>
          <p>To reset your password, please click the link below:</p>
          <p><a href="${LUNCH_SYSTEM_BASE_URL}/forgot/${forgotLoginId}">Reset Password</a></p>
          <p>If you did not request this password reset, please ignore this email.</p>
          <p>This link will expire in 24 hours.</p>
          <p>Best regards,<br>Lunch System Administrator</p>
        </body>
      </html>
    `,
    text_body: `
      Password Reset Request

      Dear ${firstName} ${lastName},

      To reset your password, please visit the following link:
      ${LUNCH_SYSTEM_BASE_URL}/forgot/${forgotLoginId}

      If you did not request this password reset, please ignore this email.

      This link will expire in 24 hours.

      Best regards,
      Lunch System Administrator
    `,
    attachments: []
  };

  return await axios.post(SEND_EMAIL_API_URL, forgotPasswordEmail, {
    headers: SEND_EMAIL_HTTP_HEADER,
  });
};

export const sendForgotUserNameEmail = async (toEmail: string, userNames: string[]) => {
  const forgotUsernameEmail: ReportEmail = {
    to: [toEmail],
    sender: SENDER_EMAIL,
    subject: `Lunch System Username Recovery`,
    html_body: `
      <html>
        <body>
          <h2>Username Recovery</h2>
          <p>We received a request to recover usernames associated with your email address.</p>
          <p>The following username(s) are associated with your email address:</p>
          <ul>
            ${userNames.map(username => `<li><strong>${username}</strong></li>`).join('')}
          </ul>
          <p>If you did not request this information, please ignore this email.</p>
          <p>You can use any of these usernames to log in to the lunch system.</p>
          <p>Best regards,<br>Lunch System Administrator</p>
        </body>
      </html>
    `,
    text_body: `
      Username Recovery
      
      We received a request to recover usernames associated with your email address.
      
      The following username(s) are associated with your email address:
      ${userNames.map(username => `- ${username}`).join('\n')}
      
      If you did not request this information, please ignore this email.
      
      You can use any of these usernames to log in to the lunch system.
      
      Best regards,
      Lunch System Administrator
    `,
    attachments: []
  };

  return await axios.post(SEND_EMAIL_API_URL, forgotUsernameEmail, {
    headers: SEND_EMAIL_HTTP_HEADER,
  });
}

export interface OrderReceiptMealItem {
  name: string;
  price: number;
}

export interface OrderReceiptMeal {
  date: string;
  orderedFor: string;
  total: number;
  items: OrderReceiptMealItem[];
}

const formatCurrency = (amount: number): string => `$${amount.toFixed(2)}`;

export const sendOrderReceiptEmail = async (
  toEmail: string,
  meals: OrderReceiptMeal[],
  schoolName: string,
) => {
  const mealsHtml = meals
    .map((meal) => {
      const itemsHtml = meal.items
        .map(
          (item) =>
            `<li>${item.name} — ${formatCurrency(item.price)}</li>`,
        )
        .join("");
      return `
        <div style="margin-bottom: 1.5em;">
          <h3 style="margin-bottom: 0.25em;">
            ${meal.date} — ${meal.orderedFor} — ${formatCurrency(meal.total)}
          </h3>
          <ul style="margin-top: 0.25em;">
            ${itemsHtml}
          </ul>
        </div>
      `;
    })
    .join("");

  const mealsText = meals
    .map((meal) => {
      const itemsText = meal.items
        .map((item) => `  - ${item.name}: ${formatCurrency(item.price)}`)
        .join("\n");
      return `${meal.date} — ${meal.orderedFor} — ${formatCurrency(meal.total)}\n${itemsText}`;
    })
    .join("\n\n");

  const orderTotal = meals.reduce((sum, meal) => sum + meal.total, 0);

  const receiptEmail: ReportEmail = {
    to: [toEmail],
    sender: SENDER_EMAIL,
    subject: `Lunch Order Receipt - ${schoolName}`,
    html_body: `
      <html>
        <body>
          <h2>Order Receipt</h2>
          <p>Thank you for your order from ${schoolName}.</p>
          ${mealsHtml}
          <p><strong>Order Total: ${formatCurrency(orderTotal)}</strong></p>
          <p>Best regards,<br>${schoolName} Cafeteria</p>
        </body>
      </html>
    `,
    text_body: `
Order Receipt

Thank you for your order from ${schoolName}.

${mealsText}

Order Total: ${formatCurrency(orderTotal)}

Best regards,
${schoolName} Cafeteria
    `,
    attachments: [],
  };

  return await axios.post(SEND_EMAIL_API_URL, receiptEmail, {
    headers: SEND_EMAIL_HTTP_HEADER,
  });
};

export const sendClassroomReportEmail = async (
  toEmail: string,
  teacherName: string,
  startDate: string,
  endDate: string,
  classroomReportHtml: string
) => {
  // Convert HTML to base64 for attachment
  const htmlBase64 = Buffer.from(classroomReportHtml, 'utf8').toString('base64');
  
  // Check if startDate and endDate are the same
  const isSingleDate = startDate === endDate;
  const dateDisplay = isSingleDate ? startDate : `${startDate} to ${endDate}`;
  const filenameDate = isSingleDate ? startDate : `${startDate}-${endDate}`;
  
  const reportEmail: ReportEmail = {
    to: [toEmail],
    sender: SENDER_EMAIL,
    subject: `Classroom Lunch Report - ${teacherName} - ${dateDisplay}`,
    html_body: classroomReportHtml,
    text_body: `
      Classroom Lunch Report
      
      Dear ${teacherName},
      
      Please find attached your classroom lunch report for ${dateDisplay}.
      
      Best regards,
      School Cafeteria System
    `,
    attachments: [
      {
        filename: `classroom-report-${teacherName.replace(/\s+/g, '-')}-${filenameDate}.html`,
        fileblob: htmlBase64,
        mimetype: "text/html"
      }
    ]
  };

  return await axios.post(SEND_EMAIL_API_URL, reportEmail, {
    headers: SEND_EMAIL_HTTP_HEADER,
  });
}

