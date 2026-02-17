import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

export async function sendInviteEmail(params: {
  to: string;
  customerName?: string;
  agentName: string;
  inviteUrl: string;
  senderName?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { to, customerName, agentName, inviteUrl, senderName } = params;

  const greeting = customerName ? `Hi ${customerName}` : "Hi";

  try {
    await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL || "SpecBridge <noreply@specbridge.ai>",
      to,
      subject: `You're invited to share your requirements for ${agentName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
          <div style="margin-bottom: 32px;">
            <h1 style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin: 0 0 8px;">SpecBridge</h1>
          </div>
          <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
            ${greeting},
          </p>
          <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
            ${senderName ? `${senderName} has` : "You've been"} invited you to a brief requirements conversation about <strong>${agentName}</strong>.
          </p>
          <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
            Click the link below to get started. You'll chat with an AI assistant that will help capture your needs and preferences.
          </p>
          <a href="${inviteUrl}" style="display: inline-block; background: #1a1a1a; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">
            Start Conversation
          </a>
          <p style="color: #888; font-size: 13px; line-height: 1.5; margin: 24px 0 0;">
            This link is unique to you. It typically takes 5-15 minutes.
          </p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("[sendInviteEmail] Failed:", error);
    return { success: false, error: String(error) };
  }
}

export async function sendVerificationEmail(params: {
  to: string;
  code: string;
  agentName: string;
}): Promise<{ success: boolean; error?: string }> {
  const { to, code, agentName } = params;

  try {
    await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL || "SpecBridge <noreply@specbridge.ai>",
      to,
      subject: `Your verification code: ${code}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
          <div style="margin-bottom: 32px;">
            <h1 style="font-size: 20px; font-weight: 600; color: #1a1a1a; margin: 0 0 8px;">SpecBridge</h1>
          </div>
          <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 16px;">
            Your verification code for the ${agentName} session:
          </p>
          <div style="background: #f5f5f5; border-radius: 8px; padding: 20px; text-align: center; margin: 0 0 24px;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: 6px; color: #1a1a1a;">${code}</span>
          </div>
          <p style="color: #888; font-size: 13px; line-height: 1.5; margin: 0;">
            This code expires in 10 minutes.
          </p>
        </div>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error("[sendVerificationEmail] Failed:", error);
    return { success: false, error: String(error) };
  }
}
