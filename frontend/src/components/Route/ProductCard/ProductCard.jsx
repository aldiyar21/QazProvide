import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "../../../styles/styles";
import {
  AiFillHeart,
  AiOutlineEye,
  AiOutlineHeart,
  AiOutlineShoppingCart,
} from "react-icons/ai";
import { backend_url } from "../../../server";
import ProductDetailsCard from "../ProductDetailsCard/ProductDetailsCard.jsx";
import { useDispatch, useSelector } from "react-redux";
import { addToWishlist, removeFromWishlist } from "../../../redux/actions/wishlist";
import { addTocart } from "../../../redux/actions/cart";
import { toast } from "react-toastify";
import Ratings from "../../Products/Ratings";

const ProductCard = ({ data, isEvent }) => {
  const { wishlist } = useSelector((state) => state.wishlist);
  const { cart } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.user);
  const { isSeller } = useSelector((state) => state.seller);
  const isShoppingRestricted = isSeller || user?.role === "Admin";

  const [click, setClick] = useState(false);
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    if (wishlist && wishlist.find((i) => i._id === data._id)) {
      setClick(true);
    } else {
      setClick(false);
    }
  }, [wishlist, data]);

  const removeFromWishlistHandler = (item) => {
    if (isShoppingRestricted) return;
    setClick(!click);
    dispatch(removeFromWishlist(item));
  };

  const addToWishlistHandler = (item) => {
    if (isShoppingRestricted) {
      toast.error("Аккаунты продавца и администратора не могут взаимодействовать с товарами.");
      return;
    }
    setClick(!click);
    dispatch(addToWishlist(item));
  };

  const addToCartHandler = (id) => {
    if (isShoppingRestricted) {
      toast.error("Аккаунты продавца и администратора не могут добавлять товары в корзину.");
      return;
    }

    const isItemExists = cart && cart.find((i) => i._id === id);

    if (isItemExists) {
      toast.error("Товар уже в корзине!");
    } else if (data.stock < 1) {
      toast.error("Количество товара ограничено!");
    } else {
      const cartData = { ...data, qty: 1 };
      dispatch(addTocart(cartData));
      toast.success("Товар успешно добавлен в корзину!");
    }
  };

  return (
    <>
      <div className="group relative h-[390px] w-full cursor-pointer rounded-[24px] border border-[#eef0ea] bg-[linear-gradient(180deg,#ffffff_0%,#fbfcf8_100%)] p-3 shadow-[0_10px_30px_rgba(35,38,32,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(35,38,32,0.12)]">
        <Link to={`${isEvent === true ? `/product/${data._id}?isEvent=true` : `/product/${data._id}`}`}>
          <img
            src={`${backend_url}${data.images && data.images[0]}`}
            alt="prd"
            className="h-[190px] w-full rounded-[18px] object-cover"
          />
        </Link>

        <div className="pt-3">
          <Link to={`${isEvent === true ? `/product/${data._id}?isEvent=true` : `/product/${data._id}`}`}>
            <h5 className="inline-flex rounded-full bg-[#f4f7ef] px-3 py-1 text-[13px] font-[600] text-[#5c7a44]">
              {data.shop.name}
            </h5>
          </Link>
        </div>

        <Link to={`/product/${data._id}`}>
          <h4 className="pb-2 pt-3 text-[17px] font-[600] leading-6 text-[#22251f]">
            {data.name.length > 40 ? `${data.name.slice(0, 40)}...` : data.name}
          </h4>

          <div className="flex items-center">
            <Ratings rating={data?.ratings} />
            <span className="text-[13px] text-[#6f756b]">
              {data?.ratings ? Number(data.ratings).toFixed(1) : "0.0"}
            </span>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-[18px] bg-[#f8f5ee] px-4 py-3">
            <div className="flex">
              <h5 className={`${styles.productoriginalPrice}`}>{data.originalPrice} тг</h5>
              <h4 className={`${styles.price}`}>{data.unit}</h4>
            </div>

            <span className="rounded-full bg-[#eaf7ea] px-3 py-1 text-[13px] font-[600] text-[#3c8b54]">
              Продано {data?.sold_out || 0}
            </span>
          </div>
        </Link>

        <div>
          {!isShoppingRestricted &&
            (click ? (
              <AiFillHeart
                size={22}
                className="absolute right-4 top-5 cursor-pointer"
                onClick={() => removeFromWishlistHandler(data)}
                color="red"
                title="Remove from wishlist"
              />
            ) : (
              <AiOutlineHeart
                size={22}
                className="absolute right-4 top-5 cursor-pointer"
                onClick={() => addToWishlistHandler(data)}
                color="#333"
                title="Add to wishlist"
              />
            ))}

          <AiOutlineEye
            size={22}
            className="absolute right-4 top-14 cursor-pointer"
            onClick={() => setOpen(!open)}
            color="#333"
            title="Quick view"
          />

          {!isShoppingRestricted && (
            <AiOutlineShoppingCart
              size={25}
              className="absolute right-4 top-24 cursor-pointer"
              onClick={() => addToCartHandler(data._id)}
              color="#444"
              title="Add to cart"
            />
          )}

          {open ? <ProductDetailsCard setOpen={setOpen} data={data} /> : null}
        </div>
      </div>
    </>
  );
};

export default ProductCard;
