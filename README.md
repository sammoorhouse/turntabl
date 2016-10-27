# Installation

1. Install:
  1.  npm: http://blog.npmjs.org/post/85484771375/how-to-install-npm
    $ npm --version
    3.4.0
  2. Install & setup heroku CLI tools: http://dev.heroku.com/categories/command-line
    $ heroku --version
    heroku-toolbelt/3.43.3 (x86_64-darwin10.8.0) ruby/1.9.3
    heroku-cli/5.2.24-4b7e305 (darwin-amd64) go1.6.2
    You have no installed plugins.
3. `git clone https://github.com/sammoorhouse/turntabl.git`
4. `npm install`
5. `rm .env`
6. `for i in `cat .env.template | grep -v ^#`; do heroku config:get $i -s --app turntabl-staging >> .env; done`
7. `heroku local`

# Local db

If you want a local copy of the accounts/events database, install & run `mongod --dbpath .`, and edit the 'MONGODB_URI' value in your .env

