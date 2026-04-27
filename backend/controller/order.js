const express = require("express");
const router = express.Router();
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isAuthenticated, isSeller, isAdmin } = require("../middleware/auth");
const Order = require("../model/order");
const Shop = require("../model/shop");
const Product = require("../model/product");

// Create new order
router.post(
  "/create-order",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { cart, shippingAddress, user, totalPrice, paymentInfo } = req.body;

      if (!Array.isArray(cart) || cart.length === 0) {
        return next(new ErrorHandler("Cart is empty", 400));
      }

      if (!shippingAddress || Object.keys(shippingAddress).length === 0) {
        return next(new ErrorHandler("Shipping address is required", 400));
      }

      if (!user || !user._id) {
        return next(new ErrorHandler("User is required", 400));
      }

      if (String(user._id) !== String(req.user._id)) {
        return next(new ErrorHandler("You can only create orders for your own account", 403));
      }

      if (!Number.isFinite(Number(totalPrice)) || Number(totalPrice) <= 0) {
        return next(new ErrorHandler("Invalid order total", 400));
      }

      const shopItemsMap = new Map();

      for (const item of cart) {
        const shopId = item.shopId;
        if (!shopId) {
          return next(new ErrorHandler("Product shopId is required", 400));
        }

        if (!shopItemsMap.has(shopId)) {
          shopItemsMap.set(shopId, []);
        }
        shopItemsMap.get(shopId).push(item);
      }

      const orders = [];

      for (const [, items] of shopItemsMap) {
        const order = await Order.create({
          cart: items,
          shippingAddress,
          user,
          totalPrice,
          paymentInfo,
        });
        orders.push(order);
      }

      res.status(201).json({
        success: true,
        orders,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Get all orders of user
router.get(
  "/get-all-orders/:userId",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      if (String(req.user._id) !== String(req.params.userId) && req.user.role !== "Admin") {
        return next(new ErrorHandler("You can only view your own orders", 403));
      }

      const orders = await Order.find({ "user._id": req.params.userId }).sort({
        createdAt: -1,
      });

      res.status(200).json({
        success: true,
        orders,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Get all orders of seller
router.get(
  "/get-seller-all-orders/:shopId",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      if (String(req.seller._id) !== String(req.params.shopId)) {
        return next(new ErrorHandler("You can only view your own shop orders", 403));
      }

      const orders = await Order.find({
        "cart.shopId": req.params.shopId,
      }).sort({
        createdAt: -1,
      });

      res.status(200).json({
        success: true,
        orders,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Update order status for seller
router.put(
  "/update-order-status/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);
      const nextStatus = req.body.status;

      if (!order) {
        return next(new ErrorHandler("Order not found with this id", 400));
      }

      if (!order.stockUpdated && nextStatus && nextStatus !== "РћР±СЂР°Р±РѕС‚РєР°") {
        for (const item of order.cart) {
          await updateInventory(item._id, item.qty, "decrease");
        }
        order.stockUpdated = true;
      }

      order.status = nextStatus;

      if (nextStatus === "Р”РѕСЃС‚Р°РІР»РµРЅРѕ") {
        order.deliveredAt = Date.now();
        order.paymentInfo = {
          ...order.paymentInfo,
          status: "РЈСЃРїРµС€РЅРѕ",
        };
      }

      await order.save({ validateBeforeSave: false });

      const shopId = order.cart[0]?.shopId;
      if (shopId) {
        await updateSellerInfo(shopId);
      }

      res.status(200).json({
        success: true,
        order,
      });

      async function updateInventory(id, qty, action) {
        const product = await Product.findById(id);

        if (!product) return;

        if (action === "decrease") {
          product.stock = Math.max(0, product.stock - qty);
          product.sold_out += qty;
        }

        await product.save({ validateBeforeSave: false });
      }

      async function updateSellerInfo(shopId) {
        const sellerOrders = await Order.find({ "cart.shopId": shopId });

        const totalBalance = sellerOrders.reduce((sum, currentOrder) => {
          return sum + currentOrder.totalPrice * 0.9;
        }, 0);

        const seller = await Shop.findById(shopId);
        if (!seller) return;

        seller.availableBalance = totalBalance;
        await seller.save();
      }
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Give a refund ----- user
router.put(
  "/order-refund/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return next(new ErrorHandler("Order not found with this id", 400));
      }

      order.status = req.body.status;

      await order.save({ validateBeforeSave: false });

      res.status(200).json({
        success: true,
        order,
        message: "Р—Р°РїСЂРѕСЃ РЅР° РІРѕР·РІСЂР°С‚ СЃСЂРµРґСЃС‚РІ СѓСЃРїРµС€РЅРѕ РІС‹РїРѕР»РЅРµРЅ!",
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// Accept the refund ---- seller
router.put(
  "/order-refund-success/:id",
  isSeller,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return next(new ErrorHandler("Order not found with this id", 400));
      }

      order.status = req.body.status;

      if (req.body.status === "Refund Success" && order.stockUpdated) {
        for (const item of order.cart) {
          await updateInventory(item._id, item.qty);
        }
        order.stockUpdated = false;
      }

      await order.save({ validateBeforeSave: false });

      const shopId = order.cart[0]?.shopId;
      if (shopId) {
        await updateSellerInfo(shopId);
      }

      res.status(200).json({
        success: true,
        message: "Р’РѕР·РІСЂР°С‚ Р·Р°РєР°Р·Р° РІС‹РїРѕР»РЅРµРЅ СѓСЃРїРµС€РЅРѕ!",
      });

      async function updateInventory(id, qty) {
        const product = await Product.findById(id);

        if (!product) return;

        product.stock += qty;
        product.sold_out = Math.max(0, product.sold_out - qty);

        await product.save({ validateBeforeSave: false });
      }

      async function updateSellerInfo(shopId) {
        const sellerOrders = await Order.find({ "cart.shopId": shopId });

        const totalBalance = sellerOrders.reduce((sum, currentOrder) => {
          return sum + currentOrder.totalPrice * 0.9;
        }, 0);

        const seller = await Shop.findById(shopId);
        if (!seller) return;

        seller.availableBalance = totalBalance;
        await seller.save();
      }
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

// All orders --- for admin
router.get(
  "/admin-all-orders",
  isAuthenticated,
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const orders = await Order.find().sort({
        deliveredAt: -1,
        createdAt: -1,
      });
      res.status(201).json({
        success: true,
        orders,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  })
);

module.exports = router;
