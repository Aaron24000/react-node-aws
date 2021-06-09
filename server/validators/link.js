const { check } = require("express-validator");

exports.linkCreateValidator = [
  check("title").not().isEmpty().withMessage("Title is required!"),
  check("url").notEmpty().withMessage("URL is required"),
  check("categories").notEmpty().withMessage("Pick a category."),
  check("type").notEmpty().withMessage("Choose between free and paid type."),
  check("medium").notEmpty().withMessage("Pick a medium video or book."),
];

exports.linkUpdateValidator = [
  check("title").not().isEmpty().withMessage("Title is required!"),
  check("url").notEmpty().withMessage("URL is required"),
  check("categories").notEmpty().withMessage("Pick a category."),
  check("type").notEmpty().withMessage("Choose between free and paid type."),
  check("medium").notEmpty().withMessage("Pick a medium video or book."),
];
