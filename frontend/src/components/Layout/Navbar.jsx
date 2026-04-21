import React from "react";
import { Link } from "react-router-dom";
import styles from "../../styles/styles";

const getNavItems = ({ isSeller, isAuthenticated, isAdmin }) => {
  const items = [
    { title: "Главное", url: "/" },
    { title: "Самые продаваемые продукты", url: "/best-selling" },
    { title: "Все продукты", url: "/products" },
  ];

  if (isSeller) {
    return [...items, { title: "Панель управления", url: "/dashboard" }];
  }

  if (isAuthenticated || isAdmin) {
    return items;
  }

  return [...items, { title: "Стать продавцом", url: "/sign-up?role=shop" }];
};

const Navbar = ({ active, isSeller, isAuthenticated, isAdmin }) => {
  const navItems = getNavItems({ isSeller, isAuthenticated, isAdmin });

  return (
    <div className={`block 800px:${styles.normalFlex}`}>
      {navItems.map((i, index) => (
        <div className="flex" key={index}>
          <Link
            to={i.url}
            className={`${
              active === index + 1 ? "text-[#c8ff00]" : "text-black 800px:text-[#fff]"
            } pb-[30px] 800px:pb-0 font-[500] px-6 cursor-pointer`}
          >
            {i.title}
          </Link>
        </div>
      ))}
    </div>
  );
};

export default Navbar;
