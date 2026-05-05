import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

const FROM = process.env.SMTP_FROM || `"HIT Platform" <${process.env.SMTP_USER}>`;

export async function sendForgotPassword(to: string, name: string, tempPassword: string) {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: 'HIT Platform — Redefinição de senha',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0e0e0e;color:#e0e0e0;padding:32px;border-radius:12px;">
        <h2 style="color:#CCFF00;margin-bottom:8px;">HIT Platform</h2>
        <p>Olá, <strong>${name}</strong>!</p>
        <p>Você solicitou a redefinição de senha. Sua nova senha temporária é:</p>
        <div style="background:#1a1a1a;border:1px solid #2e2e2e;border-radius:8px;padding:16px;text-align:center;margin:16px 0;">
          <span style="font-size:22px;font-weight:bold;color:#CCFF00;letter-spacing:2px;">${tempPassword}</span>
        </div>
        <p style="color:#929292;font-size:13px;">Por segurança, altere sua senha após o login.<br>Se não foi você, ignore este e-mail.</p>
      </div>
    `,
  });
}

export async function sendCommentNotification(
  to: string,
  recipientName: string,
  taskTitle: string,
  authorName: string,
  commentContent: string,
) {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: `HIT Platform — Novo comentário na tarefa: ${taskTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0e0e0e;color:#e0e0e0;padding:32px;border-radius:12px;">
        <h2 style="color:#CCFF00;margin-bottom:8px;">HIT Platform</h2>
        <p>Olá, <strong>${recipientName}</strong>!</p>
        <p><strong>${authorName}</strong> adicionou um comentário na tarefa <strong>"${taskTitle}"</strong>:</p>
        <div style="background:#1a1a1a;border-left:3px solid #CCFF00;padding:12px 16px;margin:16px 0;border-radius:4px;">
          <p style="margin:0;color:#d0d0d0;">${commentContent}</p>
        </div>
        <p style="color:#929292;font-size:13px;">Acesse a plataforma para visualizar a tarefa completa.</p>
      </div>
    `,
  });
}
