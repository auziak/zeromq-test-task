const zmq = require('zeromq');
const subscriber = zmq.socket('sub');
const publisher = zmq.socket('pub');
const inquirer = require('inquirer');
const uuid = require('uuid');

subscriber.connect('tcp://127.0.0.1:3001');
publisher.connect('tcp://127.0.0.1:3002');
console.log(
  'Subscriber connected to port 3001\nPublisher connected to port 3002'
);

subscriber.subscribe('api_out');
subscriber.on('message', function(api_out, response) {
  let parsedResponse = JSON.parse(response);
  if (parsedResponse.status === 'ok') {
    console.log(parsedResponse.status);
  } else {
    console.log(parsedResponse.error);
  }
  // console.log(response.toString());
});

// Users`s login & password request
console.log(
  'After you launched server.js in DB was created 2 users:\njohn@mail.ua, 123\nkyle@mail.ua, 321'
);

let user = { type: 'login', msg_id: uuid.v4() };
inquirer
  .prompt([
    {
      type: 'input',
      name: 'email',
      message: 'Please enter your email?'
    },
    {
      type: 'input',
      name: 'pwd',
      message: 'Please enter your password?'
    }
  ])
  .then(data => {
    user.email = data['email'];
    user.pwd = data['pwd'];
    // console.log(data);
  })
  .then(() => {
    publisher.send(['api_in', JSON.stringify(user)]);
  });
