import AnimationWrapper from "../common/page-animation";
import InputBox from "../components/input.component";
import googleIcon from "../imgs/google.png";
import { Link, Navigate } from "react-router-dom";
import { useContext, useRef } from "react";
import { Toaster, toast } from "react-hot-toast";
import axios from "axios";
import { storeInSession } from "../common/session";
import { UserContext } from "../App";

const UserAuthForm = ({ type }) => {
    //const authForm = useRef();

    let { userAuth: { access_token }, setUserAuth } = useContext(UserContext)
    console.log(access_token)

    //connection to backend using VITE and axios
    const userAuthThroughServer = (serverRoute, formData) => {
        //fetch()
        console.log(import.meta.env.VITE_SERVER_DOMAIN + serverRoute, formData)

        axios.post(import.meta.env.VITE_SERVER_DOMAIN + serverRoute, formData)
            .then(({ data }) => {
                storeInSession("user", JSON.stringify(data))

                setUserAuth(data)
            })
            .catch(({ response }) => {
                console.log(response)
                toast.error(response.data.error)
            })
    }

    const handleSubmit = (evt) => {
        evt.preventDefault();

        let serverRoute = type == "sign-in" ? "/signin" : "/signup";

        //fetch data from form
        let form = new FormData(formID)
        let formData = {};

        for (let [key, value] of form.entries()) {
            formData[key] = value;
        }

        let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
        let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password


        let { fullname, email, password } = formData;

        // front-end validations
        if (fullname) { //check full name validation only for sign up and skip for sign in
            if (fullname.length <= 3) {
                return toast.error("Full name must be atleast 4 characters")
            }
        }

        if (!email.length) {
            return toast.error("Email is mandatory")
        }

        if (!emailRegex.test(email)) {
            return toast.error("Invalid email or format. Email should be in format abc@xyz.com")
        }

        if (!passwordRegex.test(password)) {
            return toast.error("Password should be between 6-20 characters and must have at least one numeric and one uppercase.")
        }


        // send data to backend server
        userAuthThroughServer(serverRoute, formData)

    }

    return (
        access_token ?

            <Navigate to="/" />

            :

            <AnimationWrapper key={type}>
                <section className="h-cover flex items-center justify-center">
                    <Toaster />
                    <form id="formID" className="w-[80%] max-w-[400px]">
                        <h1 className="text-4xl font-gelasio capatalize text-center mg-24">
                            {type == "sign-in" ? "Welcome Back" : "Join us today"}
                        </h1>

                        {
                            type == "sign-up" ?
                                <InputBox name="fullname"
                                    type="text"
                                    placeholder="Full Name here.."
                                    icon="fi-rs-user-pen" /> : ""
                        }

                        <InputBox name="email"
                            type="email"
                            placeholder="Email here.."
                            icon="fi-rs-envelope" />

                        <InputBox name="password"
                            type="password"
                            placeholder="Password here.."
                            icon="fi-rs-key" />

                        <button className="btn-dark center mt-14"
                            type="submit" onClick={handleSubmit}>
                            {type.replace("-", " ")}
                        </button>

                        <div className="relative w-full flex items-center gap-2
                                my-10 opacity-10 uppercase text-black font-bold">
                            <hr className="w-1/2 border-black" />
                            <p>or</p>
                            <hr className="w-1/2 border-black" />
                        </div>

                        <button className="btn-dark flex items-center justify-center 
                                    gap-4 w-[90%] center">
                            <img src={googleIcon} className="w-5" />
                            Continue with Google?
                        </button>

                        {
                            type == "sign-in"
                                ?
                                <p className="mt-6 text-dark-grey text-xl text-center">
                                    Don't have an account?
                                    <Link to="/signup" className="underline text-black
                                                        text-xl ml-1">
                                        Join us today
                                    </Link>
                                </p>
                                :
                                <p className="mt-6 text-dark-grey text-xl text-center">
                                    Already have an account?
                                    <Link to="/signin" className="underline text-black
                                                        text-xl ml-1">
                                        Sign in here!
                                    </Link>
                                </p>
                        }

                    </form>
                </section>
            </AnimationWrapper>

    )
}

export default UserAuthForm;