const Category = require('../models/category');
const slugify = require('slugify');
const formidable = require('formidable');
const aws = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// s3
const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

exports.create = (req, res) => {
    let form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
        if(err) {
            return res.status(400).json({
                error: 'Image could not upload'
            })
        }
        // console.table({err, fields, files});
        const {name, content} = fields;
        const {image} = files;

        const slug = slugify(name);
        let category = new Category({name, content, slug});
        if (image.size > 2000000) {
            return res.status(400).json({
                error: 'Image should be less than 2mb'
            })
        }
        // upload image to S3
        const params = {
            Bucket: 'hackr-sirnobles',
            Key: `category/${uuidv4()}`,
            Body: fs.readFileSync(image.path),
            ACL: 'public-read',
            ContentType: `image/jpg`
        }

        s3.upload(params, (err, data) => {
            if(err) res.status(400).json({
                error: 'Upload to S3 failed'
            })
            console.log('AWS UPLOAD RES DATA', data);
            category.image.url = data.Location;
            category.image.key = data.Key;

            //save to database
            category.save((err, success) => {
                if(err) res.status(400).json({
                    error: 'Duplicate category'
                })
                return res.json(success);
            })
        });
    })
};

// exports.create = (req, res) => {
//     const {name, content} = req.body;
//     const slug = slugify(name);
//     const image = {
//         url: `https://via.placeholder.com/200x150.png?text=${process.env.CLIENT_URL}`,
//         key: '123'
//     };

//     const category = new Category({ name, slug, image});
//     category.postedBy = req.user._id;

//     category.save((err, data) => {
//         if (err) {
//             console.log('Category create error', err);
//             return res.status(400).json({
//                 error: 'Category create failed'
//             })
//         }
//         res.json(data)
//     });
// };

exports.list = (req, res) => {
    //
};

exports.read = (req, res) => {
    //
};

exports.update = (req, res) => {
    //
};

exports.remove = (req, res) => {
    //
};