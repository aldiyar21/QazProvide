import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import socketIO from "socket.io-client";
import { format } from "timeago.js";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AiOutlineArrowRight, AiOutlineSend } from "react-icons/ai";
import { TfiGallery } from "react-icons/tfi";

import Header from "../components/Layout/Header";
import { backend_url, server } from "../server";

const ENDPOINT = "http://localhost:4000/";
const socketId = socketIO(ENDPOINT, { transports: ["websocket"] });
const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/8801/8801434.png";

const UserInbox = ({ embedded = false }) => {
  const { user, loading } = useSelector((state) => state.user);
  const [conversations, setConversations] = useState([]);
  const [arrivalMessage, setArrivalMessage] = useState(null);
  const [currentChat, setCurrentChat] = useState();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [, setImages] = useState();
  const [activeStatus, setActiveStatus] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    socketId.on("getMessage", (data) => {
      setArrivalMessage({
        sender: data.senderId,
        text: data.text,
        createdAt: Date.now(),
      });
    });
  }, []);

  useEffect(() => {
    arrivalMessage &&
      currentChat?.members.includes(arrivalMessage.sender) &&
      setMessages((prev) => [...prev, arrivalMessage]);
  }, [arrivalMessage, currentChat]);

  useEffect(() => {
    const getConversation = async () => {
      try {
        const response = await axios.get(
          `${server}/conversation/get-all-conversation-user/${user?._id}`,
          {
            withCredentials: true,
          }
        );
        setConversations(response.data.conversations);
      } catch (error) {
        console.log(error);
      }
    };

    if (user?._id) {
      getConversation();
    }
  }, [user, messages]);

  useEffect(() => {
    if (user) {
      socketId.emit("addUser", user?._id);
      socketId.on("getUsers", (data) => {
        setOnlineUsers(data);
      });
    }
  }, [user]);

  const onlineCheck = (chat) => {
    const chatMembers = chat.members.find((member) => member !== user?._id);
    const online = onlineUsers.find((user) => user.userId === chatMembers);

    return online ? true : false;
  };

  useEffect(() => {
    const getMessage = async () => {
      if (!currentChat?._id) return;

      try {
        const response = await axios.get(
          `${server}/message/get-all-messages/${currentChat?._id}`
        );
        setMessages(response.data.messages);
      } catch (error) {
        console.log(error);
      }
    };

    getMessage();
  }, [currentChat]);

  const sendMessageHandler = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !currentChat?._id) return;

    const message = {
      sender: user._id,
      text: newMessage,
      conversationId: currentChat._id,
    };
    const receiverId = currentChat.members.find((member) => member !== user?._id);

    socketId.emit("sendMessage", {
      senderId: user?._id,
      receiverId,
      text: newMessage,
    });

    try {
      const res = await axios.post(`${server}/message/create-new-message`, message);
      setMessages([...messages, res.data.message]);
      updateLastMessage();
    } catch (error) {
      console.log(error);
    }
  };

  const updateLastMessage = async () => {
    socketId.emit("updateLastMessage", {
      lastMessage: newMessage,
      lastMessageId: user._id,
    });

    await axios
      .put(`${server}/conversation/update-last-message/${currentChat._id}`, {
        lastMessage: newMessage,
        lastMessageId: user._id,
      })
      .then(() => {
        setNewMessage("");
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handleImageUpload = async (e) => {
    const reader = new FileReader();
    const file = e.target.files?.[0];

    if (!file || !currentChat?._id) return;

    reader.onload = () => {
      if (reader.readyState === 2) {
        setImages(reader.result);
        imageSendingHandler(reader.result);
      }
    };

    reader.readAsDataURL(file);
  };

  const imageSendingHandler = async (image) => {
    const receiverId = currentChat.members.find((member) => member !== user._id);

    socketId.emit("sendMessage", {
      senderId: user._id,
      receiverId,
      images: image,
    });

    try {
      await axios
        .post(`${server}/message/create-new-message`, {
          images: image,
          sender: user._id,
          text: newMessage,
          conversationId: currentChat._id,
        })
        .then((res) => {
          setImages();
          setMessages([...messages, res.data.message]);
          updateLastMessageForImage();
        });
    } catch (error) {
      console.log(error);
    }
  };

  const updateLastMessageForImage = async () => {
    await axios.put(`${server}/conversation/update-last-message/${currentChat._id}`, {
      lastMessage: "Фото",
      lastMessageId: user._id,
    });
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behaviour: "smooth" });
  }, [messages]);

  return (
    <div className={embedded ? "w-full" : "min-h-screen bg-[#f4f8f1]"}>
      {!embedded && <Header />}
      <main className={embedded ? "w-full px-4 800px:px-6" : "mx-auto w-full max-w-[1220px] px-4 py-6 800px:px-6"}>
        <div className="overflow-hidden rounded-[28px] border border-[#dce9d4] bg-white shadow-[0_24px_70px_rgba(29,78,30,0.12)]">
          <div className="relative overflow-hidden bg-gradient-to-r from-[#0b6d23] via-[#15913a] to-[#9bc53d] px-6 py-7 text-white">
            <div className="absolute right-[-90px] top-[-110px] h-[250px] w-[250px] rounded-full bg-white/15" />
            <p className="relative text-sm font-semibold uppercase tracking-[0.28em] text-white/75">
              QazProvide inbox
            </p>
            <div className="relative mt-2 flex flex-col justify-between gap-4 800px:flex-row 800px:items-end">
              <div>
                <h1 className="text-[30px] font-[800] leading-tight 800px:text-[38px]">
                  Все сообщения
                </h1>
                <p className="mt-2 max-w-[620px] text-[15px] text-white/85">
                  Общайтесь с магазинами, уточняйте наличие и сохраняйте историю диалогов в одном месте.
                </p>
              </div>
              <div className="rounded-2xl bg-white/15 px-4 py-3 text-sm backdrop-blur">
                <span className="font-bold">{conversations.length}</span> диалогов
              </div>
            </div>
          </div>

          {!open ? (
            <div className="grid min-h-[560px] grid-cols-1 bg-[#f8fbf5] 1000px:grid-cols-[420px_1fr]">
              <aside className="border-r border-[#e3eddc] bg-white">
                <div className="border-b border-[#edf4e9] p-5">
                  <h2 className="text-[22px] font-[700] text-[#173d21]">
                    Диалоги с магазинами
                  </h2>
                  <p className="mt-1 text-sm text-[#6d7d69]">
                    Выберите магазин, чтобы продолжить переписку.
                  </p>
                </div>
                <div className="max-h-[640px] space-y-2 overflow-y-auto p-3">
                  {conversations?.length ? (
                    conversations.map((item, index) => (
                      <MessageList
                        data={item}
                        key={item._id || index}
                        index={index}
                        setOpen={setOpen}
                        setCurrentChat={setCurrentChat}
                        me={user?._id}
                        online={onlineCheck(item)}
                        setActiveStatus={setActiveStatus}
                        loading={loading}
                        setSelectedUser={setSelectedUser}
                      />
                    ))
                  ) : (
                    <EmptyState />
                  )}
                </div>
              </aside>
              <div className="hidden items-center justify-center p-10 1000px:flex">
                <div className="max-w-[440px] rounded-[26px] border border-dashed border-[#bfd7b5] bg-white/80 p-8 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e9f6df] text-[28px] text-[#198c37]">
                    @
                  </div>
                  <h3 className="mt-5 text-[24px] font-[800] text-[#173d21]">
                    Выберите диалог
                  </h3>
                  <p className="mt-2 text-[15px] leading-7 text-[#6d7d69]">
                    Здесь появятся сообщения, вложения и быстрый ответ выбранному магазину.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <SellerInbox
              setOpen={setOpen}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              sendMessageHandler={sendMessageHandler}
              messages={messages}
              sellerId={user._id}
              userData={selectedUser}
              activeStatus={activeStatus}
              scrollRef={scrollRef}
              handleImageUpload={handleImageUpload}
            />
          )}
        </div>
      </main>
    </div>
  );
};

const EmptyState = () => (
  <div className="rounded-3xl border border-dashed border-[#d6e6cf] bg-[#fbfdf8] p-8 text-center">
    <div className="mx-auto h-12 w-12 rounded-2xl bg-[#edf8e7]" />
    <h3 className="mt-4 text-[18px] font-[700] text-[#173d21]">Пока нет сообщений</h3>
    <p className="mt-2 text-sm leading-6 text-[#7b8977]">
      Начните диалог с карточки товара или страницы заказа.
    </p>
  </div>
);

const MessageList = ({
  data,
  index,
  setOpen,
  setCurrentChat,
  me,
  online,
  setActiveStatus,
  loading,
  setSelectedUser,
}) => {
  const [active, setActive] = useState(0);
  const [shop, setShop] = useState(null);
  const navigate = useNavigate();

  const handleClick = (id) => {
    navigate(`/inbox?${id}`);
    setOpen(true);
  };

  useEffect(() => {
    setActiveStatus(online);
    const userId = data.members.find((user) => user !== me);

    const getUser = async () => {
      try {
        const res = await axios.get(`${server}/shop/get-shop-info/${userId}`);
        setShop(res.data.shop);
        setSelectedUser(res.data.shop);
      } catch (error) {
        console.log(error);
      }
    };

    if (userId) {
      getUser();
    }
  }, [me, data, setActiveStatus, online, setSelectedUser]);

  const lastMessageAuthor =
    !loading && data?.lastMessageId !== shop?._id
      ? "Вы"
      : shop?.name?.split(" ")[0] || "Магазин";

  return (
    <button
      type="button"
      className={`group flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-200 ${
        active === index
          ? "border-[#b7dbaa] bg-[#f0faeb] shadow-sm"
          : "border-transparent bg-white hover:border-[#d9ead2] hover:bg-[#f8fcf5]"
      }`}
      onClick={() => {
        setActive(index);
        handleClick(data._id);
        setCurrentChat(data);
        setSelectedUser(shop);
        setActiveStatus(online);
      }}
    >
      <div className="relative shrink-0">
        <img
          src={shop?.avatar ? `${backend_url}${shop.avatar}` : defaultAvatar}
          alt={shop?.name || "Магазин"}
          className="h-[54px] w-[54px] rounded-2xl object-cover ring-2 ring-white"
        />
        <span
          className={`absolute bottom-[-1px] right-[-1px] h-[14px] w-[14px] rounded-full border-2 border-white ${
            online ? "bg-[#25c45a]" : "bg-[#b7beb2]"
          }`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <h3 className="truncate text-[16px] font-[700] text-[#173d21]">
            {shop?.name || "Магазин"}
          </h3>
          <span className="text-[11px] font-[600] uppercase tracking-wide text-[#90a08b]">
            {online ? "online" : "offline"}
          </span>
        </div>
        <p className="mt-1 truncate text-[14px] text-[#667461]">
          <span className="font-[700] text-[#2f5d39]">{lastMessageAuthor}: </span>
          {data?.lastMessage || "Диалог создан"}
        </p>
      </div>
    </button>
  );
};

const SellerInbox = ({
  setOpen,
  newMessage,
  setNewMessage,
  sendMessageHandler,
  messages,
  sellerId,
  userData,
  activeStatus,
  scrollRef,
  handleImageUpload,
}) => {
  return (
    <div className="flex min-h-[660px] flex-col bg-[#f8fbf5]">
      <div className="flex items-center justify-between border-b border-[#e3eddc] bg-white px-5 py-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={userData?.avatar ? `${backend_url}${userData.avatar}` : defaultAvatar}
              alt={userData?.name || "Магазин"}
              className="h-[62px] w-[62px] rounded-2xl object-cover"
            />
            <span
              className={`absolute bottom-[-2px] right-[-2px] h-[15px] w-[15px] rounded-full border-2 border-white ${
                activeStatus ? "bg-[#25c45a]" : "bg-[#b7beb2]"
              }`}
            />
          </div>
          <div>
            <p className="text-xs font-[700] uppercase tracking-[0.22em] text-[#8da284]">
              Диалог с магазином
            </p>
            <h2 className="mt-1 text-[20px] font-[800] text-[#173d21]">
              {userData?.name || "Магазин"}
            </h2>
            <p className="text-sm text-[#6f7d6b]">
              {activeStatus ? "Сейчас онлайн" : "Не в сети"}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#dce9d4] bg-[#f8fbf5] text-[#24552d] transition hover:bg-[#eaf7e3]"
          onClick={() => setOpen(false)}
          aria-label="Вернуться к списку сообщений"
        >
          <AiOutlineArrowRight size={20} />
        </button>
      </div>

      <div className="h-[calc(100vh-330px)] min-h-[420px] overflow-y-auto px-4 py-6 800px:px-8">
        {messages?.length ? (
          messages.map((item, index) => (
            <div
              className={`mb-4 flex w-full ${
                item.sender === sellerId ? "justify-end" : "justify-start"
              }`}
              ref={scrollRef}
              key={item._id || index}
            >
              {item.sender !== sellerId && (
                <img
                  src={userData?.avatar ? `${backend_url}${userData.avatar}` : defaultAvatar}
                  className="mr-3 h-[38px] w-[38px] rounded-2xl object-cover"
                  alt={userData?.name || "Магазин"}
                />
              )}
              <div
                className={`max-w-[78%] ${
                  item.sender === sellerId ? "items-end" : "items-start"
                } flex flex-col`}
              >
                {item.images && (
                  <img
                    src={item.images.startsWith("data:") ? item.images : `${backend_url}${item.images}`}
                    className="mb-2 h-[260px] w-[260px] rounded-[22px] object-cover shadow-sm"
                    alt="Вложение"
                  />
                )}
                {item.text !== "" && (
                  <div
                    className={`rounded-[22px] px-4 py-3 text-[15px] leading-6 shadow-sm ${
                      item.sender === sellerId
                        ? "rounded-br-md bg-[#173d21] text-white"
                        : "rounded-bl-md bg-white text-[#22331f] ring-1 ring-[#e4eddf]"
                    }`}
                  >
                    {item.text}
                  </div>
                )}
                <p className="mt-1 px-1 text-[12px] text-[#879181]">
                  {format(item.createdAt)}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="flex h-full items-center justify-center text-center">
            <div>
              <div className="mx-auto h-14 w-14 rounded-2xl bg-[#eaf7e3]" />
              <h3 className="mt-4 text-[20px] font-[800] text-[#173d21]">
                Сообщений пока нет
              </h3>
              <p className="mt-2 text-sm text-[#74816f]">
                Напишите первым, чтобы начать диалог.
              </p>
            </div>
          </div>
        )}
      </div>

      <form
        className="flex items-center gap-3 border-t border-[#e3eddc] bg-white p-4"
        onSubmit={sendMessageHandler}
      >
        <input
          type="file"
          id="user-message-image"
          className="hidden"
          onChange={handleImageUpload}
        />
        <label
          htmlFor="user-message-image"
          className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-[#edf7e8] text-[#247034] transition hover:bg-[#ddf0d3]"
          title="Прикрепить изображение"
        >
          <TfiGallery size={20} />
        </label>
        <input
          type="text"
          required
          placeholder="Введите сообщение..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="h-12 flex-1 rounded-2xl border border-[#dce9d4] bg-[#f8fbf5] px-4 text-[15px] outline-none transition placeholder:text-[#96a390] focus:border-[#148b36] focus:bg-white"
        />
        <button
          type="submit"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#148b36] text-white shadow-[0_12px_24px_rgba(20,139,54,0.28)] transition hover:bg-[#0f742d]"
          aria-label="Отправить сообщение"
        >
          <AiOutlineSend size={22} />
        </button>
      </form>
    </div>
  );
};

export default UserInbox;
