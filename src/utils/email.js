import { Resend } from "resend";
import logger from "../logger.js";

const sendEmail = async (html, emailId, subject) => {
  const resend = new Resend(`${process.env.RESEND_API_KEY}`);
  try {
    const { error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: emailId,
      subject,
      html,
    });
    if (error?.message) {
      throw error.message;
    } else {
      logger.info(`Onboarding Email sent to ${emailId}`);
    }
  } catch (error) {
    logger.error(`Error sending email: ${error}`);
  }
};

const getRegisterEmailTemplate = (name) => {
  return `
    Hi ${name},
    <br/>
    Welcome to VideoTube!
    <br/>
    We are glad to have you on board.
    <br/>
    Thanks,
    <br/>
    VideoTube Team
  `;
};

export { sendEmail, getRegisterEmailTemplate };
