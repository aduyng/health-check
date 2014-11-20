var env = process.env.NODE_ENV || 'development',
    config = require('./config')[env],
    Bookshelf = require('bookshelf');

var knex = require('knex')(config.db);


var conn;
if (Bookshelf.conn) {
    conn = Bookshelf.conn;
} else {
    Bookshelf.conn = conn = Bookshelf(knex);
}
module.exports = conn;


