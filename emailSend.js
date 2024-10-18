// emailSender.js
import nodemailer from 'nodemailer';

const sendSubscriptionEmail = (email) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        auth: {
            user: 'lightingmc786@gmail.com',
            pass: 'qoiuhqudjjtpxuay',
        }
    });

    const mailOptions = {
        from: 'lightingmc786@gmail.com',
        to: email,
        subject: 'Subscription Confirmation',
        html: `
        <html>
        <head>
            <style>
                body {
                    font-family: 'Poppins', sans-serif;
                    color: #333;
                }

                .container {
                    max-width: 500px;
                    margin: 20px auto;
                    padding: 20px 40px;
                    justify-content: center;
                    align-items: center;
                    color: white;
                    border: 1px solid rgb(88, 7, 125);
                    box-shadow: 0px 0px 50px 0px rgba(92, 24, 164, 0.75);
                    border-radius: 10px;
                    background-color: rgb(50, 9, 95);
                }

                h1 {
                    color: rgb(228, 111, 228);
                    font-size: 40px;
                }

                p {
                    margin-bottom: 10px;
                }
            </style>
        </head>
        <body>
            <div class="container">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="150" height="150">
            <circle cx="100" cy="100" r="90" stroke="purple" stroke-width="10" fill="none" />
            <path d="M50 100 L80 130 L150 70" fill="none" stroke="white" stroke-width="10" stroke-linecap="round">
            <animate attributeName="d" dur="0.5s" begin="0s" repeatCount="1" values="M50 100 L80 130 L150 70; M55 110 L90 145 L150 70; M50 100 L80 130 L150 70" keyTimes="0; 0.5; 1" />
            </path>
        </svg>
                <h1>Subscription Successful!</h1>
                <p>Dear Subscriber,</p>
                <p>Thank you for subscribing to our newsletter! We appreciate your interest.</p>
                <p>Stay tuned for the latest updates and news on our website.</p>
                <p>Best regards,</p>
                <p>Gametrex.</p>
            </div>
        </body>
        </html>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
};

export default sendSubscriptionEmail;
