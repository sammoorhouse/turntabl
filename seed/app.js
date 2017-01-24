var env = process.env.NODE_ENV || 'dev';
var pg = require('pg');

if (env === "dev") {
    console.log('loading .env')
    pg.defaults.ssl = false;
} else {
    pg.defaults.ssl = true;
}

pg.connect(process.env.DATABASE_URL, function (err, client) {
    if (err) throw err;
    console.log('Connected to postgres! Getting schemas...');

    console.log('dropping accounts table')
    client.query('DROP TABLE IF EXISTS accounts CASCADE', function (err) {
        if (err) {
            throw err;
        } else {
            console.log('dropped accounts table')
        }
    })

    console.log('dropping sessions table')
    client.query('DROP TABLE IF EXISTS sessions CASCADE', function (err) {
        if (err) {
            throw err;
        } else {
            console.log('dropped sessions table')
        }
    })

    console.log('creating accounts table')
    client.query('CREATE TABLE accounts( \
    account_id varchar(8) PRIMARY KEY, \
    bio varchar(2000) NOT NULL \
 )', function (err, result) {
        if (err) {
            throw err;
        } else {
            console.log('created accounts table')
        }
    })

    console.log('creating sessions table')
    client.query('CREATE TABLE sessions( \
        session_id varchar(8) PRIMARY KEY, \
        session_name varchar(200) NOT NULL, \
        creation_date date NOT NULL, \
        duration varchar(200) NOT NULL, \
        session_date date NOT NULL, \
        leader_account_id varchar(8) NOT NULL REFERENCES accounts(account_id), \
        client_name varchar(200) NOT NULL, \
        client_paid boolean NOT NULL default false, \
        leader_paid boolean NOT NULL default false, \
        opentok_session_id varchar(200) NOT NULL, \
        session_ccy varchar(5) NOT NULL, \
        session_price integer NOT NULL, \
        session_started boolean NOT NULL default false \
    )', function (err, result) {
        if (err) {
            throw err;
        } else {
            console.log('created sessions table')
        }
    })
});