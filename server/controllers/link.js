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
    // save link
    link.save((err, data) => {
        if (err) {
            // console.log(err); 
            return res.status(400).json({
                error: 'Link already exists'
            });
        }
        res.json(data);
    });
}

exports.list = (req, res) => {
    Link.find({}).exec((err, data) => {
        if (err) {
            return res.status(400).json({
                error: 'Could not list links'
            });
        }
        res.json(data);
    })
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

exports.clickCount = (req, res) => {
    const {linkId} = req.body;
    Link.findByIdAndUpdate(linkId, {$inc: {clicks: 1}}, {new: true, upsert: true}).exec((err, result) => {
        if (err) {
            return res.status(400).json({
                error: 'Could not update view count'
            })
        }
        res.json(result);
    });
}