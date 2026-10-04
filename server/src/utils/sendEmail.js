import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    // Note: User can configure their own SMTP service in .env
    // Providing a default configuration structure
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    const message = {
        from: `${process.env.FROM_NAME || 'Super Admin System'} <${process.env.FROM_EMAIL || 'noreply@alkawthar.com'}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    const info = await transporter.sendMail(message);
    console.log('Message sent: %s', info.messageId);
};

export default sendEmail;
