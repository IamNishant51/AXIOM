var crypto = require('crypto');

module.exports = {
  name: 'generate_password',
  description: 'Generate secure random passwords',
  parameters: {
    type: 'object',
    properties: {
      length: { type: 'number', description: 'Password length (default: 16)' },
      count: { type: 'number', description: 'Number of passwords to generate' }
    }
  },
  handler: async function(params) {
    var length = params.length || 16;
    var count = params.count || 1;
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    var passwords = [];
    for (var i = 0; i < count; i++) {
      var randomBytes = crypto.randomBytes(length);
      var password = '';
      for (var j = 0; j < length; j++) {
        password += chars[randomBytes[j] % chars.length];
      }
      passwords.push(password);
    }
    return {
      content: passwords.map(function(p, i) { return 'Password ' + (i + 1) + ': ' + p; }).join('\n'),
      details: { length: length, count: count, character_set: 'A-Z, a-z, 0-9, !@#$%^&*' }
    };
  }
};
