const zmq = require('zeromq');
const publisher = zmq.socket('pub');
const subscriber = zmq.socket('sub');
const sqlite3 = require('sqlite3');
const fs = require('fs');
const path = './users.db';

publisher.bindSync('tcp://127.0.0.1:3001');
console.log('Publisher connected to port 3001');
subscriber.bindSync('tcp://127.0.0.1:3002');
console.log('Subscriber connected to port 3002');

// Creating new Database if not exist
const db = new sqlite3.Database('users.db');
try {
  if (!fs.existsSync(path)) {
    db.serialize(() => {
      // Create a new database table
      db.run(
        'CREATE TABLE users_passwords (user_id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT, passw TEXT)'
      );
      // Insert data to table
      db.run(
        "INSERT INTO users_passwords(email, passw) VALUES('john@mail.ua','123')"
      );
      db.run(
        "INSERT INTO users_passwords(email, passw) VALUES('kyle@mail.ua','321')"
      );

      db.each('SELECT * FROM users_passwords', (err, row) => {
        console.log(`${row.user_id}, ${row.email}, ${row.passw}`);
      });
    });
  }
} catch (err) {
  console.log(err);
}

subscriber.subscribe('api_in');
subscriber.on('message', function(api_in, user) {
  const parsedUser = JSON.parse(user);
  if (parsedUser.type === 'login') {
    let response = {};
    // Check if fields inserted by user not empty
    if (parsedUser.email != '' && parsedUser.pwd != '') {
      // Select user with matching email
      db.all(
        `SELECT user_id, passw FROM users_passwords WHERE email='${parsedUser.email}'`,
        (err, rows) => {
          response.msg_id = parsedUser.msg_id;
          response.status = 'error';
          if (rows.length > 0) {
            if (rows[0].passw === parsedUser.pwd) {
              response.msg_id = parsedUser.msg_id;
              response.user_id = rows[0].user_id;
              response.status = 'ok';
              publisher.send(['api_out', JSON.stringify(response)]);
            } else {
              response.error = 'WRONG_PWD';
              publisher.send(['api_out', JSON.stringify(response)]);
            }
          } else {
            response.error = 'WRONG_PWD';
            publisher.send(['api_out', JSON.stringify(response)]);
          }
        }
      );
    } else {
      response.msg_id = parsedUser.msg_id;
      response.status = 'error';
      response.error = 'WRONG_FORMAT';
      publisher.send(['api_out', JSON.stringify(response)]);
    }
  }
});
