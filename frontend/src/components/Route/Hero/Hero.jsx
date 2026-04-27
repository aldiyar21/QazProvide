import React from "react";
import { Link } from "react-router-dom";
import styles from "../../../styles/styles";
import { useSelector } from "react-redux";

const Hero = () => {
  const { isSeller } = useSelector((state) => state.seller);

  return (
    <div
      className={`relative min-h-[72vh] w-full overflow-hidden bg-cover bg-center bg-no-repeat 800px:min-h-[82vh] ${styles.normalFlex}`}
      style={{
        backgroundImage:
          "url(https://i.postimg.cc/rmC3dqwG/image-43-remini-enhanced.jpg)",
      }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,249,240,0.96)_0%,rgba(255,249,240,0.88)_42%,rgba(255,249,240,0.24)_100%)]" />
      <div className="absolute -left-16 top-10 h-56 w-56 rounded-full bg-[#f78f1920] blur-3xl" />
      <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-[#5ea35d20] blur-3xl" />

      <div className={`${styles.section} relative z-10 w-[90%] py-14 800px:w-[60%]`}>
        <div className="inline-flex items-center rounded-full border border-[#f78f1940] bg-white/80 px-4 py-2 text-[13px] font-[600] text-[#8a5310] shadow-sm backdrop-blur">
          Натуральные продукты и понятный онлайн-покупательский опыт
        </div>

        <h1 className="mt-5 max-w-[760px] text-[35px] font-[700] leading-[1.08] tracking-[-0.03em] text-[#1e1f1c] 800px:text-[62px]">
          Свежие продукты, которым легко доверять
        </h1>

        <p className="max-w-[700px] pt-5 text-[17px] font-[400] leading-8 text-[#3f433d]">
          Платформа помогает быстро находить качественные товары рядом с вами,
          сравнивать предложения и заказывать у местных продавцов без лишних
          шагов и перегруженного интерфейса.
        </p>

        <div className="flex flex-col gap-4 pt-8 800px:flex-row 800px:items-center">
          <Link to="/products" className="inline-block">
            <div className={`${styles.button} !mt-0 !h-[52px] !w-[220px] shadow-[0_18px_40px_rgba(247,143,25,0.25)]`}>
              <span className="text-[18px] font-bold text-[#fff]">
                Начать покупки
              </span>
            </div>
          </Link>

          {!isSeller && (
            <div className="flex flex-wrap gap-3 text-[14px] text-[#5a5f57]">
              <div className="rounded-2xl bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                Быстрый каталог
              </div>
              <div className="rounded-2xl bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                Рейтинги и отзывы
              </div>
              <div className="rounded-2xl bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
                Актуальные продажи
              </div>
            </div>
          )}
        </div>

        <div className="mt-10 grid max-w-[560px] grid-cols-1 gap-3 800px:grid-cols-3">
          <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
            <div className="text-[24px] font-[700] text-[#1e1f1c]">24/7</div>
            <p className="pt-1 text-[13px] text-[#5f645c]">
              Доступ к магазинам и товарам в любое время
            </p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
            <div className="text-[24px] font-[700] text-[#1e1f1c]">5★</div>
            <p className="pt-1 text-[13px] text-[#5f645c]">
              Прозрачные оценки и мнения покупателей
            </p>
          </div>
          <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
            <div className="text-[24px] font-[700] text-[#1e1f1c]">1 клик</div>
            <p className="pt-1 text-[13px] text-[#5f645c]">
              Быстрый переход от выбора к оформлению заказа
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
