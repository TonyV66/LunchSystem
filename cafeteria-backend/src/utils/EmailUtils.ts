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

const SENDER_EMAIL = "micscafeteria@micscougars.com";
const SEND_EMAIL_API_URL = "https://api.smtp2go.com/v3/email/send";
const EMAIL_API_KEY = "api-5A2E22DD1EFF426C8F8B59EC1A3DE132";

const LUNCH_SYSTEM_BASE_URL = "https://hotlunch.micscougars.com";

const SEND_EMAIL_HTTP_HEADER = {
  "Content-Type": "application/json",
  Accept: "application/json",
  "X-Smtp2go-Api-Key": EMAIL_API_KEY,
};

export const sendInvitationEmail = async (toEmail: string, firstName: string, lastName: string, school: SchoolEntity) => {
  const invitationEmail: ReportEmail = {
    to: [toEmail],
    sender: SENDER_EMAIL,
    subject: `Invitation to Join ${school.name} Lunch System`,
    html_body: `
      <html>
        <body>
          <h2>Welcome to the School Lunch System</h2>
          <p>Dear ${firstName} ${lastName},</p>
          <p>You have been invited to create an account on the ${school.name} lunch system.</p>
          <p>To get started, please follow these steps:</p>
          <ol>
            <li>Go to <a href="https://hotlunch.micscougars.com/register">https://hotlunch.micscougars.com/register</a></li>
            <li>Use the school registration code: <strong>${school.registrationCode}</strong></li>
            <li>Use the email address: <strong>${toEmail}</strong></li>
          </ol>
          <p>Once you complete the registration process, you'll be able to access the lunch system and manage your account.</p>
          <p>If you have any questions, please contact the school administration.</p>
          <p>Best regards,<br>${school.name} Administration</p>
        </body>
      </html>
    `,
    text_body: `
      Welcome to the School Lunch System
      
      Dear ${firstName} ${lastName},
      
      You have been invited to create an account on the ${school.name} lunch system.
      
      To get started, please follow these steps:
      
      1. Go to https://hotlunch.micscougars.com/register
      2. Use the school registration code: ${school.registrationCode}
      3. Use the email address: ${toEmail}
      
      Once you complete the registration process, you'll be able to access the lunch system and manage your account.
      
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

  const result =  await axios.post(SEND_EMAIL_API_URL, forgotPasswordEmail, {
    headers: SEND_EMAIL_HTTP_HEADER,
  });
  console.log(result);
  return result;
}

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
