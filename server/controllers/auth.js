const User = require('../models/user');
const AWS = require("aws-sdk");
const jwt = require('jsonwebtoken');
const { registerEmailParams } = require('../helpers/email');

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const ses = new AWS.SES({ apiVersion: "2010-12-01" });

exports.register = (req, res) => {
  // console.log('REGISTER CONTROLLER', req.body);
  const { name, email, password } = req.body;
  // Check if user exists in db
  User.findOne({email: email}).exec((err, user) => {
    if(user) {
      console.log(err);
      return res.status(400).json({
        error: 'Email is taken'
      })
    }
    // Generate token with username, email and password
    const token = jwt.sign({name, email, password}, process.env.JWT_ACCOUNT_ACTIVATION, {
      expiresIn: '10m'
    });

    // Send email
    const params = registerEmailParams(email, token);
  
    const sendEmailOnRegister = ses.sendEmail(params).promise();
  
    sendEmailOnRegister
      .then((data) => {
        console.log("email submitted to SES", data);
        res.json({
          message: `email has been sent to ${email}, follw the instructions to complete your registration` 
        });
      })
      .catch((err) => {
        console.log('ses email on register', err);
        res.json({
          message: `We could not verify your email. Please try again.` 
        });
      });
  })
};
