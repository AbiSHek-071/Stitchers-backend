const Wallet = require("../../Models/wallet");

async function addMoneytoWallet(req, res) {
  try {
    const { amount, _id } = req.body;
    console.log("amount--------->", amount);
    console.log("userID==================>", _id);

    let myWallet = await Wallet.findOne({ user: _id });
    if (!myWallet) {
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
      return res
        .status(200)
        .json({ success: true, message: "Amount added to wallet " });
    }
    myWallet.balance += +amount;
    const transactions = {
      transaction_date: new Date(),
      transaction_type: "credit",
      transaction_status: "completed",
      amount: amount,
    };

    myWallet.transactions.push(transactions);
    await myWallet.save();
    return res
      .status(200)
      .json({ success: true, message: "Amount added to wallet " });
  } catch (err) {
    console.log(err);
  }
}

async function fetchWallet(req, res) {
  try {
    const { _id } = req.query;
    let myWallet = await Wallet.findOne({ user: _id });
    if (!myWallet) {
      myWallet = new Wallet({
        user: _id,
        balance: 0,
      });
      await myWallet.save();
      return res.status(200).json({ success: true, myWallet });
    }
    return res.status(200).json({ success: true, myWallet });
  } catch (err) {
    console.log(err);
  }
}

async function makePaymentWithWallet(req, res) {
  try {
    const { amount, _id } = req.body;
    let myWallet = await Wallet.findOne({ user: _id });
    if (!myWallet) {
      return res.status(404).json({
        success: false,
        message:
          "unable to find a wallet for the user,please check your profile",
      });
    }
    myWallet.balance -= -amount;
    const transaction = {};
    myWallet.transactions.push();
  } catch (err) {
    console.log(err);
  }
}

module.exports = { addMoneytoWallet, fetchWallet };
