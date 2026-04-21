import { DataGrid } from "@material-ui/data-grid";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllOrdersOfShop } from "../../redux/actions/order";
import Loader from "../Layout/Loader";

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const ShopCustomers = () => {
  const dispatch = useDispatch();
  const { seller } = useSelector((state) => state.seller);
  const { orders, isLoading } = useSelector((state) => state.order);

  useEffect(() => {
    if (seller?._id) {
      dispatch(getAllOrdersOfShop(seller._id));
    }
  }, [dispatch, seller?._id]);

  const columns = [
    { field: "name", headerName: "Имя клиента", minWidth: 190, flex: 1 },
    { field: "phoneNumber", headerName: "Номер телефона", minWidth: 160, flex: 1 },
    { field: "email", headerName: "Эл. почта", minWidth: 220, flex: 1.2 },
    {
      field: "ordersCount",
      headerName: "Количество заказов",
      type: "number",
      minWidth: 170,
      flex: 0.8,
    },
    {
      field: "latestOrderDate",
      headerName: "Дата последнего заказа",
      minWidth: 170,
      flex: 0.9,
    },
  ];

  const clientsMap = new Map();

  if (orders) {
    orders.forEach((order) => {
      const user = order?.user || {};
      const userId = user?._id || user?.email || order?._id;

      if (!clientsMap.has(userId)) {
        clientsMap.set(userId, {
          id: userId,
          name: user?.name || "Неизвестный клиент",
          phoneNumber: user?.phoneNumber || "-",
          email: user?.email || "-",
          ordersCount: 0,
          latestOrderTimestamp: 0,
        });
      }

      const client = clientsMap.get(userId);
      const orderDate = new Date(order?.createdAt || order?.paidAt || 0).getTime();

      client.ordersCount += 1;

      if (orderDate > client.latestOrderTimestamp) {
        client.latestOrderTimestamp = orderDate;
      }
    });
  }

  const rows = Array.from(clientsMap.values())
    .map((client) => ({
      ...client,
      latestOrderDate: formatDate(client.latestOrderTimestamp),
    }))
    .sort((a, b) => b.latestOrderTimestamp - a.latestOrderTimestamp);

  return (
    <>
      {isLoading ? (
        <Loader />
      ) : (
        <div className="w-full mx-8 pt-1 mt-10">
          <div className="bg-white rounded shadow-sm p-5">
            <div className="mb-5">
              <h2 className="text-[24px] font-[600] text-[#111827]">
                Клиенты, с которыми вы работали
              </h2>
              <p className="text-[14px] text-[#6b7280] mt-1">
                Здесь можно посмотреть контакты клиентов, количество заказов и дату последнего заказа.
              </p>
            </div>

            <DataGrid
              rows={rows}
              columns={columns}
              pageSize={10}
              disableSelectionOnClick
              autoHeight
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ShopCustomers;
