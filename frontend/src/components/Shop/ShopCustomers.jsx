import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllOrdersOfShop } from "../../redux/actions/order";
import Loader from "../Layout/Loader";
import { ModernDataGrid, TablePanel } from "../Common/ModernDataGrid";

const formatDate = (value) => {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const CustomerName = ({ name }) => (
  <div className="flex items-center gap-3">
    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e9f6df] text-[14px] font-[800] text-[#148b36]">
      {String(name || "К").charAt(0).toUpperCase()}
    </div>
    <span className="font-[800] text-[#173d21]">{name}</span>
  </div>
);

const OrdersCount = ({ count }) => (
  <span className="text-[13px] font-[800] text-[#247034]">
    {count} заказов
  </span>
);

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
    {
      field: "name",
      headerName: "Клиент",
      minWidth: 220,
      flex: 1,
      renderCell: (params) => <CustomerName name={params.value} />,
    },
    { field: "phoneNumber", headerName: "Телефон", minWidth: 160, flex: 0.9 },
    { field: "email", headerName: "Эл. почта", minWidth: 220, flex: 1.2 },
    {
      field: "ordersCount",
      headerName: "Заказы",
      minWidth: 150,
      flex: 0.7,
      renderCell: (params) => <OrdersCount count={params.value} />,
    },
    {
      field: "latestOrderDate",
      headerName: "Последний заказ",
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

  return isLoading ? (
    <Loader />
  ) : (
    <TablePanel
      title="Клиенты"
      subtitle="Контакты покупателей, количество заказов и дата последней покупки в вашем магазине."
      metric={`${rows.length} клиентов`}
    >
      <ModernDataGrid rows={rows} columns={columns} pageSize={10} />
    </TablePanel>
  );
};

export default ShopCustomers;
