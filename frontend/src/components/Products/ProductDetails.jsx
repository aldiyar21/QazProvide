import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "../../styles/styles";
import {
  AiFillHeart,
  AiOutlineHeart,
  AiOutlineMessage,
  AiOutlineShoppingCart,
} from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { getAllProductsShop } from "../../redux/actions/product";
import { backend_url, server } from "../../server";
import {
  addToWishlist,
  removeFromWishlist,
} from "../../redux/actions/wishlist";
import { addTocart } from "../../redux/actions/cart";
import { toast } from "react-toastify";
import Ratings from "./Ratings";
import axios from "axios";

const ProductDetails = ({ data }) => {
  const { products } = useSelector((state) => state.products);
  const { user, isAuthenticated } = useSelector((state) => state.user);
  const { isSeller } = useSelector((state) => state.seller);
  const { wishlist } = useSelector((state) => state.wishlist);
  const { cart } = useSelector((state) => state.cart);
  const isShoppingRestricted = isSeller || user?.role === "Admin";
  const dispatch = useDispatch();

  const [count, setCount] = useState(1);
  const [click, setClick] = useState(false);
  const [select, setSelect] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(getAllProductsShop(data && data?.shop._id));
    if (wishlist && wishlist.find((i) => i._id === data?._id)) {
      setClick(true);
    } else {
      setClick(false);
    }
  }, [data, wishlist, dispatch]);

  const handleCountChange = (e) => {
    const value = e.target.value;
    if (value === "" || (!isNaN(value) && parseInt(value, 10) >= 1)) {
      setCount(value);
    }
  };

  const incrementCount = () => {
    setCount((prevCount) => (prevCount === "" ? 1 : parseInt(prevCount, 10) + 1));
  };

  const decrementCount = () => {
    setCount((prevCount) => {
      if (prevCount === "" || parseInt(prevCount, 10) <= 1) {
        return 1;
      }
      return parseInt(prevCount, 10) - 1;
    });
  };

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
      toast.error("Товар закончился на складе!");
    } else {
      const cartData = { ...data, qty: count };
      dispatch(addTocart(cartData));
      toast.success("Товар успешно добавлен в корзину!");
    }
  };

  const totalReviewsLength =
    products &&
    products.reduce((acc, product) => acc + product.reviews.length, 0);

  const totalRatings =
    products &&
    products.reduce(
      (acc, product) =>
        acc + product.reviews.reduce((sum, review) => sum + review.rating, 0),
      0
    );

  const avg = totalRatings / totalReviewsLength || 0;
  const averageRating = avg.toFixed(2);

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

  return (
    <div className="bg-[linear-gradient(180deg,#fffdf7_0%,#ffffff_36%,#f8faf7_100%)]">
      {data ? (
        <div className={`${styles.section} w-[90%] 800px:w-[80%]`}>
          <div className="w-full py-5">
            <div className="block w-full gap-10 800px:flex">
              <div className="w-full 800px:w-[50%]">
                <div className="rounded-[28px] border border-[#edf0e8] bg-white p-4 shadow-[0_12px_40px_rgba(35,38,32,0.06)]">
                  <img
                    src={`${backend_url}${data && data.images[select]}`}
                    alt=""
                    className="h-[450px] w-full rounded-[22px] object-cover"
                  />
                  <div className="flex flex-wrap gap-3 pt-4">
                    {data &&
                      data.images.map((image, index) => (
                        <div
                          className={`${select === index ? "border-[#f78f19] ring-2 ring-[#f78f1935]" : "border-transparent"} cursor-pointer overflow-hidden rounded-[16px] border bg-[#f7f8f5]`}
                          key={index}
                        >
                          <img
                            src={`${backend_url}${image}`}
                            alt=""
                            className="h-[92px] w-[92px] object-cover"
                            onClick={() => setSelect(index)}
                          />
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div className="w-full pt-5 800px:w-[50%]">
                <div className="rounded-[28px] border border-[#edf0e8] bg-white p-6 shadow-[0_12px_40px_rgba(35,38,32,0.06)]">
                  <div className="mb-4 flex flex-wrap gap-3">
                    <span className="rounded-full bg-[#fef1e3] px-4 py-2 text-[13px] font-[700] text-[#a95e10]">
                      {data.category}
                    </span>
                    <span className="rounded-full bg-[#edf7ef] px-4 py-2 text-[13px] font-[700] text-[#2f7a43]">
                      Продано {data?.sold_out || 0}
                    </span>
                    <span className="rounded-full bg-[#f4f5f7] px-4 py-2 text-[13px] font-[700] text-[#59606d]">
                      В наличии {data?.stock || 0}
                    </span>
                  </div>

                  <h1 className={`${styles.productTitle} text-[#20231d]`}>{data.name}</h1>

                  <div className="flex items-center gap-3 pt-3">
                    <Ratings rating={data?.ratings} />
                    <span className="text-[15px] font-[600] text-[#666d62]">
                      {data?.ratings ? Number(data.ratings).toFixed(1) : "0.0"} из 5
                    </span>
                    <span className="text-[15px] text-[#858b82]">
                      {data?.reviews?.length || 0} отзывов
                    </span>
                  </div>

                  <p className="pt-5 leading-8 text-[#4b5047]">{data.description}</p>

                  <div className="flex items-center pt-5">
                    <h4 className={`${styles.productoriginalPrice}`}>{data.originalPrice} тг</h4>
                    <h3 className={`${styles.price}`}>{data.unit}</h3>
                  </div>

                  {!isShoppingRestricted && (
                    <>
                      <div className="mt-10 flex flex-col gap-5 pr-3 800px:flex-row 800px:items-center 800px:justify-between">
                        <div className="flex items-center">
                          <button
                            className="rounded-l-xl bg-[#3f8f4c] px-4 py-3 font-bold text-white shadow-lg transition duration-300 ease-in-out hover:opacity-75"
                            onClick={decrementCount}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            className="w-[64px] bg-[#eef2eb] px-4 py-3 text-center font-medium text-gray-800"
                            value={count}
                            onChange={handleCountChange}
                            min="1"
                          />
                          <button
                            className="rounded-r-xl bg-[#3f8f4c] px-4 py-3 font-bold text-white shadow-lg transition duration-300 ease-in-out hover:opacity-75"
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
                              title="Удалить из избранного"
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
                        className={`${styles.button} !mt-6 !h-12 !rounded-[16px] flex items-center shadow-[0_16px_35px_rgba(247,143,25,0.22)]`}
                        onClick={() => addToCartHandler(data._id)}
                      >
                        <span className="flex items-center text-white">
                          В корзину <AiOutlineShoppingCart className="ml-2" />
                        </span>
                      </div>
                    </>
                  )}

                  <div className="mt-8 flex flex-col gap-4 rounded-[22px] bg-[#f7f8f4] p-4 800px:flex-row 800px:items-center 800px:justify-between">
                    <div className="flex items-center">
                      <Link to={`/shop/preview/${data?.shop._id}`}>
                        <img
                          src={`${backend_url}${data?.shop?.avatar}`}
                          alt=""
                          className="mr-3 h-[56px] w-[56px] rounded-full border-2 border-white object-cover"
                        />
                      </Link>

                      <div className="pr-8">
                        <Link to={`/shop/preview/${data?.shop._id}`}>
                          <h3 className={`${styles.shop_name} cursor-pointer pb-1 pt-1`}>
                            {data.shop.name}
                          </h3>
                        </Link>
                        <h5 className="pb-3 text-[15px]">({averageRating}/5) Рейтинг</h5>
                      </div>
                    </div>

                    <div
                      className={`${styles.button} !mt-0 !h-11 !rounded-[14px] flex items-center`}
                      onClick={handleMessageSubmit}
                    >
                      <span className="flex items-center text-white">
                        Сообщение <AiOutlineMessage className="ml-2" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <ProductDetailsInfo
            data={data}
            products={products}
            totalReviewsLength={totalReviewsLength}
            averageRating={averageRating}
          />
          <br />
          <br />
        </div>
      ) : null}
    </div>
  );
};

const ProductDetailsInfo = ({
  data,
  products,
  totalReviewsLength,
  averageRating,
}) => {
  const [active, setActive] = useState(1);

  return (
    <div className="rounded-[28px] border border-[#edf0e8] bg-white px-3 py-2 shadow-[0_12px_40px_rgba(35,38,32,0.06)] 800px:px-10">
      <div className="flex w-full flex-wrap gap-6 border-b border-[#edf0e8] pt-10 pb-2">
        <div className="relative">
          <h5
            className="cursor-pointer px-1 text-[18px] font-[600] leading-5 text-[#000] 800px:text-[20px]"
            onClick={() => setActive(1)}
          >
            Детали продукта
          </h5>
          {active === 1 ? <div className={`${styles.active_indicator}`} /> : null}
        </div>

        <div className="relative">
          <h5
            className="cursor-pointer px-1 text-[18px] font-[600] leading-5 text-[#000] 800px:text-[20px]"
            onClick={() => setActive(2)}
          >
            Отзывы о продукте
          </h5>
          {active === 2 ? <div className={`${styles.active_indicator}`} /> : null}
        </div>

        <div className="relative">
          <h5
            className="cursor-pointer px-1 text-[18px] font-[600] leading-5 text-[#000] 800px:text-[20px]"
            onClick={() => setActive(3)}
          >
            Информация о продавце
          </h5>
          {active === 3 ? <div className={`${styles.active_indicator}`} /> : null}
        </div>
      </div>

      {active === 1 ? (
        <p className="whitespace-pre-line py-4 pb-10 text-[17px] leading-8 text-[#4b5047]">
          {data.description}
        </p>
      ) : null}

      {active === 2 ? (
        <div className="flex min-h-[40vh] w-full flex-col items-center py-5">
          {data &&
            data.reviews.map((item, index) => (
              <div
                className="my-2 flex w-full rounded-[20px] border border-[#edf0e8] bg-[#fafbf8] p-4"
                key={index}
              >
                <img
                  src={`${backend_url}/${item.user.avatar}`}
                  alt=""
                  className="h-[50px] w-[50px] rounded-full object-cover"
                />
                <div className="pl-3">
                  <div className="flex w-full items-center">
                    <h1 className="mr-3 font-[600]">{item.user.name}</h1>
                    <Ratings rating={item.rating} />
                  </div>
                  <p className="pt-2 text-[#51564e]">
                    {item.comment || "Покупатель поставил оценку без комментария."}
                  </p>
                </div>
              </div>
            ))}

          <div className="flex w-full justify-center">
            {data && data.reviews.length === 0 && (
              <h5 className="rounded-[18px] bg-[#f7f8f4] px-5 py-4 text-[#646a62]">
                Отзывов на этот продукт пока нет.
              </h5>
            )}
          </div>
        </div>
      ) : null}

      {active === 3 ? (
        <div className="block w-full p-5 800px:flex">
          <div className="w-full 800px:w-[50%]">
            <div className="flex items-center">
              <Link to={`/shop/preview/${data.shop._id}`}>
                <div className="flex items-center">
                  <img
                    src={`${backend_url}${data?.shop?.avatar}`}
                    className="h-[56px] w-[56px] rounded-full border-2 border-white object-cover"
                    alt=""
                  />
                  <div className="pl-3">
                    <h3 className={`${styles.shop_name}`}>{data.shop.name}</h3>
                    <h5 className="pb-3 text-[15px]">({averageRating}/5) Рейтинг</h5>
                  </div>
                </div>
              </Link>
            </div>

            <p className="pt-2 leading-8 text-[#4b5047]">{data.shop.description}</p>
          </div>

          <div className="mt-5 w-full 800px:mt-0 800px:flex 800px:w-[50%] 800px:flex-col 800px:items-end">
            <div className="rounded-[22px] bg-[#f7f8f4] p-5 text-left">
              <h5 className="font-[600]">
                Присоединился:{" "}
                <span className="font-[500]">{data.shop?.createdAt?.slice(0, 10)}</span>
              </h5>
              <h5 className="pt-3 font-[600]">
                Всего продуктов:{" "}
                <span className="font-[500]">{products && products.length}</span>
              </h5>
              <h5 className="pt-3 font-[600]">
                Всего отзывов: <span className="font-[500]">{totalReviewsLength}</span>
              </h5>
              <Link to={`/shop/preview/${data.shop._id}`}>
                <div className={`${styles.button} mt-4 !h-[42px] !rounded-[12px]`}>
                  <h4 className="text-white">Посетить магазин</h4>
                </div>
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ProductDetails;
