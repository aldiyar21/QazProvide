import React, { useEffect } from "react";
import Signup from "../components/Signup/Signup";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const SignupPage = () => {
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
      <Signup />
    </div>
  );
};

export default SignupPage;
