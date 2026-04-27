import React, { useEffect } from "react";
import AdminHeader from "../components/Layout/AdminHeader";
import AdminSideBar from "../components/Admin/Layout/AdminSideBar";
import { useDispatch, useSelector } from "react-redux";
import { getAllOrdersOfAdmin } from "../redux/actions/order";
import {
  ModernDataGrid,
  StatusBadge,
  TablePanel,
} from "../components/Common/ModernDataGrid";

const AdminDashboardOrders = () => {
  const dispatch = useDispatch();

  const { adminOrders } = useSelector((state) => state.order);

  useEffect(() => {
    dispatch(getAllOrdersOfAdmin());
  }, [dispatch]);

  const columns = [
    { field: "id", headerName: "ID заказа", minWidth: 190, flex: 1 },
    {
      field: "status",
      headerName: "Статус",
      minWidth: 160,
      flex: 0.8,
      renderCell: (params) => <StatusBadge status={params.value} />,
    },
    {
      field: "itemsQty",
      headerName: "Товаров",
      type: "number",
      minWidth: 120,
      flex: 0.6,
    },
    {
      field: "total",
      headerName: "Итого",
      minWidth: 140,
      flex: 0.7,
    },
    {
      field: "createdAt",
      headerName: "Дата заказа",
      minWidth: 150,
      flex: 0.8,
    },
  ];

  const rows =
    adminOrders?.map((item) => ({
      id: item._id,
      itemsQty: item?.cart?.reduce((acc, item) => acc + Number(item.qty), 0),
      total: `${item?.totalPrice} ₸`,
      status: item?.status,
      createdAt: item?.createdAt?.slice(0, 10),
    })) || [];

  return (
    <div>
      <AdminHeader />
      <div className="w-full flex">
        <div className="flex items-start justify-between w-full">
          <div className="w-[80px] 800px:w-[330px]">
            <AdminSideBar active={2} />
          </div>

          <div className="w-full">
            <TablePanel
              title="Все заказы"
              subtitle="Административный обзор заказов по платформе: статус, количество товаров, сумма и дата."
              metric={`${rows.length} заказов`}
            >
              <ModernDataGrid rows={rows} columns={columns} pageSize={10} />
            </TablePanel>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardOrders;
