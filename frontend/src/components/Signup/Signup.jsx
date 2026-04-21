import React, { useEffect, useMemo, useState } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import styles from "../../styles/styles";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { RxAvatar } from "react-icons/rx";
import axios from "axios";
import { server } from "../../server";
import { toast } from "react-toastify";

const SIGNUP_ROLES = [
  { value: "user", label: "Покупатель" },
  { value: "shop", label: "Магазин" },
];

const Signup = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [avatar, setAvatar] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [zipCode, setZipCode] = useState("");

  const selectedRole = useMemo(() => {
    const role = searchParams.get("role");
    return SIGNUP_ROLES.some((item) => item.value === role) ? role : "user";
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get("role") !== selectedRole) {
      setSearchParams({ role: selectedRole }, { replace: true });
    }
  }, [searchParams, selectedRole, setSearchParams]);

  const handleRoleChange = (role) => {
    setSearchParams({ role });
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    setAvatar(file);
  };

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setAvatar(null);
    setPhoneNumber("");
    setAddress("");
    setZipCode("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!avatar) {
      toast.error("Пожалуйста, загрузите изображение профиля.");
      return;
    }

    const config = { headers: { "Content-Type": "multipart/form-data" } };
    const newForm = new FormData();
    newForm.append("file", avatar);
    newForm.append("name", name);
    newForm.append("email", email);
    newForm.append("password", password);

    if (selectedRole === "shop") {
      newForm.append("zipCode", zipCode);
      newForm.append("address", address);
      newForm.append("phoneNumber", phoneNumber);
    }

    try {
      const endpoint =
        selectedRole === "shop"
          ? `${server}/shop/create-shop`
          : `${server}/user/create-user`;

      const { data } = await axios.post(endpoint, newForm, config);

      toast.success(data.message);
      resetForm();
      navigate(
        selectedRole === "shop" ? "/login?role=shop" : "/login?role=user"
      );
    } catch (error) {
      toast.error(error?.response?.data?.message || "Не удалось зарегистрироваться.");
    }
  };

  const loginLink =
    selectedRole === "shop" ? "/login?role=shop" : "/login?role=user";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Регистрация
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Выберите, кем вы хотите зарегистрироваться
        </p>
      </div>
      <div
        className={`mt-8 sm:mx-auto sm:w-full ${
          selectedRole === "shop" ? "sm:max-w-[35rem]" : "sm:max-w-md"
        }`}
      >
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="grid grid-cols-2 gap-2 mb-6">
            {SIGNUP_ROLES.map((role) => (
              <button
                key={role.value}
                type="button"
                onClick={() => handleRoleChange(role.value)}
                className={`h-[42px] rounded-md border text-sm font-medium transition ${
                  selectedRole === role.value
                    ? "bg-green-600 border-green-600 text-white"
                    : "bg-white border-gray-300 text-gray-700 hover:border-green-500"
                }`}
              >
                {role.label}
              </button>
            ))}
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                {selectedRole === "shop" ? "Название магазина" : "Полное имя"}
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="name"
                  required
                  placeholder={
                    selectedRole === "shop"
                      ? "Введите название магазина"
                      : "Введите свое полное имя"
                  }
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
            </div>

            {selectedRole === "shop" && (
              <div>
                <label
                  htmlFor="phone-number"
                  className="block text-sm font-medium text-gray-700"
                >
                  Номер телефона
                </label>
                <div className="mt-1">
                  <input
                    type="number"
                    name="phone-number"
                    required
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Адрес электронной почты
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  placeholder="Введите адрес электронной почты"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
              </div>
            </div>

            {selectedRole === "shop" && (
              <>
                <div>
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Адрес
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name="address"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="zipcode"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Почтовый индекс
                  </label>
                  <div className="mt-1">
                    <input
                      type="number"
                      name="zipcode"
                      required
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Пароль
              </label>
              <div className="mt-1 relative">
                <input
                  type={visible ? "text" : "password"}
                  name="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                />
                {visible ? (
                  <AiOutlineEye
                    className="absolute right-2 top-2 cursor-pointer"
                    size={25}
                    onClick={() => setVisible(false)}
                  />
                ) : (
                  <AiOutlineEyeInvisible
                    className="absolute right-2 top-2 cursor-pointer"
                    size={25}
                    onClick={() => setVisible(true)}
                  />
                )}
              </div>
            </div>

            <div>
              <div className="mt-2 flex items-center">
                <span className="inline-block h-8 w-8 rounded-full overflow-hidden">
                  {avatar ? (
                    <img
                      src={URL.createObjectURL(avatar)}
                      alt="avatar"
                      className="h-full w-full object-cover rounded-full"
                    />
                  ) : (
                    <RxAvatar className="h-8 w-8" />
                  )}
                </span>
                <label
                  htmlFor="file-input"
                  className="ml-5 flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <span>Загрузить изображение</span>
                  <input
                    type="file"
                    name="avatar"
                    id="file-input"
                    accept=".jpg,.jpeg,.png"
                    onChange={handleFileInputChange}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className='group relative w-full h-[40px] flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700'
              >
                Зарегистрироваться
              </button>
            </div>

            <div className={`${styles.normalFlex} w-full`}>
              <h4>Уже есть учетная запись?</h4>
              <Link to={loginLink} className="text-green-600 pl-2">
                Войти
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
