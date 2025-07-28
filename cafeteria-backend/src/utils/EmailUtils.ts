import axios from "axios";


interface OutgoingEmail {
  to: string[],
  sender: string,
}

interface TemplatedOutgoingEmail<Type> extends OutgoingEmail {
  template_id: string;
  template_data: Type;
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

interface InvitationData {
  first_name: string,
  last_name: string,
  school_name: string,
  action_url: string,
}

interface ForgotPwdData {
  first_name: string,
  last_name: string,
  school_name: string,
  action_url: string,
}

interface ForgotUserNameData extends ForgotPwdData {
  username: string,
}



interface InvitationEmail extends TemplatedOutgoingEmail<InvitationData> {}
interface ForgotUserNameEmail extends TemplatedOutgoingEmail<ForgotUserNameData> {}
interface ForgotPwdEmail extends TemplatedOutgoingEmail<ForgotPwdData> {}

const INVITATION_TEMPLATE_ID = '3002623';
const FORGOT_PWD_TEMPLATE_ID = '8735737';
const FORGOT_USERNAME_TEMPLATE_ID = '9266959';

const SENDER_EMAIL = "micscafeteria@micscougars.com";
const SEND_EMAIL_API_URL = "https://api.smtp2go.com/v3/email/send";
const EMAIL_API_KEY = "api-5A2E22DD1EFF426C8F8B59EC1A3DE132";

// const LUNCH_SYSTEM_BASE_URL = "https://hotlunch.micscougars.com";
const LUNCH_SYSTEM_BASE_URL = "http://localhost:3000";

const SEND_EMAIL_HTTP_HEADER = {
  "Content-Type": "application/json",
  Accept: "application/json",
  "X-Smtp2go-Api-Key": EMAIL_API_KEY,
};

export const sendInvitationEmail = async (toEmail: string, invitationId: string, firstName: string, lastName: string, schoolName: string) => {
  const invitationEmail: InvitationEmail = {
    to: [toEmail],
    sender: SENDER_EMAIL,
    template_id: INVITATION_TEMPLATE_ID,
    template_data: {
      first_name: firstName,
      last_name: lastName,
      school_name: schoolName,
      action_url: LUNCH_SYSTEM_BASE_URL + "/register/" + invitationId,
    },
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
  pdfBuffer: Buffer
) => {
  // Convert PDF buffer to base64
  const pdfBase64 = pdfBuffer.toString('base64');
  
  // Check if startDate and endDate are the same
  const isSingleDate = startDate === endDate;
  const dateDisplay = isSingleDate ? startDate : `${startDate} to ${endDate}`;
  const filenameDate = isSingleDate ? startDate : `${startDate}-${endDate}`;
  
  const reportEmail: ReportEmail = {
    to: [toEmail],
    sender: SENDER_EMAIL,
    subject: `Classroom Lunch Report - ${teacherName} - ${dateDisplay}`,
    html_body: `
      <html>
        <body>
          <h2>Classroom Lunch Report</h2>
          <p>Dear ${teacherName},</p>
          <p>Please find attached the lunch report for your classroom on ${dateDisplay}.</p>
          <p>Best regards,<br>School Cafeteria System</p>
        </body>
      </html>
    `,
    text_body: `
      Classroom Lunch Report
      
      Dear ${teacherName},
      
      Please find attached the lunch report for your classroom on ${dateDisplay}.
      
      Best regards,
      School Cafeteria System
    `,
    attachments: [
      {
        filename: `classroom-report-${teacherName.replace(/\s+/g, '-')}-${filenameDate}.pdf`,
        fileblob: pdfBase64,
        mimetype: "application/pdf"
      }
    ]
  };

  return await axios.post(SEND_EMAIL_API_URL, reportEmail, {
    headers: SEND_EMAIL_HTTP_HEADER,
  });
}
