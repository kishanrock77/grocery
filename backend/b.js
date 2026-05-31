const admin = require('./firebase');

(async () => {
  try {

    const token = await admin.messaging().send({
      token: 'fake-token',
      notification: {
        title: 'Test',
        body: 'Hello'
      }
    });

    console.log(token);

  } catch (e) {
    console.error(e);
  }
})();