import axios from "axios";


interface OutgoingEmail {
  to: string[],
  sender: string,
}

interface TemplatedOutgoingEmail<Type> extends OutgoingEmail {
  template_id: string;
  template_data: Type;
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

export const sendForgotUserNameEmail = async (toEmail: string, userName: string, firstName: string, lastName: string, schoolName: string) => {
  const invitationEmail: ForgotUserNameEmail = {
    to: [toEmail],
    sender: SENDER_EMAIL,
    template_id: FORGOT_USERNAME_TEMPLATE_ID,
    template_data: {
      username: userName,
      first_name: firstName,
      last_name: lastName,
      school_name: schoolName,
      action_url: LUNCH_SYSTEM_BASE_URL + "/login",
    },
  };

  return await axios.post(SEND_EMAIL_API_URL, invitationEmail, {
    headers: SEND_EMAIL_HTTP_HEADER,
  });
}


export const sendForgotPasswordEmail = async (toEmail: string, forgotLoginId: string, firstName: string, lastName: string, schoolName: string) => {
  const invitationEmail: ForgotPwdEmail = {
    to: [toEmail],
    sender: SENDER_EMAIL,
    template_id: FORGOT_PWD_TEMPLATE_ID,
    template_data: {
      first_name: firstName,
      last_name: lastName,
      school_name: schoolName,
      action_url: LUNCH_SYSTEM_BASE_URL + "/forgot/" + forgotLoginId,
    },
  };

  return await axios.post(SEND_EMAIL_API_URL, invitationEmail, {
    headers: SEND_EMAIL_HTTP_HEADER,
  });
}
