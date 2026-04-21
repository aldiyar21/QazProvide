import React from "react";
import { Navigate } from "react-router-dom";

const ShopCreatePage = () => {
  return <Navigate to="/sign-up?role=shop" replace />;
};

export default ShopCreatePage;
