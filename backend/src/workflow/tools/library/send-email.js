import BaseAction from './BaseAction.js';
import nodemailer from 'nodemailer';

class SendEmail extends BaseAction {
  constructor() {
    super('sendEmail');
  }
  async execute(params, inputData, workflowEngine) {
    this.validateParams(params);

    const toEmail = params.to.match(/<(.+)>/)?.[1] || params.to;

    try {
      const baseEmail = process.env.SMTP_USER;
      const [username, domain] = baseEmail.split("@");
      const workflowEmail = `workflow-${workflowEngine.workflowId}@${domain}`;

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 465,
        secure: true,
        auth: {
          user: baseEmail,
          pass: process.env.SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: workflowEmail,
        to: toEmail,
        subject: params.subject,
        text: params.isHtml ? undefined : params.body,
        html: params.isHtml ? params.body : undefined,
      });

      return this.formatOutput({
        success: true,
        content: params,
        messageId: info.messageId,
        error: null,
      });
    } catch (error) {
      console.error("Error sending email:", error);
      return this.formatOutput({
        success: false,
        content: params,
        messageId: null,
        error: error.message,
      });
    }
  }
  validateParams(params) {
    if (!params.to || !params.subject || !params.body) {
      throw new Error('To, subject, and body are required for sending an email');
    }
  }
}

export default new SendEmail();