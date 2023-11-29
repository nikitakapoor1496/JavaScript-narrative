import { useState } from "react";

const InputBox = ({ name, type, placeholder, icon, id, value }) => {

    const [passwordDisplay, setPasswordDisplayed] = useState(false)

    return (
        <div className="relative w-[100%] mb-4">
            <input name={name}
                type={type == "password" ? passwordDisplay ? "text" : "password" : type}
                placeholder={placeholder}
                defaultValue={value} id={id}
                className="input-box" />

            <i className={"fi " + icon + " input-icon"}></i>

            {
                type == "password" ?
                    <i className={"fi fi-rr-eye" + (!passwordDisplay ? "-crossed" : "") +
                        " input-icon left-[auto] right-4 cursor-pointer"}
                        onClick={() => setPasswordDisplayed(currentVal => !currentVal)}></i> : ""
            }

        </div>
    )
}

export default InputBox;