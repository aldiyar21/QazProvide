import React from "react";
import { AiFillStar, AiOutlineStar } from "react-icons/ai";
import { BsStarHalf } from "react-icons/bs";


const Ratings = ({ rating = 0 }) => {
    const normalizedRating = Number.isFinite(Number(rating)) ? Number(rating) : 0;
    const stars = [];

    for (let i = 1; i <= 5; i++) {
        if (i <= normalizedRating) {
            stars.push(
                <AiFillStar
                    key={i}
                    size={20}
                    color="#f6b100"
                    className="mr-2 cursor-pointer"
                />
            );
        } else if (i === Math.ceil(normalizedRating) && !Number.isInteger(normalizedRating)) {
            stars.push(
                <BsStarHalf
                    key={i}
                    size={17}
                    color="#f6ba00"
                    className="mr-2 cursor-pointer"
                />
            );
        } else {
            stars.push(
                <AiOutlineStar
                    key={i}
                    size={20}
                    color="#f6ba00"
                    className="mr-2 cursor-pointer"
                />
            );
        }
    }

    return <div className="flex"> {stars}</div>;

}

export default Ratings
