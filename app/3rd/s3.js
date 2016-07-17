
var policy = require('s3-policy');
var s3BucketName = process.env.S3_BUCKET
var s3BucketUrl = s3BucketName + ".s3.amazonaws.com/"

module.exports = {
    bucketUrl: s3BucketUrl,
    bucketName: s3BucketName
}