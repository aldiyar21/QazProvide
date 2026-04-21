import React, { useEffect, useMemo, useState } from "react";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import styles from "../../styles/styles";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { server } from "../../server";
import { toast } from "react-toastify";

const LOGIN_ROLES = [
  { value: "user", label: "Покупатель" },
  { value: "shop", label: "Магазин" },
  { value: "admin", label: "Администратор" },
];

const Login = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);

  const selectedRole = useMemo(() => {
    const role = searchParams.get("role");
    return LOGIN_ROLES.some((item) => item.value === role) ? role : "user";
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get("role") !== selectedRole) {
      setSearchParams({ role: selectedRole }, { replace: true });
    }
  }, [searchParams, selectedRole, setSearchParams]);

  const handleRoleChange = (role) => {
    setSearchParams({ role });
  };

  const handleUserLogin = async () => {
    const { data } = await axios.post(
      `${server}/user/login-user`,
      { email, password },
      { withCredentials: true }
    );

    const loggedInUser = data.user;

    if (selectedRole === "admin" && loggedInUser?.role !== "Admin") {
      await axios.get(`${server}/user/logout`, { withCredentials: true });
      throw new Error("Для входа как администратор нужна учетная запись администратора.");
    }

    if (selectedRole === "user" && loggedInUser?.role === "Admin") {
      await axios.get(`${server}/user/logout`, { withCredentials: true });
      throw new Error("Этот аккаунт относится к администратору. Выберите роль администратора.");
    }

    toast.success("Успешный вход!");

    if (loggedInUser?.role === "Admin") {
      navigate("/admin/dashboard");
    } else {
      navigate("/");
    }

    window.location.reload(true);
  };

  const handleSellerLogin = async () => {
    await axios.post(
      `${server}/shop/login-shop`,
      { email, password },
      { withCredentials: true }
    );

    toast.success("Успешный вход!");
    navigate("/dashboard");
    window.location.reload(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (selectedRole === "shop") {
        await handleSellerLogin();
      } else {
        await handleUserLogin();
      }
    } catch (err) {
      const errorMessage =
        err?.response?.data?.message || err.message || "Не удалось выполнить вход.";
      toast.error(errorMessage);
    }
  };

  const signUpLink =
    selectedRole === "shop" ? "/sign-up?role=shop" : "/sign-up?role=user";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Вход
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Выберите, от чьего имени хотите войти в систему
        </p>
      </div>
      <div className="mt-8 sm:mx-auto sw:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="grid grid-cols-3 gap-2 mb-6">
            {LOGIN_ROLES.map((role) => (
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
                  autoComplete="current-password"
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

            <div className={`${styles.normalFlex} justify-between`}>
              <div className={`${styles.normalFlex}`}>
                <input
                  type="checkbox"
                  name="remember-me"
                  id="remember-me"
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-gray-900"
                >
                  Запомнить меня
                </label>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className='group relative w-full h-[40px] flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700'
              >
                Войти
              </button>
            </div>

            {selectedRole === "admin" ? (
              <div className="w-full text-center text-sm text-gray-600">
                Для администратора доступен только вход.
              </div>
            ) : (
              <div className={`${styles.normalFlex} w-full`}>
                <h4>Нет учетной записи?</h4>
                <Link to={signUpLink} className="text-green-600 pl-2">
                  Регистрация
                </Link>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
