module.exports = function (log) {

    function generateID(length) {
        var ALPHABET = '23456789abdegjkmnpqrvwxyz';
        var rtn = '';
        for (var i = 0; i < length; i++) {
            rtn += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
        }
        return rtn;
    }

    function censor(censor) {
        var i = 0;

        return function (key, value) {
            if (i !== 0 && typeof (censor) === 'object' && typeof (value) == 'object' && censor == value)
                return '[Circular]';

            if (i >= 29) // seems to be a harded maximum of 30 serialized objects?
                return '[Unknown]';

            ++i; // so we know we aren't using the original object anymore

            return value;
        }
    }

    return {
        generateID: generateID,
        censor: censor
    }
}