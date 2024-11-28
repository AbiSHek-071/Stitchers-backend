const Wallet = require("../Models/wallet");

async function inserMoneytoWallet(amount, _id) {
  let myWallet = await Wallet.findOne({ user: _id });

  if (!myWallet) {
    console.log("no wallet existing");
    myWallet = new Wallet({
      user: _id,
      balance: amount,
      transactions: [
        {
          transaction_date: new Date(),
          transaction_type: "credit",
          transaction_status: "completed",
          amount: amount,
        },
      ],
    });
    await myWallet.save();
  } else {
    myWallet.balance += +amount;
    const transactions = {
      transaction_date: new Date(),
      transaction_type: "credit",
      transaction_status: "completed",
      amount: amount,
    };

    myWallet.transactions.push(transactions);
    await myWallet.save();
  }
}

module.exports = { inserMoneytoWallet };
