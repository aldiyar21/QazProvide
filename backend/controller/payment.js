const express = require("express");
const router = express.Router();
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/ErrorHandler");

const stripeSecretKey = process.env.STRIPE_SECRET_KEY?.trim();
const stripeApiKey = process.env.STRIPE_API_KEY?.trim();
const stripe = stripeSecretKey ? require("stripe")(stripeSecretKey) : null;

router.post(
  "/process",
  catchAsyncErrors(async (req, res, next) => {
    if (!stripe) {
      return next(new ErrorHandler("Stripe secret key is not configured", 500));
    }

    const amount = Number(req.body.amount);

    if (!Number.isInteger(amount) || amount <= 0) {
      return next(new ErrorHandler("Invalid payment amount", 400));
    }

    const myPayment = await stripe.paymentIntents.create({
      amount,
      currency: "kzt",
      metadata: {
        company: "QazProvide",
      },
    });
    res.status(200).json({
      success: true,
      client_secret: myPayment.client_secret,
    });
  })
);

router.get(
  "/stripeapikey",
  catchAsyncErrors(async (req, res, next) => {
    if (!stripeApiKey) {
      return next(new ErrorHandler("Stripe publishable key is not configured", 500));
    }

    res.status(200).json({ stripeApikey: stripeApiKey });
  })
);

module.exports = router;
