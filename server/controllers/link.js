const Link = require('../models/link');
const slugify = require('slugify');

// create, list, read, update, remove

exports.create = (req, res) => {
    const {title, url, categories, type, medium} = req.body;
    // console.table({title, url, categories, type, medium});
    const slug = url;
    let link = new Link({ title, url, categories, type, medium, slug});
    // posted by user
    link.postedBy = req.user._id;
    // categories
    let arrayOfCategories = categories && categories.split(','); // split on each comma in the categories. Can be one category or many
    link.categories = arrayOfCategories;
    // save link
    link.save((err, data) => {
        if(err) {
            console.log(err);
            // return res.status(400).json({
            //     error: 'Link already exists'
            // });
        }
        res.json(data);
    });
}

exports.list = (req, res) => {
    //
}

exports.read = (req, res) => {
    //
}

exports.update = (req, res) => {
    //
}

exports.remove = (req, res) => {
    //
}