import React from "react";
import ShopCustomers from "../../components/Shop/ShopCustomers";
import DashboardHeader from "../../components/Shop/Layout/DashboardHeader";
import DashboardSideBar from "../../components/Shop/Layout/DashboardSideBar";

const ShopCustomersPage = () => {
  return (
    <div>
      <DashboardHeader />
      <div className="flex justify-between w-full">
        <div className="w-[80px] 800px:w-[330px]">
          <DashboardSideBar active={8} />
        </div>
        <div className="w-full justify-center flex">
          <ShopCustomers />
        </div>
      </div>
    </div>
  );
};

export default ShopCustomersPage;
