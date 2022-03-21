

"use strict";
const nodemailer = require("nodemailer");

// async..await is not allowed in global scope, must use a wrapper
async function sendOTP(email, otp) {

        // Generate test SMTP service account from ethereal.email
        // Only needed if you don't have a real mail account for testing
        // let testAccount = await nodemailer.createTestAccount();

        // create reusable transporter object using the default SMTP transport
        const transporter =   nodemailer.createTransport({
            host:  process.env.MAIL_HOST,
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            }
        });

        // send mail with defined transport object
        let info = await transporter.sendMail({
            from: `"Qualyval Auth" <${process.env.MAIL_USER}>`, // sender address
            to: `${email}`, // list of receivers
            subject: "no-reply", // Subject line
            html: `<h4> your OTP is ${otp} </h4> <div style="color: red"> note: this OTP is only valid for 5 Minutes </div>`, // html body
        });
        return info.messageId

}


module.exports = sendOTP;