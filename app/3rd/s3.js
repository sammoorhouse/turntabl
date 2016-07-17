
module.exports = function (log) {
    var policy = require('s3-policy');
    var bucketName = process.env.S3_BUCKET
    var bucketUrl = bucketName + ".s3.amazonaws.com/"

    function generateSignature(filename) {
        var firstChar = filename[0]
        var secondChar = filename[1]
        var filePath = firstChar + "/" + secondChar + "/" + filename
        var acl = "public-read"
        var p = policy({
            acl: acl,
            secret: process.env.AWS_SECRET_ACCESS_KEY,
            bucket: bucketName,
            key: filePath,
            expires: new Date(Date.now() + 600000),
        })
        return {
            'AWSAccessKeyId': process.env.AWS_ACCESS_KEY_ID,
            'key': filePath,
            'policy': p.policy,
            'signature': p.signature
        }
    }
    return {
        generateSignature: generateSignature,
        bucketUrl: bucketUrl,
        bucketName: bucketName
    }
}