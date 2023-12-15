import axios from "axios";

/* @author: Jagraj Kaur
   @FileDescription: To upload the image to the AWS with the help of axios
   axios : It is the promised-based library that is helpful to use the request from third party servers to fetch or insert the data.
*/

export const uploadImage = async (img) => {

    let imgUrl = null;

    await axios.get(import.meta.env.VITE_SERVER_DOMAIN + "/get-upload-url")
    .then( async ({ data : { uploadURL } }) => {

        await axios({
            method: 'PUT',
            url: uploadURL,
            headers: { 'Content-Type': 'multipart/form-data'},
            data: img
        })
        .then(() => {
            imgUrl = uploadURL.split("?")[0]
        })

    })

    return imgUrl;
}