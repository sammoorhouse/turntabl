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

    console.log('dropping sessions table')
    client.query('DROP TABLE IF EXISTS sessions CASCADE', function (err) {
        if (err) {
            throw err;
        } else {
            console.log('dropped sessions table')
        }
    })

    console.log('dropping required_fields table')
    client.query('DROP TABLE IF EXISTS required_fields CASCADE', function (err) {
        if (err) {
            throw err;
        } else {
            console.log('dropped required_fields table')
        }
    })

    console.log('dropping accounts table')
    client.query('DROP TABLE IF EXISTS accounts CASCADE', function (err) {
        if (err) {
            throw err;
        } else {
            console.log('dropped accounts table')
        }
    })

    console.log('dropping field_names table')
    client.query('DROP TABLE IF EXISTS field_names CASCADE', function (err) {
        if (err) {
            throw err;
        } else {
            console.log('dropped field_names table')
        }
    })

    console.log('creating accounts table')
    client.query('CREATE TABLE accounts( \
    account_id varchar(8) PRIMARY KEY, \
    bio varchar(2000) NOT NULL, \
    stripe_account_id varchar(50) \
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
        client_firstname varchar(200) NOT NULL, \
        client_lastname varchar(200) NOT NULL, \
        client_email varchar(200) NOT NULL, \
        client_paid boolean NOT NULL, \
        leader_paid boolean NOT NULL, \
        opentok_session_id varchar(200) NOT NULL, \
        session_ccy varchar(5) NOT NULL, \
        session_price integer NOT NULL, \
        session_started boolean NOT NULL \
    )', function (err, result) {
        if (err) {
            throw err;
        } else {
            console.log('created sessions table')
        }
    })

    console.log('creating field_names table')
    client.query('CREATE TABLE field_names( \
    field_name varchar(50) PRIMARY KEY, \
    display_name varchar(50) \
    )', function (err, result) {
        if (err) {
            throw err;
        } else {
            console.log('created field_names table')
            client.query('INSERT INTO field_names(field_name, display_name) VALUES (\'country\', \'country\')')
        }
    })

    console.log('creating required_fields table')
    client.query('CREATE TABLE required_fields( \
        account_id varchar(8) NOT NULL REFERENCES accounts(account_id), \
        field_name varchar(20) NOT NULL REFERENCES field_names(field_name) \
    )', function (err, result) {
        if (err) {
            throw err;
        } else {
            console.log('created required_fields table')
        }
    })
});