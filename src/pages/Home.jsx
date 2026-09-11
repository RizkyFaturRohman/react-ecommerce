import React from "react";
import Hero from "../components/Hero";
import Category from "../components/Category";
import TopProduct from "../sections/TopProduct";
import Ad from "../components/Ad";

export default function Home() {
    return (
        <main>
            <Hero />
            <Category />
            <TopProduct />
            <Ad />
        </main>
    );
}