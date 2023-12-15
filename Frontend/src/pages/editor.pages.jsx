import { useContext, useState } from "react";
import { UserContext } from "../App";
import { Navigate } from "react-router-dom";
import BlogEditor from "../components/blog-editor.component";
import PublishForm from "../components/publish-form.component";
import { createContext } from "react";

/* @author: Jagraj Kaur
   @FileDescription: To execute the editor component if user is logged in or not after verifying the access token 
*/

const blogStructure = {
    title: '',
    banner: '',
    content: [],
    tags: [],
    des: '',
    author: { personal_info: {} }
}


export const EditorContext = createContext({ });

const Editor = () => {

    const [ blog, setBlog ] = useState(blogStructure);
    const [ editorState, setEditorState ] = useState("editor");   /* provide the default value as editor (can change the state to publish also) */
    const [ textEditor, setTextEditor ] = useState({ isReady: false});

    /* destructring to get the access_token from userContext (user session), 
       otherwise need to get access_token everytime like this -> UserContext.userAuth.access_token */
    let  { userAuth : { access_token} } = useContext(UserContext)

    return(
        <EditorContext.Provider value={{ blog, setBlog, editorState, setEditorState, textEditor, setTextEditor }}>
            {
                access_token === null ? <Navigate to="/signin" /> 
                : editorState == "editor" ? <BlogEditor /> : <PublishForm />
            }
        </EditorContext.Provider>
    )
}

export default Editor;