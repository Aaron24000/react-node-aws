const User = require('../models/user');
const AWS = require("aws-sdk");
const jwt = require('jsonwebtoken');
const expressJWT = require('express-jwt');
const { registerEmailParams, forgotPasswordEmailParams } = require('../helpers/email');
const shortId = require('shortid');
const _ = require('lodash');
const Link = require('../models/link');

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

exports.registerActivate = (req, res) => {
  const { token } = req.body;
  // console.log(token);
  jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION, function(err, decoded) {
    if(err) {
      return res.status(401).json({
        error: 'Expired link. Try again.'
      })
    }
    
    const {name, email, password} = jwt.decode(token);
    const username = shortId.generate();

    User.findOne({email}).exec((err, user) => {
      if(user) {
        return res.status(401).json({
          error: 'Email is taken'
        })
      }

      // Register new user
      const newUser = new User({username, name, email, password})
      newUser.save((err, result) => {
        if(err) {
          return res.status(401).json({
            error: 'Error saving user in database. Try later'
          })
        }
        return res.json({
          message: 'Registration successful. Please login.'
        })
      })
    })
  })
}

exports.login = (req, res) => {
  const {email, password} = req.body;
  // console.table({email, password});
  User.findOne({email}).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: 'User with that email does not exist. Please register.'
      })
    }
    // authenticate
    if (!user.authenticate(password)) {
      return res.status(400).json({
        error: 'Email and password do not match'
      })
    }
    // Generate token and send to client
    const token = jwt.sign({_id: user._id}, process.env.JWT_SECRET, {expiresIn: '7d'});
    const { _id, name, email, role } = user;

    return res.json({
      token, 
      user: { _id, name, email, role }
    })
  })
}

exports.requireSignin = expressJWT({secret: process.env.JWT_SECRET, algorithms: ['HS256']}); // req.user decoded

exports.authMiddleware = (req, res, next) => {
  const authUserId = req.user._id;
  User.findOne({ _id: authUserId }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User not found",
      });
    }
    req.profile = user;
    next();
  });
};

exports.adminMiddleware = (req, res, next) => {
  const adminUserId = req.user._id;
  User.findOne({ _id: adminUserId }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "User not found",
      });
    }

    //
    if(user.role !== 'admin') {
      return res.status(400).json({
        error: 'Admin resource. Access denied.'
      })
    }
    
    req.profile = user;
    next();
  });
};

exports.forgotPassword = (req, res) => {
  const {email} = req.body;
  // check if user exists with that email
  User.findOne({email}).exec((err, user) => {
    if(err || !user) {
      return res.status(400).json({
        error: "User with that email does not exist"
      })
    }

    // generate token and email to user
    const token = jwt.sign({name: user.name}, process.env.JWT_RESET_PASSWORD, {expiresIn: '10m'});

    // Send email
    const params = forgotPasswordEmailParams(email, token);

    // populate the db > user > resetPasswordLink
    return user.updateOne({resetPasswordLink: token}, (err, success) => {
      if (err) {
        return res.status(400).json({
          error: 'Password reset failed. Try again later.'
        });
      }
      const sendEmail = ses.sendEmail(params).promise()
      sendEmail.then(data => {
        console.log('ses reset password success', data);
        return res.json({
          message: `Email has been sent to ${email}. Click on the link to reset your password`
        })
      }).catch(err => {
        console.log('ses reset pw failed', err);
        return res.json({
          message: `We could not verify your email. Try again later.`
        })
      })
    });
  })
};

exports.resetPassword = (req, res) => {
  const {resetPasswordLink, newPassword} = req.body;
  if(resetPasswordLink) {
    // check for expiry
    jwt.verify(resetPasswordLink, process.env.JWT_RESET_PASSWORD, (err, success) => {
      if(err) {
        return res.status(400).json({
          error: 'Expired Link. Try again.'
        })
      }
      //
      User.findOne({resetPasswordLink}).exec((err, user) => {
        if(err || !user) {
          return res.status(400).json({
            error: 'Invalid token. Try again.'
          })
        }

        const updatedFields = {
          password: newPassword,
          resetPasswordLink: ''
        }

        user = _.extend(user, updatedFields)

        user.save((err, result) => {
          if(err) {
            return res.status(400).json({
              error: 'Password reset failed. Try again'
            })
          }

          res.json({
            message: 'Great! Now you can login with your new password'
          })
        })
      })
    })
  }
};

exports.canUpdateDeleteLink = (req, res, next) => {
  const {id} = req.params;
  Link.findOne({_id: id}).exec((err, data) => {
    if (err) {
      return res.status(400).json({
        error: 'Could not find link'
      })
    }
    let authorizedUser = data.postedBy._id.toString === req.user._id.toString(); // can also use req.profile._id
    if (!authorizedUser) {
      return res.status(400).json({
        error: 'You are not authorized'
      })
    }
    next();
  })
}