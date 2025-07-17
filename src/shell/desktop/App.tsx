import Topbar from "./topbar";
import { defaultConfig } from "../../config/default";
import Cursor from "../../assets/cursor.svg";
import { useTransition, animated } from "@react-spring/web";
const wallpaper = defaultConfig.ui.wallpaper;
function App() {
    return (
        <main className=""
            style={{
                backgroundImage: `url(${wallpaper.path})`,
                backgroundSize: wallpaper.fit,
                opacity: wallpaper.opacity,
                filter: wallpaper.blur ? "blur(8px)" : "none",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                cursor: `url(${Cursor}) 0 0, auto`, 
            }}
        >
            <Topbar />
            <div className="h-screen w-screen flex items-center justify-center ">

            </div>
        </main>
    );
}

export default App;