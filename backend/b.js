const admin = require('./firebase');

(async () => {
  try {

    const token = await admin.messaging().send({
      token: "doRbo96V5NE7JzySnsxqvW:APA91bEqdTLYC54wvLQcNFYb5ATrOgdWYM-tcFnfGDuYWm3LYfr9p44b_QE_rxT13zJ-jPcFJ4QBq2bMdRQAqVRIfb5qyboi8kvmT98DRcxxmqQRureeMoc"
,
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