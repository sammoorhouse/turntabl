

var versionString = 'v0.4'
var eventTitleRef = "eventTitle"
var eventDurationRef = "eventDuration"
var eventPriceRef = "eventPrice"
var emailLogicJumpRef = "emailLogicJump"
var emailOverrideRef = "emailOverride"
var request = require('request');

module.exports = function (log) {
    var createAndRenderForm = function (formData, doneCB, errCB) {
        //generate typeform
        var typeformUrl = "https://api.typeform.io/" + versionString + "/forms"

        request.post(
            {
                url: typeformUrl,
                json: formData,
                headers: {
                    "X-API-TOKEN": process.env.TYPEFORM_APIKEY
                }
            },
            function (err, resp) {
                if (!err && resp.statusCode == 201) { //201 CREATED
                    log.info('typeform Upload successful');
                    var formLink = resp.body['_links'].find(function (el) {
                        return el.rel === "form_render"
                    }).href
                    log.info('typeform url: ' + formLink)

                    return doneCB(formLink)
                } else if (err) {
                    return errCB('typeform upload failed:' + err);
                } else {
                    return errCB('typeform upload failed:' + resp.body);
                }
            })

    }

    function generateForm(user, eventId) {
        log.info("webhook url: " + process.env.typeform_webhook_submit_url)
        var formData = {
            "title": "turntable - teach, mentor, advise",
            "webhook_submit_url": process.env.typeform_webhook_submit_url, //"http://requestb.in/qqmbwcqq",//
            "tags": [eventId],
            "branding": false,
            "fields": [
                {
                    type: "yes_no",
                    required: true,
                    ref: emailLogicJumpRef,
                    question: "Hey " + user.givenName + ", we're going to get started! First, we think your email address is `" + user.email + "` - is that right?",
                    description: "We promise not to give your address away, but we might need to get in touch if there's a payment issue"
                }, {
                    type: "email",
                    required: true,
                    ref: emailOverrideRef,
                    question: "Disaster! Looks like we messed up, sorry about that. So... what's your email?",
                    description: "Seriously, we totally promise not to give away your email"
                }, {
                    type: "short_text",
                    required: true,
                    ref: eventTitleRef,
                    question: "Great! What do you want to call this session?",
                    description: "Sam / George life coaching"
                }, {
                    type: "number",
                    required: true,
                    ref: eventDurationRef,
                    question: "How many minutes is the session going to last?",
                    description: "We'll show you a warning when your time is almost up",
                    min_value: 5
                }, {
                    type: "number",
                    required: true,
                    ref: eventPriceRef,
                    question: "How much are you charging for the session?",
                    description: "USD. We take $10; you'll get paid once the session is over"
                }, {
                    type: "legal",
                    required: true,
                    question: "Thanks!",
                    description: "That's all for now. Your session will be available for 90 days from now."
                }],
            "logic_jumps": [{
                "from": emailLogicJumpRef,
                "to": eventTitleRef,
                "if": true
            }]
        }

        return formData
    }


    function resolveField(refName, formSubmission, formStructure) {
        log.info("attempting to find " + refName)
        var fieldId = formStructure.fields.find(function (q) {
            return q.ref === refName
        }).id

        log.info("found id: " + fieldId)
        var block = formSubmission.answers.find(function (a) {
            return a.field_id === fieldId
        })

        var result
        if (block.type === "number") {
            result = block.value.amount
        } else {
            result = block.value
        }

        log.info(refName + " = " + result)
        return result
    }

    function resolveLeaderEmail(formSubmission, formStructure) {
        var emailOverridden = !resolveField(emailLogicJumpRef, formSubmission, formStructure)
        if (emailOverridden) {
            return resolveField(emailOverrideRef, formSubmission, formStructure)
        } else {
            // :( parse from question
            var questionText = formStructure.fields.find(function (q) {
                return q.ref === emailLogicJumpRef
            }).question
            var pattern = /\<code\>(.*)\<\/code\>/
            var email = questionText.match(pattern)[1]
            log.info("email = " + email)
            return email
        }
    }

    function resolveFormSubmissionWebhook(formSubmission, formStructure) {
        return {
            leaderEmail: resolveLeaderEmail(formSubmission, formStructure),
            eventTitle: resolveField(eventTitleRef, formSubmission, formStructure),
            eventDuration: resolveField(eventDurationRef, formSubmission, formStructure),
            eventPrice: resolveField(eventPriceRef, formSubmission, formStructure),
        }
    }

    return {
        versionString: versionString,
        generateForm: generateForm,
        createAndRenderForm: createAndRenderForm,
        resolveFormSubmissionWebhook: resolveFormSubmissionWebhook
    }
} 
