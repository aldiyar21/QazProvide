import React, { useEffect, useState } from "react";
import {
  AiFillHeart,
  AiOutlineHeart,
  AiOutlineMessage,
  AiOutlineShoppingCart,
} from "react-icons/ai";
import { RxCross1 } from "react-icons/rx";
import { Link, useNavigate } from "react-router-dom";
import { backend_url, server } from "../../../server";
import styles from "../../../styles/styles";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { addTocart } from "../../../redux/actions/cart";
import {
  addToWishlist,
  removeFromWishlist,
} from "../../../redux/actions/wishlist";
import axios from "axios";

const ProductDetailsCard = ({ setOpen, data }) => {
  const { cart } = useSelector((state) => state.cart);
  const { wishlist } = useSelector((state) => state.wishlist);
  const { user, isAuthenticated } = useSelector((state) => state.user);
  const { isSeller } = useSelector((state) => state.seller);
  const isShoppingRestricted = isSeller || user?.role === "Admin";

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [count, setCount] = useState(1);
  const [click, setClick] = useState(false);

  const handleMessageSubmit = async () => {
    if (isShoppingRestricted) {
      toast.error("Только покупатель может написать продавцу.");
      return;
    }

    if (!isAuthenticated || !user?._id) {
      toast.error("Пожалуйста, войдите как покупатель, чтобы написать продавцу.");
      navigate("/login?role=user");
      return;
    }

    try {
      const groupTitle = data._id + user._id;
      const userId = user._id;
      const sellerId = data.shopId;

      const userConversationsResponse = await axios.get(
        `${server}/conversation/get-all-conversation-user/${userId}`,
        { withCredentials: true }
      );

      const userConversations = userConversationsResponse.data.conversations;

      const existingConversation = userConversations.find((conversation) =>
        conversation.members.includes(sellerId)
      );

      if (existingConversation) {
        setOpen(false);
        navigate(`/inbox?${existingConversation._id}`);
        return;
      }

      const res = await axios.post(
        `${server}/conversation/create-new-conversation`,
        {
          groupTitle,
          userId,
          sellerId,
        },
        { withCredentials: true }
      );

      setOpen(false);
      navigate(`/inbox?${res.data.conversation._id}`);
    } catch (error) {
      if (error?.response?.status === 401) {
        toast.error("Сессия истекла. Войдите как покупатель и попробуйте снова.");
        navigate("/login?role=user");
        return;
      }

      toast.error(
        error?.response?.data?.message || "Не удалось открыть переписку с продавцом."
      );
    }
  };

  const decrementCount = () => {
    if (count > 1) {
      setCount(count - 1);
    }
  };

  const incrementCount = () => {
    setCount(count + 1);
  };

  const addToCartHandler = (id) => {
    if (isShoppingRestricted) {
      toast.error("Аккаунты продавца и администратора не могут добавлять товары в корзину.");
      return;
    }

    const isItemExists = cart && cart.find((i) => i._id === id);

    if (isItemExists) {
      toast.error("Товар уже в корзине!");
    } else if (data.stock < count) {
      toast.error("Количество товара ограничено!");
    } else {
      const cartData = { ...data, qty: count };
      dispatch(addTocart(cartData));
      toast.success("Товар успешно добавлен в корзину!");
    }
  };

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

  return (
    <>
      <div className="bg-[#fff]">
        {data ? (
          <div className="fixed w-full h-screen top-0 left-0 bg-[#00000030] z-40 flex items-center justify-center">
            <div className="w-[90%] 800px:w-[60%] h-[90vh] overflow-y-scroll 800px:h-[75vh] bg-white rounded-md shadow-sm relative p-4">
              <RxCross1
                size={30}
                className="absolute right-3 top-3 z-50"
                onClick={() => setOpen(false)}
              />

              <div className="block w-full 800px:flex">
                <div className="w-full 800px:w-[50%]">
                  <img
                    src={`${backend_url}${data.images && data.images[0]}`}
                    alt="img"
                  />
                  <div className="flex">
                    <Link to={`/shop/preview/${data.shop._id}`} className="flex">
                      <img
                        src={`${backend_url}${data?.shop?.avatar}`}
                        alt=""
                        className="w-[50px] h-[50px] rounded-full mr-2"
                      />
                      <div>
                        <h3 className={`${styles.shop_name}`}>{data.shop.name}</h3>
                        <h5 className="pb-3 text-[15px]">
                          {data.ratings ? `(${data.ratings}/5) Рейтинг` : "(-/5) Рейтинг"}
                        </h5>
                      </div>
                    </Link>
                  </div>
                  <div
                    className={`${styles.button} bg-[#000] mt-4 rounded-[4px] h-11`}
                    onClick={handleMessageSubmit}
                  >
                    <span className="text-[#fff] flex items-center">
                      Отправить сообщение <AiOutlineMessage className="ml-1" />
                    </span>
                  </div>
                </div>

                <div className="w-full 800px:w-[50%] pt-5 pl-[5px] pr-[5px]">
                  <h1 className={`${styles.productTitle} text-[20px]`}>{data.name}</h1>
                  <p>{data.description}</p>

                  <div className="flex pt-3">
                    <h4 className={`${styles.productoriginalPrice}`}>{data.originalPrice} тг</h4>
                    <h3 className={`${styles.price}`}>{data.unit}</h3>
                  </div>

                  {!isShoppingRestricted && (
                    <>
                      <div className="flex items-center mt-12 justify-between pr-3">
                        <div className="flex items-center">
                          <button
                            className="bg-green-500 text-white font-bold px-4 py-2 shadow-lg hover:opacity-75 transition duration-300 ease-in-out rounded-l"
                            onClick={decrementCount}
                          >
                            -
                          </button>
                          <span className="bg-gray-200 text-gray-800 font-medium px-4 py-2">
                            {count}
                          </span>
                          <button
                            className="bg-green-500 text-white font-bold px-4 py-2 shadow-lg hover:opacity-75 transition duration-300 ease-in-out rounded-r"
                            onClick={incrementCount}
                          >
                            +
                          </button>
                        </div>

                        <div>
                          {click ? (
                            <AiFillHeart
                              size={30}
                              className="cursor-pointer"
                              onClick={() => removeFromWishlistHandler(data)}
                              color="red"
                              title="Remove from wishlist"
                            />
                          ) : (
                            <AiOutlineHeart
                              size={30}
                              className="cursor-pointer"
                              onClick={() => addToWishlistHandler(data)}
                              title="Добавить в избранное"
                            />
                          )}
                        </div>
                      </div>

                      <div
                        className={`${styles.button} mt-6 rounded-[4px] h-11 flex items-center`}
                        onClick={() => addToCartHandler(data._id)}
                      >
                        <span className="text-[#fff] flex items-center">
                          Добавить в корзину <AiOutlineShoppingCart className="ml-1" />
                        </span>
                      </div>
                    </>
                  )}

                  <h5 className="text-[16px] text-[rgb(104,210,132)] mt-5">
                    Продано ({data.sold_out})
                  </h5>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
};

export default ProductDetailsCard;
