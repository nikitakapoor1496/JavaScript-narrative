import { Link, Outlet } from "react-router-dom";
import logo from "../imgs/logo.png";
import { useState } from "react";

const Navbar = () => {

    const [searchBox, setSearchBox] = useState(false);

    return (
        <>
            <nav className="navbar">
                <Link to="/" className="flex-none w-10">
                    <img src={logo} className="w-full" />
                </Link>

                <div className={"absolute bg-white w-full left-0 top-full mt-05 " +
                    " border-b border-grey py-4 px-[5vw] md:border-0 " +
                    "md:block md:relative md:inset-0 md:p-0 md:w-auto md:show" +
                    (searchBox ? "show" : "hide")}>
                    <input type="text" placeholder="Search here"
                        className="w-full md:w-auto bg-grey p-4 p1-6 
                                pr-[12%] md:pr-6 rounded-full 
                                placeholder:text-dark-grey md:pl-12" />

                    <i class="fi fi-br-search absolute right-[10%]
                            md:pointer-events-none md:left-5 top-1/2 
                            -translate-y-1/2 text-xl text-dark-grey"></i>
                </div>

                <div className="flex items-center gap-3 md:gap-6 ml-auto">
                    <button className="md:hidden bg-grep w-12 h-12 rounded-full
                                    flex items-center justify-center"
                        onclick={() => setSearchBox(currentVal => !currentVal)}>
                        <i className="fi fi-br-search text-xl"></i>
                    </button>

                    <Link to="/editor" className="hidden md:flex gap-2 link">
                        <i className="fi fi-ts-file-edit"></i>
                        <p>Write</p>
                    </Link>

                    <Link className="btn-dark py-2" to="/signin">
                        Sign In
                    </Link>

                    <Link className="btn-light py-2 hidden md:block" to="/signup">
                        Sign Up
                    </Link>

                </div>

            </nav>

            <Outlet />
        </>

    )
}

export default Navbar;