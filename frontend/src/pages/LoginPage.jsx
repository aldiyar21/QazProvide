import React, { useEffect } from "react";
import Login from "../components/Login/Login";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

const LoginPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useSelector((state) => state.user);
  const { isSeller } = useSelector((state) => state.seller);

  useEffect(() => {
    if (isSeller) {
      navigate("/dashboard");
    } else if (isAuthenticated) {
      navigate(user?.role === "Admin" ? "/admin/dashboard" : "/");
    }
  }, [isAuthenticated, isSeller, navigate, user]);

  return (
    <div>
      <Login />
    </div>
  );
};

export default LoginPage;
