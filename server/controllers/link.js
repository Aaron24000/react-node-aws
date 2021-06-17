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
    let limit = req.body.limit ? parseInt(req.body.limit) : 10;
    let skip = req.body.skip ? parseInt(req.body.skip) : 0;

    Link.find({})
    .populate('postedBy', 'name')
    .populate('categories', 'name, slug')
    .sort({createdAt: -1})
    .skip(skip)
    .limit(limit)
    .exec((err, data) => {
        if (err) {
            return res.status(400).json({
                error: 'Could not list links'
            });
        }
        res.json(data);
    })
}

exports.read = (req, res) => {
    const {id} = req.params;
    Link.findOne({_id: id}).exec((err, data) => {
        if (err) {
            return res.status(400).json({
                error: 'Error finding the link'
            });
        }
        res.json(data);
    })
}

exports.update = (req, res) => {
    const {id} = req.params;
    const {title, url, categories, type, medium} = req.body;

    Link.findOneAndUpdate({_id: id}, {title, url, categories, type, medium}, {new: true}).exec((err, updated) => {
        if (err) {
            return res.status(400).json({
                error: 'Error updating the link'
            })
        }
    })
}

exports.remove = (req, res) => {
    const {id} = req.params;
    Link.findOneAndDelete({_id: id}).exec((err, data) => {
        if (err) {
            return res.status(400).json({
                error: 'Error removing the link'
            })
        }
        res.json({
            message: 'Link removed successfully'
        })
    })
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