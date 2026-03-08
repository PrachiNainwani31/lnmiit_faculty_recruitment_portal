const { sendEmail } = require("./emailSender");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

exports.sendBatchEmails = async (emails, subject, htmlGenerator) => {
  const batchSize = 20;

  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);

    await Promise.all(
      batch.map((user) =>
        sendEmail(
          user.email,
          subject,
          htmlGenerator(user)
        )
      )
    );

    // Wait 2 seconds between batches
    await sleep(2000);
  }
};
