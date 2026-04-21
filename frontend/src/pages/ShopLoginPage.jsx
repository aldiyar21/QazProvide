import React from "react";
import { Navigate } from "react-router-dom";

const ShopLoginPage = () => {
  return <Navigate to="/login?role=shop" replace />;
};

export default ShopLoginPage;
